import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const ApproveDonations = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [prices, setPrices] = useState({}); 
    const [names, setNames] = useState({});
    const [descriptions, setDescriptions] = useState({}); 
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = useCallback(async () => {
        const config = { headers: { "Content-Type": "application/json" } };
        setIsLoading(true); 
        try {
            const [prodRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/products/all`, config),
                axios.get(`${API_BASE_URL}/api/orders/all`, config)
            ]);

            const products = Array.isArray(prodRes.data) ? prodRes.data : [];
            const orders = Array.isArray(orderRes.data) ? orderRes.data : [];

            const incomingFlow = products.filter(p => {
                const s = (p.status || "").toLowerCase().trim();
                if (['live', 'rejected', 'requested', 'claimed'].includes(s)) return false;
                const productOrders = orders.filter(o => String(o.productId) === String(p._id));
                const hasOutgoing = productOrders.some(o => o.orderType === 'OUTGOING');
                if (hasOutgoing) return false;
                const inboundStages = ['pending', 'going for pickup', 'on the way', 'delivered', 'received'];
                return inboundStages.includes(s);
            });

            setAllProducts(incomingFlow);
            const initialPrices = {}, initialNames = {}, initialDescs = {};
            incomingFlow.forEach(item => {
                initialPrices[item._id] = item.price || 0; 
                initialNames[item._id] = item.itemName;
                initialDescs[item._id] = item.description || "";
            });
            setPrices(initialPrices);
            setNames(initialNames);
            setDescriptions(initialDescs);
        } catch (err) { 
            console.error("Fetch Error:", err); 
        } finally { 
            setIsLoading(false); 
        }
    }, [API_BASE_URL]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleNameChange = (id, val) => setNames(prev => ({ ...prev, [id]: val }));
    const handleDescChange = (id, val) => setDescriptions(prev => ({ ...prev, [id]: val }));
    const handlePriceChange = (id, val) => setPrices(prev => ({ ...prev, [id]: val }));

    const handleApprove = async (id) => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            await axios.patch(`${API_BASE_URL}/api/products/approve/${id}`, {
                itemName: names[id], 
                price: Number(prices[id]), 
                description: descriptions[id],
                status: 'Going for Pickup' 
            }, config);
            fetchData();
        } catch (err) { alert("Approval failed."); }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Reject this donation?")) return;
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            await axios.patch(`${API_BASE_URL}/api/products/reject/${id}`, {}, config);
            fetchData();
        } catch (err) { alert("Reject failed."); }
    };

    const updateProductStatus = async (id, nextStatus) => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            await axios.patch(`${API_BASE_URL}/api/products/approve/${id}`, { status: nextStatus }, config);
            const ordersRes = await axios.get(`${API_BASE_URL}/api/orders/all`, config);
            const relatedOrder = ordersRes.data.find(o => String(o.productId) === String(id) && o.orderType === 'INCOMING');
            if (relatedOrder) {
                await axios.patch(`${API_BASE_URL}/api/orders/updateStatus/${relatedOrder._id}`, { status: nextStatus }, config);
            }
            fetchData();
        } catch (err) { alert("Status sync failed."); }
    };

    const handleMakeLive = async (id) => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            await axios.patch(`${API_BASE_URL}/api/products/make-live/${id}`, {}, config);
            alert("🚀 Item is now Live!");
            fetchData();
        } catch (err) { alert("Failed to push live."); }
    };

    const ActionButtons = ({ item }) => {
        const s = (item.status || "").toLowerCase().trim();
        return (
            <div style={styles.actionGroup}>
                {s === 'pending' && (<>
                    <button onClick={() => handleApprove(item._id)} style={styles.approveBtn}>✅ Approve</button>
                    <button onClick={() => handleReject(item._id)} style={styles.rejectBtn}>❌ Reject</button>
                </>)}
                {s === 'going for pickup' && <button onClick={() => updateProductStatus(item._id, 'On the Way')} style={styles.transitBtn}>🚚 Start Transit</button>}
                {s === 'on the way' && <button onClick={() => updateProductStatus(item._id, 'Delivered')} style={styles.arriveBtn}>🏁 Mark Arrival</button>}
                {s === 'delivered' && <button onClick={() => updateProductStatus(item._id, 'Received')} style={styles.receiveBtn}>📥 Mark Received</button>}
                {s === 'received' && <button onClick={() => handleMakeLive(item._id)} style={styles.liveBtn}>🚀 Push Live</button>}
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={{margin: 0, fontSize: isMobile ? '16px' : '20px'}}>🛠️ Inbound Control</h2>
                    <button onClick={fetchData} style={styles.refreshBtn}>🔄 Refresh</button>
                </div>

                {isLoading ? (
                    <div style={styles.loadingBox}>📡 Syncing Chain Data...</div>
                ) : allProducts.length === 0 ? (
                    <div style={styles.empty}>Inbound pipeline is clear! 🌟</div>
                ) : isMobile ? (
                    /* ✅ Mobile Card Layout */
                    <div style={styles.cardList}>
                        {allProducts.map(item => (
                            <div key={item._id} style={styles.card}>
                                {/* Image + Status */}
                                <div style={styles.cardTop}>
                                    <img src={item.image} alt="item" style={styles.cardImg} />
                                    <div style={{flex: 1}}>
                                        <span style={{...styles.badge, ...getStatusColors(item.status)}}>
                                            {item.status}
                                        </span>
                                        <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                                            👤 {item.donorName}
                                        </div>
                                        <div style={{fontSize: '11px', color: '#999'}}>
                                            📍 {item.address}
                                        </div>
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Item Name</label>
                                    <input
                                        style={styles.input}
                                        value={names[item._id] || ''}
                                        onChange={(e) => handleNameChange(item._id, e.target.value)}
                                        placeholder="Item Name"
                                    />
                                </div>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Description</label>
                                    <textarea
                                        style={styles.textarea}
                                        value={descriptions[item._id] || ''}
                                        onChange={(e) => handleDescChange(item._id, e.target.value)}
                                        placeholder="Description"
                                    />
                                </div>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Price (₹)</label>
                                    <input
                                        type="number"
                                        style={{...styles.input, width: '120px'}}
                                        value={prices[item._id] || 0}
                                        onChange={(e) => handlePriceChange(item._id, e.target.value)}
                                    />
                                </div>

                                <ActionButtons item={item} />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ✅ Desktop Table Layout */
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead style={{background: '#2c3e50', color: '#fff'}}>
                                <tr>
                                    <th style={styles.th}>Image</th>
                                    <th style={{...styles.th, width: '30%'}}>Editable Details</th>
                                    <th style={styles.th}>Donor</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProducts.map(item => (
                                    <tr key={item._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <img src={item.image} style={styles.productImg} alt="item" />
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                                <input style={styles.input} value={names[item._id] || ''} onChange={(e) => handleNameChange(item._id, e.target.value)} placeholder="Item Name" />
                                                <textarea style={styles.textarea} value={descriptions[item._id] || ''} onChange={(e) => handleDescChange(item._id, e.target.value)} placeholder="Description" />
                                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                    <span style={{fontWeight:'bold', color:'#28a745'}}>₹</span>
                                                    <input type="number" style={{...styles.input, width:'80px'}} value={prices[item._id] || 0} onChange={(e) => handlePriceChange(item._id, e.target.value)} />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <strong>👤 {item.donorName}</strong>
                                            <br/><small>📍 {item.address}</small>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{...styles.badge, ...getStatusColors(item.status)}}>{item.status}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <ActionButtons item={item} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const getStatusColors = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === 'pending') return { background: '#f8f9fa', color: '#333' };
    if (s === 'going for pickup') return { background: '#f3e5f5', color: '#6f42c1' };
    if (s === 'on the way') return { background: '#fff5eb', color: '#fd7e14' };
    if (s === 'delivered') return { background: '#e7f3ff', color: '#007bff' };
    if (s === 'received') return { background: '#d4edda', color: '#155724' };
    return { background: '#eee', color: '#666' };
};

const styles = {
    page: { padding: '15px', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Segoe UI' },
    container: { maxWidth: '1450px', margin: '0 auto', background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    // Mobile Cards
    cardList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    card: { border: '1px solid #eee', borderRadius: '12px', padding: '15px', background: '#fafafa' },
    cardTop: { display: 'flex', gap: '12px', marginBottom: '12px' },
    cardImg: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
    fieldGroup: { marginBottom: '10px' },
    label: { fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
    actionGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' },
    // Table
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tr: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '15px', verticalAlign: 'top' },
    th: { padding: '15px', textAlign: 'left', fontSize: '13px' },
    productImg: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' },
    // Common
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block' },
    input: { padding: '8px', border: '1px solid #ccc', borderRadius: '6px', width: '100%', fontSize: '13px', boxSizing: 'border-box' },
    textarea: { padding: '8px', border: '1px solid #ccc', borderRadius: '6px', width: '100%', fontSize: '12px', minHeight: '55px', resize: 'vertical', boxSizing: 'border-box' },
    approveBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    rejectBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    transitBtn: { background: '#6f42c1', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    arriveBtn: { background: '#fd7e14', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    receiveBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    liveBtn: { background: '#6f42c1', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    refreshBtn: { background: '#f8f9fa', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    loadingBox: { textAlign: 'center', padding: '50px', color: '#666' },
    empty: { textAlign: 'center', padding: '40px', color: '#999' }
};

export default ApproveDonations;