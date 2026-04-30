import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const InventoryVerification = () => {
    const [liveStock, setLiveStock] = useState([]);
    const [loading, setLoading] = useState(false); 
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchData = useCallback(async () => {
        const config = { 
            headers: { 
                "Content-Type": "application/json"
            } 
        };
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/products/all`, config);
            
            const liveAndCart = res.data.filter(item => item.status === 'Live' || item.status === 'In Cart');
            setLiveStock(liveAndCart);
        } catch (err) { 
            console.error("Fetch Error:", err); 
        } finally { 
            setLoading(false); 
        }
    }, [API_BASE_URL]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const startEdit = (item) => {
        setEditingId(item._id);
        setEditData({ itemName: item.itemName, price: item.price, category: item.category, description: item.description });
    };

    const handleSaveEdit = async (id) => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            await axios.patch(`${API_BASE_URL}/api/products/approve/${id}`, { ...editData, price: Number(editData.price) }, config);
            alert("✅ Product Updated Successfully!");
            setEditingId(null);
            fetchData();
        } catch (err) { alert("Save failed."); }
    };

    const handleUnpublish = async (id) => {
        const config = { headers: { "Content-Type": "application/json" } };
        if (!window.confirm("Move back to Warehouse Stock?")) return;
        try {
            await axios.patch(`${API_BASE_URL}/api/products/approve/${id}`, { status: 'Received' }, config);
            fetchData();
        } catch (err) { alert("Action failed."); }
    };

    const handleForceUnlock = async (id) => {
        const config = { headers: { "Content-Type": "application/json" } };
        if (!window.confirm("Force unlock this item? It will be removed from user's cart.")) return;
        try {
            await axios.patch(`${API_BASE_URL}/api/products/unlock/${id}`, {}, config);
            alert("🔓 Item Unlocked & marked Live!");
            fetchData();
        } catch (err) { alert("Unlock failed."); }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h2 style={{color: '#6f42c1', margin: 0}}>🛒 Live Marketplace Inventory ({liveStock.length})</h2>
                <button onClick={fetchData} style={styles.refreshBtn}>🔄 Sync Data</button>
            </div>

            {loading ? <p style={styles.loading}>📡 Refreshing Stock...</p> : (
                <div style={styles.grid}>
                    {liveStock.length === 0 ? <p style={styles.empty}>Marketplace inventory is currently empty.</p> : 
                    liveStock.map(item => (
                        <div key={item._id} style={styles.card}>
                            <div style={{
                                ...styles.badge, 
                                background: item.status === 'In Cart' ? '#ffc107' : '#28a745',
                                color: item.status === 'In Cart' ? '#000' : '#fff'
                            }}>
                                {item.status === 'In Cart' ? '🛒 IN CART' : 'LIVE'}
                            </div>

                            <img src={item.image || 'https://via.placeholder.com/150'} style={styles.img} alt="item"/>
                            
                            <div style={styles.info}>
                                {editingId === item._id ? (
                                    <div style={styles.editForm}>
                                        <input style={styles.editInput} value={editData.itemName} onChange={(e) => setEditData({...editData, itemName: e.target.value})} />
                                        <input type="number" style={styles.editInput} value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} />
                                        <div style={styles.actionGroup}>
                                            <button onClick={() => handleSaveEdit(item._id)} style={styles.saveBtn}>💾 Save</button>
                                            <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>❌</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h4 style={styles.title}>{item.itemName}</h4>
                                        <p style={styles.text}><strong>💰 Price:</strong> ₹{item.price}</p>
                                        
                                        {item.status === 'In Cart' && (
                                            <div style={{background:'#fff3cd', padding:'5px', borderRadius:'4px', marginBottom:'10px', border:'1px dashed #ffc107'}}>
                                                <div style={{fontSize:'11px', color:'#856404'}}>🔒 Locked by:</div>
                                                <div style={{fontWeight:'bold', color:'#333'}}>
                                                    {item.lockedBy?.name || "Unknown User"}
                                                </div>
                                            </div>
                                        )}

                                        <div style={styles.actionGroup}>
                                            <button onClick={() => startEdit(item)} style={styles.editBtn}>✏️ Edit</button>
                                            {item.status === 'In Cart' ? (
                                                <button onClick={() => handleForceUnlock(item._id)} style={styles.unlockBtn} title="Remove from Cart">🔓 Unlock</button>
                                            ) : (
                                                <button onClick={() => handleUnpublish(item._id)} style={styles.unpublishBtn} title="Move back to Warehouse">🚫 Stock</button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { padding: '30px', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Segoe UI' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid #6f42c1', paddingBottom: '15px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' },
    card: { background: '#fff', borderRadius: '15px', boxShadow: '0 6px 15px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative', border: '1px solid #eee' },
    badge: { position: 'absolute', top: '10px', right: '10px', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', zIndex: 2 },
    img: { width: '100%', height: '160px', objectFit: 'cover' },
    info: { padding: '15px' },
    title: { margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold', color: '#333' },
    text: { fontSize: '14px', color: '#28a745', marginBottom: '10px' },
    editInput: { padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', marginBottom: '8px', width: '92%' },
    actionGroup: { display: 'flex', gap: '10px', marginTop: '5px' },
    editBtn: { flex: 2, background: '#f8f9fa', border: '1px solid #6f42c1', color: '#6f42c1', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    unpublishBtn: { flex: 1, background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px', padding: '8px', cursor: 'pointer' },
    unlockBtn: { flex: 1, background: '#ffc107', border: '1px solid #ffecb5', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight:'bold' },
    saveBtn: { flex: 2, background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 'bold' },
    cancelBtn: { flex: 1, background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px' },
    refreshBtn: { background: '#6f42c1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' },
    empty: { textAlign: 'center', gridColumn: '1/-1', padding: '100px', color: '#999' }
};

export default InventoryVerification;