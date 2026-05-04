import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    
    const [adminStats, setAdminStats] = useState({ 
        users: 0, pending: 0, active: 0, verification: 0, pendingOrders: 0, pendingTransactions: 0, warehouseInventory: 0
    });
    const [donorStats, setDonorStats] = useState({ uploads: 0, approved: 0, impact: 0, totalPayout: 0 });
    const [consumerStats, setConsumerStats] = useState({ requested: 0, received: 0, fundsValue: 0, totalSavings: 0 }); 
    const [deliveryStats, setDeliveryStats] = useState({ totalTasks: 0, pendingPickup: 0 }); 
    const [deliveryTasks, setDeliveryTasks] = useState([]); 
    const [donorHistory, setDonorHistory] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [expandedTasks, setExpandedTasks] = useState({});

    const userName = localStorage.getItem('userName');
    const rawRole = localStorage.getItem('userRole') || "";
    const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase(); 
    const userId = localStorage.getItem('userId');

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchStats = useCallback(async () => {
        const config = { headers: { "Content-Type": "application/json" } };
        setLoading(true);
        try {
            if (userRole === 'Admin') {
                const [u, p, o, v, prods] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/users/count`, config),
                    axios.get(`${API_BASE_URL}/api/products/pending`, config),
                    axios.get(`${API_BASE_URL}/api/orders/all`, config),
                    axios.get(`${API_BASE_URL}/api/users/pending-orphanages`, config),
                    axios.get(`${API_BASE_URL}/api/products/all`, config),
                    axios.get(`${API_BASE_URL}/api/messages/all`, config)
                ]);

                const orders = Array.isArray(o.data) ? o.data : [];
                const allProds = Array.isArray(prods.data) ? prods.data : [];

                setAdminStats({
                    users: u.data.totalUsers || 0,
                    pending: Array.isArray(p.data) ? p.data.length : 0,
                    verification: Array.isArray(v.data) ? v.data.length : 0,
                    warehouseInventory: allProds.filter(prod => ['received', 'live'].includes((prod.status || "").toLowerCase())).length,
                    pendingOrders: orders.filter(order => order.orderType === 'OUTGOING' && ['Requested', 'Ready for Pickup', 'Going for Pickup', 'On the Way', 'Purchased', 'Paid'].includes(order.status)).length,
                    pendingTransactions: orders.filter(o => {
                        const status = (o.status || "").toLowerCase();
                        const type = (o.orderType || "").toLowerCase();
                        const price = Number(o.price || o.originalPrice || 0);
                        const orphanage = (o.orphanageName || "").toLowerCase();

                        const isOutgoing = type === 'outgoing';
                        const hasValue = price > 0;
                        
                        const isReadyForSettlement = ['paid', 'completed', 'delivered', 'success'].includes(status);
                        const isNotYetSettled = status !== 'settled'; 

                        const isExternalNGO = orphanage !== 'central warehouse';

                        return isOutgoing && hasValue && isReadyForSettlement && isNotYetSettled && isExternalNGO;
                    }).length,
                    totalPlatformEarnings: orders.reduce((sum, o) => sum + (o.adminShare || 0), 0)
                });
            } else if (userRole === 'Deliverypartner') {
                const [ordRes, prodRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/orders/all`, config),
                    axios.get(`${API_BASE_URL}/api/products/all`, config)
                ]);

                const allOrders = Array.isArray(ordRes.data) ? ordRes.data : [];
                const allProducts = Array.isArray(prodRes.data) ? prodRes.data : [];
                
                const activeTasks = allOrders.filter(o => {
                    const status = (o.status || "").toLowerCase();
                    const isIncoming = o.orderType === 'INCOMING' || o.requesterName === "Logistics Pipeline";
                    if (isIncoming) return ['going for pickup', 'on the way'].includes(status);
                    else return ['requested', 'ready for pickup', 'on the way'].includes(status);
                }).map(order => ({ ...order, productImage: allProducts.find(p => p._id === order.productId)?.image }));
                
                setDeliveryTasks(activeTasks);
                setDeliveryStats({
                    totalTasks: activeTasks.length,
                    pendingPickup: activeTasks.filter(o => ['going for pickup', 'ready for pickup'].includes((o.status || "").toLowerCase())).length
                });
            } else if (userRole === 'Donor') {
                const [prodRes, orderRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/products/my-donations/${userId}`, config),
                    axios.get(`${API_BASE_URL}/api/orders/history/${userId}/Donor`, config)
                ]);
                const allOrders = Array.isArray(orderRes.data) ? orderRes.data : [];
                const finalDonations = allOrders.filter(o => o.orderType === 'OUTGOING'); 

                setDonorStats({
                    uploads: Array.isArray(prodRes.data) ? prodRes.data.length : 0,
                    impact: finalDonations.reduce((sum, o) => sum + (Number(o.price) || 0), 0),
                    totalPayout: finalDonations.reduce((sum, o) => sum + (o.donorShare || 0), 0)
                });
                setDonorHistory(finalDonations);
            } else {
                const res = await axios.get(`${API_BASE_URL}/api/orders/history/${userId}/${userRole}`, config);
                const allOrders = Array.isArray(res.data) ? res.data : [];
                
                const myRealRequests = allOrders.filter(o => String(o.requesterId) === String(userId) && (o.orderType === 'OUTGOING' || !o.orderType));

                const itemsForMe = allOrders.filter(o => 
                    String(o.orphanageId) === String(userId) || 
                    String(o.targetedOrphanageId) === String(userId) || 
                    String(o.requesterId) === String(userId)
                );

                const validItems = itemsForMe.filter(o => ['purchased', 'completed', 'settled', 'delivered'].includes(o.status?.toLowerCase()));

                setConsumerStats({
                    requested: myRealRequests.length, 
                    received: validItems.length,
                    totalSavings: allOrders.reduce((sum, o) => sum + (o.buyerDiscountAmount || 0), 0),
                    fundsValue: validItems.reduce((sum, o) => {
                        if (userRole === 'Orphanage') {
                            let amount = 0;
                            if (String(o.orphanageId) === String(userId)) amount += (o.orphanageShare || 0);
                            if (String(o.targetedOrphanageId) === String(userId)) amount += (o.donorShare || 0);
                            return sum + amount;
                        }
                        return sum + (o.price || 0);
                    }, 0)
                });
            }
        } catch (e) { console.error("Fetch Stats Error", e); } 
        finally { setLoading(false); }
    }, [userRole, userId, API_BASE_URL]);

    const updateStatus = async (orderId, currentStatus, productId, isIncomingTask) => {
        const config = { headers: { "Content-Type": "application/json" } };
        let nextStatus = '';
        const s = (currentStatus || "").toLowerCase();
        if (['ready for pickup', 'going for pickup', 'requested', 'paid', 'success'].includes(s)) nextStatus = 'On the Way';
        else if (s === 'on the way') nextStatus = isIncomingTask ? 'Delivered' : 'Completed'; 
        if (!nextStatus) return;
        try {
            await axios.patch(`${API_BASE_URL}/api/orders/updateStatus/${orderId}`, { status: nextStatus }, config);
            if (productId && isIncomingTask) await axios.patch(`${API_BASE_URL}/api/products/approve/${productId}`, { status: nextStatus }, config);
            alert(`✅ Status Processed: ${nextStatus}`);
            fetchStats(); 
        } catch (err) { alert("Status update failed"); }
    };

    useEffect(() => { fetchStats(); }, [fetchStats]);

    if (loading) return <div style={styles.loading}>📡 Syncing Impact Metrics & Delivery Pipeline...</div>;

    return (
        <div style={styles.mainContent}>
            <div style={styles.welcomeBox}>
                <h1 style={styles.title}>Jai Hind, {userName}! 👋</h1>
                <p style={styles.subtitle}>Dashboard Overview for <strong>{userRole} Account</strong></p>
            </div>

            {userRole === 'Admin' && (
                <div style={styles.grid}>
                    <div 
                        style={{...styles.card, borderTop: '4px solid #28a745', background: '#f6ffed'}}
                    >
                        <h2 style={{color:'#28a745'}}>₹{(Number(adminStats.totalPlatformEarnings) || 0).toFixed(0)}</h2>
                        <p><strong>Total Platform Earnings (30%)</strong></p>
                    </div>

                    <div 
                        onClick={() => navigate('/manage-users')} 
                        style={{...styles.card, borderTop: '4px solid #007bb5', cursor: 'pointer'}}
                    >
                        <h3>{adminStats.users}</h3>
                        <p>Total Registered Users</p>
                    </div>

                    <div 
                        onClick={() => navigate('/verify-users')} 
                        style={{
                            ...styles.card, 
                            borderTop: '4px solid #faad14', 
                            cursor:'pointer', 
                            background: adminStats.verification > 0 ? '#fffbe6' : '#fff'
                        }}
                    >
                        <h3>{adminStats.verification}</h3>
                        <p>📋 Pending Orphanage Verifications</p>
                    </div>

                    <div 
                        onClick={() => navigate('/approve-donations')} 
                        style={{...styles.card, borderTop: '4px solid #6f42c1', cursor: 'pointer'}}
                    >
                        <h3>{adminStats.pending}</h3>
                        <p>🎁 New Donations History</p>
                    </div>

                    <div 
                        onClick={() => navigate('/inventory-verification')} 
                        style={{...styles.card, borderTop: '4px solid #28a745', cursor:'pointer', background: '#f6ffed'}}
                    >
                        <h3>{adminStats.warehouseInventory}</h3>
                        <p>📦 Warehouse Active Stock</p>
                    </div>

                    <div 
                        onClick={() => navigate('/view-orders')} 
                        style={{...styles.card, borderTop: '4px solid #fd7e14', cursor: 'pointer'}}
                    >
                        <h3>{adminStats.pendingOrders}</h3>
                        <p>Pending Order Pipeline</p>
                    </div>

                    <div 
                        onClick={() => navigate('/admin-transactions')} 
                        style={{...styles.card, borderTop: '4px solid #ff4d4f', cursor:'pointer'}}
                    >
                        <h3>{adminStats.pendingTransactions}</h3>
                        <p>Pending Settlements Ledger</p>
                    </div>
                </div>
            )}

            {userRole === 'Deliverypartner' && (
                <div style={styles.infoBox}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'15px'}}>
                        <h3 style={{margin:0}}>📦 Current Delivery Pipeline</h3>
                        <div style={{fontSize:'12px', color:'#666'}}>
                            Total Items: <strong>{deliveryStats.totalTasks}</strong> | New: <strong>{deliveryStats.pendingPickup}</strong>
                        </div>
                    </div>
                    {deliveryTasks.length === 0 ? <p>All clear!</p> : (() => {
                        const grouped = deliveryTasks.reduce((acc, task) => {
                            const isIncoming = task.orderType === 'INCOMING' || task.requesterName === "Logistics Pipeline";
                            const key = isIncoming ? `INC-${task.donorId}` : (task.razorpayPaymentId || `OUT-${task.requesterId}-${task.shippingAddress}`);
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(task);
                            return acc;
                        }, {});
                        return Object.entries(grouped).map(([key, tasks]) => {
                            const master = tasks[0];
                            const isExpanded = expandedTasks[key]; 
                            const isIncoming = master.orderType === 'INCOMING' || master.requesterName === "Logistics Pipeline";
                            const s = (master.status || "").toLowerCase();
                            return (
                                <div key={key} style={{...styles.taskItem, flexDirection: 'column', alignItems: 'stretch', marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '12px'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <div style={{flex: 1}}><div style={{display:'flex', alignItems:'center', gap:'10px'}}><button onClick={() => setExpandedTasks(prev => ({...prev, [key]: !prev[key]}))} style={{border:'none', background:'none', cursor:'pointer', fontSize:'18px'}}>{isExpanded ? '🔽' : '▶️'}</button><strong style={{fontSize: '18px'}}>{tasks.length > 1 ? `📦 Bulk Task (${tasks.length} Items)` : `📦 ${master.itemName}`}</strong></div><div style={{background: isIncoming ? '#fff9f0' : '#f0f9ff', padding: '15px', borderRadius: '8px', border: `1px solid ${isIncoming ? '#ffe7c1' : '#c1e7ff'}`, margin: '10px 0'}}>{isIncoming ? (<><span>🔼 PICKUP: {master.donorName}</span><br/>📍 {master.shippingAddress}</>) : (<><span>🔼 PICKUP: WH</span> | <span>🔻 DROP: {master.requesterName}</span><br/>📍 {master.shippingAddress}</>)}</div></div>
                                        <button onClick={async () => { if(window.confirm('Process all?')) { for(const t of tasks) await updateStatus(t._id, t.status, t.productId, isIncoming); } }} style={s === 'on the way' ? styles.deliverBtn : styles.pickupBtn}>{s === 'on the way' ? '🏁 Finish' : '🚚 Start'}</button>
                                    </div>
                                    {isExpanded && (<div style={{marginTop: '10px', paddingLeft: '35px', borderLeft: '3px solid #6f42c1'}}>{tasks.map((t, idx) => (<div key={t._id} style={{display:'flex', alignItems:'center', gap:'15px', padding:'12px', borderBottom: '1px solid #f0f0f0'}}><img src={t.productImage} style={styles.miniImg} alt="p" /><div style={{flex: 1}}><strong>{idx + 1}. {t.itemName}</strong></div></div>))}</div>)}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            {userRole === 'Donor' && (
                <>
                    <div style={styles.grid}>
                        <div style={{...styles.card, borderTop: '4px solid #2d8a4e', background: '#f6ffed'}}><h2 style={{color:'#2d8a4e'}}>₹{(Number(donorStats.totalPayout)||0).toFixed(0)}</h2><p><strong>💰 My Total Earnings (30%)</strong></p></div>
                        <div style={{...styles.card, borderTop: '4px solid #2d8a4e', background: '#f6ffed'}}><h2>₹{donorStats.impact}</h2><p><strong>🌟 Social Impact Value</strong></p></div>
                        <div style={{...styles.card, borderTop: '4px solid #6f42c1'}}><h3>{donorStats.uploads}</h3><p>Total Items Uploaded</p></div>
                    </div>
                    <div style={styles.infoBox}>
                        <h3>🌟 My Donation History</h3>
                        {donorHistory.map(item => (
                            <div key={item._id} style={styles.taskItem}>
                                <div style={{flex: 1}}><strong>🎁 {item.itemName}</strong><br/><small>Impact: ₹{item.price}</small></div>
                                <span style={{...styles.statusBadge, backgroundColor: (item.status || "").toLowerCase() === 'going for pickup' ? '#fff9db' : '#d4edda'}}>{item.status}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {userRole === 'Buyer' && (
                <div style={styles.grid}>
                    <div style={{...styles.card, borderTop: '4px solid #6f42c1', background:'#f8f9ff'}}><h2>₹{consumerStats.fundsValue}</h2><p><strong>💝 Total Contribution</strong></p></div>
                    <div style={{...styles.card, borderTop: '4px solid #dc3545', background: '#fff5f5'}}><h2>₹{(Number(consumerStats.totalSavings) || 0).toFixed(0)}</h2><p><strong>💸 My Savings (40% Off)</strong></p></div>
                    <div style={{...styles.card, borderTop: '4px solid #e83e8c'}}><h3>{consumerStats.requested}</h3><p>Total Requests</p></div>
                    <div style={{...styles.card, borderTop: '4px solid #28a745'}}><h3>{consumerStats.received}</h3><p>Received Items</p></div>
                </div>
            )}

            {userRole === 'Orphanage' && (
                <div style={styles.grid}>
                    <div style={{...styles.card, borderTop: '4px solid #6f42c1', background:'#f8f9ff'}}>
                        <h2 style={{color: '#6f42c1', fontSize: '32px'}}>₹{consumerStats.fundsValue}</h2>
                        <p><strong>💰 Total Received Value</strong></p>
                        <small style={{color: '#888'}}>Combined verified donor and buyer side shares</small>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    mainContent: { flex: 1, padding: '20px', fontFamily: 'Segoe UI' },
    welcomeBox: { marginBottom: '30px' },
    title: { fontSize: '28px', color: '#333', fontWeight: '300', margin: '0 0 5px 0' },
    subtitle: { fontSize: '14px', color: '#888', margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '30px' },
    card: { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', transition: '0.2s' },
    infoBox: { backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #6f42c1', color: '#444' },
    taskItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px', borderRadius: '10px', marginTop: '15px', border: '1px solid #eee' },
    statusBadge: { padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
    pickupBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    deliverBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    loading: { padding: '100px', textAlign: 'center', fontSize: '20px' },
    miniImg: { width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #eee' }
};

export default Dashboard;