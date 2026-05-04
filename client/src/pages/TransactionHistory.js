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

    const getDisplayAmount = (t) => {
        if (role === 'Donor') return t.donorShare || 0;
        if (role === 'Orphanage') {
            let amt = 0;
            if (String(t.targetedOrphanageId) === String(userId)) amt += (t.donorShare || 0);
            if (String(t.orphanageId) === String(userId)) amt += (t.orphanageShare || 0);
            return amt;
        }
        return t.price || 0;
    };

    const getDonorSide = (t) => t.targetedOrphanageId && ngoMap[t.targetedOrphanageId] 
        ? `📍 ${ngoMap[t.targetedOrphanageId]}` 
        : "👤 Personal Payout";

    const getBuyerSide = (t) => t.orphanageId && ngoMap[t.orphanageId] 
        ? `📍 ${ngoMap[t.orphanageId]}` 
        : t.buyerDiscountAmount > 0 ? "🏷️ 40% Discount" : (t.orphanageName || "Charity Grant");

    return (
        <div style={styles.page}>
            <div style={{...styles.container, padding: isMobile ? '15px' : '30px'}}>
                <div style={styles.header}>
                    <h2 style={{color: '#333', margin: 0, fontSize: isMobile ? '16px' : '22px'}}>
                        {role === 'Orphanage' ? '🏢 NGO Grants & Impact' : 
                         role === 'Buyer' ? '🛍️ Purchase History' : '📜 My Philanthropy Log'}
                    </h2>
                </div>

                {loading ? (
                    <div style={styles.loading}>📡 Syncing Ledger...</div>
                ) : transactions.length === 0 ? (
                    <div style={styles.noData}>No outgoing records found.</div>
                ) : isMobile ? (
                    /* ✅ Mobile Card Layout */
                    <div style={styles.cardList}>
                        {transactions.map((t) => {
                            const statusInfo = getStatusStyle(t.status);
                            const displayAmount = getDisplayAmount(t);
                            return (
                                <div key={t._id} style={styles.card}>
                                    {/* Top Row */}
                                    <div style={styles.cardTop}>
                                        <div>
                                            <p style={styles.cardItemName}>{t.itemName}</p>
                                            <p style={styles.cardDate}>📅 {new Date(t.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span style={{...styles.badge, backgroundColor: statusInfo.bg, color: statusInfo.text}}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Amount */}
                                    <div style={styles.amountRow}>
                                        <span style={styles.amountLabel}>💰 Amount</span>
                                        <span style={styles.amountValue}>₹{(Number(displayAmount) || 0).toFixed(0)}</span>
                                    </div>

                                    {/* Beneficiaries */}
                                    <div style={styles.chainCard}>
                                        <div style={styles.chainRow}>
                                            <span style={styles.chainLabel}>Donor side (30%)</span>
                                            <span style={styles.chainValue}>{getDonorSide(t)}</span>
                                        </div>
                                        <div style={styles.chainRow}>
                                            <span style={styles.chainLabel}>Buyer side (40%)</span>
                                            <span style={styles.chainValue}>{getBuyerSide(t)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ✅ Desktop Table Layout */
                    <table style={styles.table}>
                        <thead>
                            <tr style={{background: '#6f42c1', color: '#fff'}}>
                                <th style={styles.th}>Item & Date</th>
                                <th style={styles.th}>Financial Impact</th>
                                <th style={styles.th}>Beneficiaries</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => {
                                const statusInfo = getStatusStyle(t.status);
                                const displayAmount = getDisplayAmount(t);
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
                                                    <strong>{getDonorSide(t)}</strong>
                                                </div>
                                                <div style={{margin:'0 15px', color:'#ccc'}}>|</div>
                                                <div>
                                                    <small>Buyer side (40%) →</small><br/>
                                                    <strong>{getBuyerSide(t)}</strong>
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
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '15px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    loading: { textAlign: 'center', padding: '50px', color: '#6f42c1' },
    noData: { textAlign: 'center', padding: '50px', color: '#999' },
    // Mobile Cards
    cardList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: { border: '1px solid #eee', borderRadius: '10px', padding: '15px', background: '#fafafa' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
    cardItemName: { fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px 0', color: '#222' },
    cardDate: { fontSize: '11px', color: '#999', margin: 0 },
    amountRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', margin: '8px 0' },
    amountLabel: { fontSize: '12px', color: '#666' },
    amountValue: { fontWeight: 'bold', color: '#27ae60', fontSize: '16px' },
    chainCard: { display: 'flex', flexDirection: 'column', gap: '6px' },
    chainRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px' },
    chainLabel: { color: '#999' },
    chainValue: { color: '#444', fontWeight: 'bold', textAlign: 'right', maxWidth: '55%' },
    // Desktop Table
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '15px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' },
    td: { padding: '15px', borderBottom: '1px solid #eee', fontSize: '13px' },
    tr: { transition: '0.3s' },
    badge: { padding: '4px 10px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block' },
    chainBox: { display: 'flex', alignItems: 'center', fontSize: '11px', color: '#444' },
};

export default TransactionHistory;