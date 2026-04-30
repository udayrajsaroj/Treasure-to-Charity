import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ngoMap, setNgoMap] = useState({}); 
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!userId) return;
        const config = { headers: { "Content-Type": "application/json" } };
        setLoading(true);
        try {
            const userRes = await axios.get(`${API_BASE_URL}/api/users/all`, config);
            const map = {};
            userRes.data.forEach(u => { map[u._id] = u.name; });
            setNgoMap(map);

            const res = await axios.get(`${API_BASE_URL}/api/orders/history/${userId}/${role}`, config);
            let allData = Array.isArray(res.data) ? res.data : [];

            const outgoingOnly = allData.filter(t => t.orderType === 'OUTGOING');
            
            setTransactions(outgoingOnly.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, [userId, role, API_BASE_URL]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const getStatusStyle = (status) => {
        const s = (status || "").toLowerCase();
        if (s === 'settled') return { bg: '#d4edda', text: '#155724', label: '✅ Settled' };
        if (['purchased', 'delivered', 'completed'].includes(s)) 
            return { bg: '#e7f3ff', text: '#004085', label: '📦 Successful' };
        return { bg: '#fff3cd', text: '#856404', label: `⏳ ${status}` };
    };

    return (
        <div style={styles.page}>
            <div style={{...styles.container, padding: isMobile ? '15px' : '30px'}}>
                <div style={styles.header}>
                    <h2 style={{color: '#333', margin: 0, fontSize: isMobile ? '18px' : '22px'}}>
                        {role === 'Orphanage' ? '🏢 NGO Grants & Impact' : 
                         role === 'Buyer' ? '🛍️ Purchase History' : '📜 My Philanthropy Log'}
                    </h2>
                </div>

                <div style={{overflowX: 'auto'}}>
                    {!isMobile && (
                        <table style={styles.table}>
                            <thead>
                                <tr style={{background: '#6f42c1', color: '#fff'}}>
                                    <th style={styles.th}>Item & Date</th>
                                    <th style={styles.th}>Financial Impact</th>
                                    <th style={styles.th}>Beneficiaries (Dual NGO)</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{padding:'40px', textAlign:'center'}}>📡 Syncing Ledger...</td></tr>
                                ) : transactions.length > 0 ? transactions.map((t) => {
                                    const statusInfo = getStatusStyle(t.status);
                                    
                                    let displayAmount = 0;
                                    if (role === 'Donor') {
                                        displayAmount = t.donorShare || 0;
                                    } else if (role === 'Orphanage') {
                                        if (String(t.targetedOrphanageId) === String(userId)) displayAmount += (t.donorShare || 0);
                                        if (String(t.orphanageId) === String(userId)) displayAmount += (t.orphanageShare || 0);
                                    } else {
                                        displayAmount = t.price || 0;
                                    }

                                    return (
                                        <tr key={t._id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <strong>{t.itemName}</strong>
                                                <div style={{fontSize:'10px', color:'#999'}}>{new Date(t.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{...styles.td, color: '#27ae60', fontWeight: 'bold'}}>
                                                ₹{(Number(displayAmount) || 0).toFixed(0)}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.chainBox}>
                                                    <div>
                                                        <small>Donor side (30%) →</small><br/>
                                                        <strong>
                                                            {t.targetedOrphanageId && ngoMap[t.targetedOrphanageId] 
                                                                ? `📍 ${ngoMap[t.targetedOrphanageId]}` 
                                                                : "👤 Personal Payout"}
                                                        </strong>
                                                    </div>
                                                    <div style={{margin:'0 15px', color:'#ccc'}}>|</div>
                                                    <div>
                                                        <small>Buyer side (40%) →</small><br/>
                                                        <strong>
                                                            {t.orphanageId && ngoMap[t.orphanageId] 
                                                                ? `📍 ${ngoMap[t.orphanageId]}` 
                                                                : (t.buyerDiscountAmount > 0)
                                                                    ? "🏷️ 40% Discount Taken" 
                                                                    : (t.orphanageName || "Charity Grant")}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{...styles.badge, backgroundColor: statusInfo.bg, color: statusInfo.text}}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }) : <tr><td colSpan="4" style={styles.noData}>No outgoing records found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    backBtn: { border: '1px solid #ddd', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', background:'#fff', fontWeight:'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '15px', textAlign: 'left', fontSize: '12px', fontWeight:'bold' },
    td: { padding: '15px', borderBottom: '1px solid #eee', fontSize: '13px' },
    tr: { transition: '0.3s', cursor: 'default' },
    badge: { padding: '5px 12px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold', display:'inline-block' },
    chainBox: { display: 'flex', alignItems: 'center', fontSize: '11px', color: '#444' },
    noData: { padding: '50px', textAlign: 'center', color: '#999' }
};

export default TransactionHistory;