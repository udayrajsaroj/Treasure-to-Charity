import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

 const config = { 
        headers: { 
            "Content-Type": "application/json" 
        } 
    };
const ViewOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState({});
    
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders/all`, config);
            const prodRes = await axios.get(`${API_BASE_URL}/api/products/all`, config);
            
            const allOrders = Array.isArray(res.data) ? res.data : [];
            const allProducts = Array.isArray(prodRes.data) ? prodRes.data : [];

            const mappedOrders = allOrders
                .filter(o => 
                    o.orderType === 'OUTGOING' && 
                    o.requesterName !== "Logistics Pipeline" &&
                    !['Pending', 'Delivered', 'Received'].includes(o.status)
                )
                .map(order => {
                    const product = allProducts.find(p => p._id === order.productId);
                    return { ...order, productImage: product?.image };
                });

            const groups = mappedOrders.reduce((acc, order) => {
                const groupId = order.razorpayPaymentId || `FREE-${order.requesterId}-${new Date(order.createdAt).toDateString()}`;
                if (!acc[groupId]) acc[groupId] = [];
                acc[groupId].push(order);
                return acc;
            }, {});

            setOrders(Object.values(groups)); 
        } catch (err) { 
            console.error("Fetch Error:", err); 
        } finally { 
            setLoading(false); 
        }
    }, [API_BASE_URL]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const toggleExpand = (groupId) => {
        setExpandedOrders(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const getNextAction = (currentStatus) => {
        const s = (currentStatus || "").toLowerCase();
        if (["requested", "paid", "success", "pending payment", "purchased"].includes(s)) {
            return { next: "Ready for Pickup", label: "📦 Send to Logistics", color: '#6f42c1' };
        }
        if (s === "ready for pickup") return { next: "On the Way", label: "🚚 Start Delivery", color: '#007bff' };
        if (s === "on the way") return { next: "Completed", label: "✅ Mark Handover", color: '#28a745' };
        return null; 
    };

    const handleBulkUpdate = async (groupItems, action) => {
        if (!window.confirm(`Confirm: Change status of all ${groupItems.length} items to ${action.next}?`)) return;
        
        try {
            for (const item of groupItems) {
                await axios.patch(`${API_BASE_URL}/api/orders/updateStatus/${item._id}`, { status: action.next }, config);
                if (item.productId) {
                    await axios.patch(`${API_BASE_URL}/api/products/approve/${item.productId}`, { status: action.next }, config);
                }
            }
            alert(`✅ Bulk update to ${action.next} successful!`);
            fetchOrders(); 
        } catch (err) { 
            alert("Bulk update failed. Please check your connection."); 
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <h2 style={styles.title}>📦 Outgoing Logistics Control</h2>
                            <p style={{fontSize: '12px', color: '#666', marginTop:'5px'}}>Grouped Bulk Orders for Warehouse Efficiency.</p>
                        </div>
                        <button onClick={fetchOrders} style={styles.refreshBtn}>🔄 Refresh Orders</button>
                    </div>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={styles.th}>Order Item / Dropdown</th>
                                <th style={styles.th}>Payment Reference</th>
                                <th style={styles.th}>Customer & Route</th>
                                <th style={styles.th}>Total Value</th>
                                <th style={styles.th}>Live Status</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{textAlign:'center', padding:'30px'}}>📡 Tracking outgoing shipments...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign:'center', padding:'50px', color:'#999'}}>No active outgoing shipments. 🌟</td></tr>
                            ) : orders.map((group, groupIdx) => {
                                const master = group[0]; 
                                const groupId = master.razorpayPaymentId || `FREE-${master.requesterId}`;
                                const isExpanded = expandedOrders[groupId];
                                const groupTotal = group.reduce((sum, item) => sum + (item.price || 0), 0);
                                const action = getNextAction(master.status);

                                return (
                                    <React.Fragment key={groupIdx}>
                                        <tr style={{...styles.tr, backgroundColor: isExpanded ? '#f9f9ff' : '#fff'}}>
                                            <td style={styles.td}>
                                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                    <button onClick={() => toggleExpand(groupId)} style={styles.expandBtn}>
                                                        {isExpanded ? '🔽' : '▶️'}
                                                    </button>
                                                    <div>
                                                        <div style={{fontWeight:'bold', color:'#333'}}>
                                                            {group.length > 1 ? `Bulk Order (${group.length} items)` : master.itemName}
                                                        </div>
                                                        <div style={{fontSize:'10px', color:'#888'}}>ID: {master._id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={styles.td}>
                                                <div style={{fontSize:'11px', color:'#555', fontStyle:'italic', fontWeight:'600'}}>
                                                    {master.razorpayPaymentId || "DIRECT / FREE"}
                                                </div>
                                            </td>

                                            <td style={styles.td}>
                                                <div style={styles.routeBox}>
                                                    <div style={{color:'#007bff'}}>🏁 <b>Target:</b> {master.requesterName}</div>
                                                    <div style={{fontSize:'10px', color:'#666'}}>{master.shippingAddress}</div>
                                                </div>
                                            </td>

                                            <td style={{...styles.td, fontWeight: 'bold', color: '#27ae60'}}>
                                                ₹{groupTotal}
                                            </td>

                                            <td style={styles.td}>
                                                <span style={{...styles.statusBadge, backgroundColor: master.status === 'Completed' ? '#d4edda' : '#fff3cd'}}>
                                                    {master.status}
                                                </span>
                                            </td>

                                            <td style={styles.td}>
                                                {action ? (
                                                    <button 
                                                        onClick={() => handleBulkUpdate(group, action)} 
                                                        style={{...styles.actionBtn, backgroundColor: action.color}}
                                                    >
                                                        {action.label}
                                                    </button>
                                                ) : <span style={{color:'#28a745', fontWeight:'bold'}}>✅ Done</span>}
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="6" style={{padding:'0 0 15px 50px', backgroundColor:'#fcfcfc'}}>
                                                    <div style={styles.dropdownContainer}>
                                                        {group.map((item, i) => (
                                                            <div key={i} style={styles.dropdownItem}>
                                                                <img src={item.productImage || 'https://via.placeholder.com/40'} style={styles.miniImg} alt="p" />
                                                                <div style={{flex:1}}>
                                                                    <div style={{fontSize:'12px', fontWeight:'bold'}}>{item.itemName}</div>
                                                                    <div style={{fontSize:'11px', color:'#28a745'}}>Price: ₹{item.price}</div>
                                                                </div>
                                                                <div style={{fontSize:'10px', color:'#999'}}>Ref: {item._id.slice(-6)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '30px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '100%', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    header: { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
    title: { color: '#2c3e50', margin: 0, fontSize: '24px', fontWeight: 'bold' },
    refreshBtn: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { background: '#f8f9fa' },
    th: { padding: '15px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #e9ecef', fontWeight:'700' },
    td: { padding: '15px', borderBottom: '1px solid #f1f1f1', fontSize: '13px', verticalAlign: 'middle' },
    tr: { transition: '0.2s' },
    routeBox: { background: '#f8f9fa', padding: '5px 8px', borderRadius: '6px', fontSize: '11px', border: '1px solid #eee' },
    statusBadge: { padding: '5px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' },
    actionBtn: { color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    expandBtn: { border:'none', background:'none', cursor:'pointer', fontSize:'16px' },
    dropdownContainer: { borderLeft: '3px solid #6f42c1', paddingLeft: '20px', marginTop: '10px' },
    dropdownItem: { display:'flex', alignItems:'center', gap:'15px', padding:'10px 0', borderBottom:'1px dashed #eee' },
    miniImg: { width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }
};

export default ViewOrders;