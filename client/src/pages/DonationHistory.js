import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const DonationHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole') || "Donor";
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchAllData = useCallback(async () => {
        if (!userId) return;
        const config = { headers: { "Content-Type": "application/json" } };
        setLoading(true);

        try {
            const [ordersRes, productsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/orders/history/${userId}/${role}`, config),
                axios.get(`${API_BASE_URL}/api/products/my-donations/${userId}`, config)
            ]);

            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
            const products = Array.isArray(productsRes.data) ? (productsRes.data.data || productsRes.data) : [];

            const recordMap = new Map();

            products.forEach(p => {
                const pId = String(p._id);
                let mappedStatus = "Upload"; 
                if (p.status === 'Live') mappedStatus = "Approved";
                if (p.status === 'Rejected') mappedStatus = "Rejected";

                recordMap.set(pId, {
                    _id: p._id,
                    image: p.image,
                    itemName: p.itemName,
                    description: p.description,
                    address: p.address,
                    status: mappedStatus,
                    date: p.createdAt,
                    source: 'Upload'
                });
            });

            orders.forEach(order => {
                const pId = String(order.productId);
                if (recordMap.has(pId)) {
                    const existing = recordMap.get(pId);
                    recordMap.set(pId, {
                        ...existing,
                        status: "Approved", 
                        date: order.createdAt,
                        source: 'Transaction'
                    });
                }
            });

            setHistory(Array.from(recordMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date)));
        } catch (err) { console.error("Sync Fail"); }
        finally { setLoading(false); }
    }, [userId, role, API_BASE_URL]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleCancel = async (productId) => {
        if (!window.confirm("Bhai, are you sure you want to cancel?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${productId}`);
            alert("Cancelled!");
            fetchAllData();
        } catch (err) {
            alert("Error: Route or Server issue.");
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>📜 My Donation Log</h2>
                    <button onClick={fetchAllData} style={styles.refreshBtn}>Sync Records</button>
                </div>

                <div style={styles.logBody}>
                    {loading ? (
                        <div style={styles.loading}>Updating your impact history...</div>
                    ) : history.length > 0 ? (
                        history.map((item) => (
                            <div key={item._id} style={styles.card}>
                                <div style={styles.thumbBox}>
                                    <img src={item.image} alt={item.itemName} style={styles.thumbImg} />
                                </div>
                                
                                <div style={styles.infoBox}>
                                    <div style={styles.topLine}>
                                        <div style={styles.nameSection}>
                                            <h3 style={styles.itemName}>{item.itemName}</h3>
                                        </div>
                                        
                                        <div style={styles.statusSection}>
                                            <span style={{
                                                ...styles.statusTag, 
                                                backgroundColor: item.status === "Approved" ? "#e6fffa" : item.status === "Rejected" ? "#fff5f5" : "#fffaf0",
                                                color: item.status === "Approved" ? "#234e52" : item.status === "Rejected" ? "#c53030" : "#9c4221",
                                                border: `1px solid ${item.status === "Approved" ? "#b2f5ea" : item.status === "Rejected" ? "#fed7d7" : "#feebc8"}`
                                            }}>
                                                {item.status === "Approved" ? "✅ " : item.status === "Rejected" ? "❌ " : "⏳ "}{item.status}
                                            </span>
                                            {item.status !== "Approved" && (
                                                <button onClick={() => handleCancel(item._id)} style={styles.cancelBtn}>Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={styles.detailsList}>
                                        <div style={styles.detailItem}>
                                            <strong>About:</strong> {item.description}
                                        </div>
                                        <div style={styles.detailItem}>
                                            <strong>Pickup:</strong> {item.address}
                                        </div>
                                        <div style={styles.dateLine}>
                                            📅 Posted: {new Date(item.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.empty}>Log is empty. Start donating!</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '20px 10px', fontFamily: "'Inter', sans-serif" },
    
    container: { maxWidth: '1150px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' },
    
    header: { padding: '18px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#6b46c1', color: 'white' },
    title: { margin: 0, fontSize: '19px', fontWeight: '600' },
    refreshBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '7px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    
    logBody: { padding: '15px' },
    
    card: { display: 'flex', padding: '15px', borderBottom: '1px solid #f0f2f5', alignItems: 'center', gap: '20px' },
    
    thumbBox: { width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f0f0f0' },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
    
    infoBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
    topLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    
    nameSection: { display: 'flex', alignItems: 'center', gap: '10px' },
    itemName: { margin: 0, fontSize: '18px', color: '#1a202c', fontWeight: '700' },
    
    transBadge: { backgroundColor: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
    uploadBadge: { backgroundColor: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
    
    statusSection: { display: 'flex', alignItems: 'center', gap: '10px' },
    statusTag: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    cancelBtn: { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
    
    detailsList: { display: 'flex', flexDirection: 'column', gap: '2px' },
    detailItem: { fontSize: '14px', color: '#4a5568' },
    dateLine: { fontSize: '12px', color: '#94a3b8', marginTop: '5px' },
    
    loading: { textAlign: 'center', padding: '60px', color: '#6b46c1' },
    empty: { textAlign: 'center', padding: '100px', color: '#64748b' }
};

export default DonationHistory;