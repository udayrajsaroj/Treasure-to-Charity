import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const DonationHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole') || "Donor";
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                    _id: p._id, image: p.image, itemName: p.itemName,
                    description: p.description, address: p.address,
                    status: mappedStatus, date: p.createdAt, source: 'Upload'
                });
            });

            orders.forEach(order => {
                const pId = String(order.productId);
                if (recordMap.has(pId)) {
                    const existing = recordMap.get(pId);
                    recordMap.set(pId, { ...existing, status: "Approved", date: order.createdAt, source: 'Transaction' });
                }
            });

            setHistory(Array.from(recordMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date)));
        } catch (err) { console.error("Sync Fail"); }
        finally { setLoading(false); }
    }, [userId, role, API_BASE_URL]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleCancel = async (productId) => {
        if (!window.confirm("Are you sure you want to cancel?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${productId}`);
            alert("Cancelled!");
            fetchAllData();
        } catch (err) { alert("Error: Route or Server issue."); }
    };

    const getStatusColors = (status) => {
        if (status === "Approved") return { bg: "#e6fffa", color: "#234e52", border: "#b2f5ea" };
        if (status === "Rejected") return { bg: "#fff5f5", color: "#c53030", border: "#fed7d7" };
        return { bg: "#fffaf0", color: "#9c4221", border: "#feebc8" };
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>📜 My Donation Log</h2>
                    <button onClick={fetchAllData} style={styles.refreshBtn}>🔄 Sync</button>
                </div>

                <div style={styles.logBody}>
                    {loading ? (
                        <div style={styles.loading}>Updating your impact history...</div>
                    ) : history.length > 0 ? (
                        history.map((item) => {
                            const sc = getStatusColors(item.status);
                            return (
                                <div key={item._id} style={{
                                    ...styles.card,
                                    flexDirection: isMobile ? 'column' : 'row', // ✅ mobile pe column
                                }}>
                                    {/* Image */}
                                    <div style={{
                                        ...styles.thumbBox,
                                        width: isMobile ? '100%' : '110px',
                                        height: isMobile ? '180px' : '110px',
                                    }}>
                                        <img src={item.image} alt={item.itemName} style={styles.thumbImg} />
                                    </div>

                                    {/* Info */}
                                    <div style={styles.infoBox}>
                                        {/* Name + Status */}
                                        <div style={{
                                            ...styles.topLine,
                                            flexDirection: isMobile ? 'column' : 'row',
                                            alignItems: isMobile ? 'flex-start' : 'center',
                                            gap: isMobile ? '8px' : '0',
                                        }}>
                                            <h3 style={styles.itemName}>{item.itemName}</h3>
                                            <div style={styles.statusSection}>
                                                <span style={{
                                                    ...styles.statusTag,
                                                    backgroundColor: sc.bg,
                                                    color: sc.color,
                                                    border: `1px solid ${sc.border}`
                                                }}>
                                                    {item.status === "Approved" ? "✅ " : item.status === "Rejected" ? "❌ " : "⏳ "}
                                                    {item.status}
                                                </span>
                                                {item.status !== "Approved" && (
                                                    <button onClick={() => handleCancel(item._id)} style={styles.cancelBtn}>
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div style={styles.detailsList}>
                                            <div style={styles.detailItem}>
                                                <strong>About:</strong> {item.description}
                                            </div>
                                            <div style={styles.detailItem}>
                                                <strong>Pickup:</strong> {item.address}
                                            </div>
                                            <div style={styles.dateLine}>
                                                📅 {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={styles.empty}>Log is empty. Start donating! 🎁</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '15px 10px', fontFamily: "'Inter', sans-serif" },
    container: { maxWidth: '1150px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' },
    header: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#6b46c1', color: 'white' },
    title: { margin: 0, fontSize: '17px', fontWeight: '600' },
    refreshBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '7px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    logBody: { padding: '10px' },
    card: { 
        display: 'flex', padding: '15px', 
        borderBottom: '1px solid #f0f2f5', 
        gap: '15px', boxSizing: 'border-box',
    },
    thumbBox: { borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f0f0f0' },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
    infoBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
    topLine: { display: 'flex', justifyContent: 'space-between' },
    itemName: { margin: 0, fontSize: '16px', color: '#1a202c', fontWeight: '700' },
    statusSection: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    statusTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    cancelBtn: { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
    detailsList: { display: 'flex', flexDirection: 'column', gap: '3px' },
    detailItem: { fontSize: '13px', color: '#4a5568' },
    dateLine: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' },
    loading: { textAlign: 'center', padding: '60px', color: '#6b46c1' },
    empty: { textAlign: 'center', padding: '80px 20px', color: '#64748b' }
};

export default DonationHistory;