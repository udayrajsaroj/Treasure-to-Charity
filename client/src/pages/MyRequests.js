import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    const userId = localStorage.getItem('userId'); 
    const userRole = localStorage.getItem('userRole'); 

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const getFriendlyStatus = (status) => {
        const s = (status || "").toLowerCase();
        if (s === 'settled') return { label: '✅ Settled', color: '#28a745', bg: '#d4edda' };
        if (s === 'requested') return { label: '⏳ Requested', color: '#856404', bg: '#fff3cd' };
        if (s === 'ready for pickup' || s === 'approved') return { label: '📦 Preparing', color: '#6f42c1', bg: '#f3e5f5' };
        if (s === 'on the way') return { label: '🚚 In Transit', color: '#007bff', bg: '#e7f1ff' };
        if (s === 'received' || s === 'live') return { label: '🏢 At Warehouse', color: '#fd7e14', bg: '#fff5eb' };
        if (s === 'delivered' || s === 'completed' || s === 'success') return { label: '✅ Received', color: '#28a745', bg: '#d4edda' };
        if (s === 'paid' || s === 'pending payment') return { label: '💰 Processing Payment', color: '#20c997', bg: '#e6fffa' };
        return { label: status, color: '#383d41', bg: '#e2e3e5' };
    };

    const fetchMyRequests = useCallback(async () => {
        if (!userId) { navigate('/login'); return; }

        const config = { 
            headers: { 
                "Content-Type": "application/json" 
            } 
        };
        
        setLoading(true);
        try {
            const roleForAPI = (userRole === 'Orphanage') ? 'Orphanage' : 'Buyer';
            const res = await axios.get(`${API_BASE_URL}/api/orders/history/${userId}/${roleForAPI}`, config);
            
            const allOrders = Array.isArray(res.data) ? res.data : [];

            const filteredOrders = allOrders.filter(order => 
                (order.orderType === 'OUTGOING' || !order.orderType) &&
                String(order.requesterId) === String(userId) 
            );

            setRequests(filteredOrders);
        } catch (err) {
            console.error("Error loading requests", err);
        } finally {
            setLoading(false);
        }
    }, [userId, userRole, API_BASE_URL, navigate]);

    useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <h2 style={{color: userRole === 'Orphanage' ? '#6f42c1' : '#e83e8c'}}>
                        {userRole === 'Orphanage' ? '🏫 My Direct Requests' : '🛍️ My Purchase History'}
                    </h2>
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={fetchMyRequests} style={styles.refreshBtn}>🔄 Refresh</button>
                    </div>
                </header>

                <div style={styles.tableResponsive}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={styles.th}>Item Details</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Order ID / Ref</th>
                                <th style={styles.th}>Request Date</th>
                                <th style={styles.th}>Tracking Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{padding:'50px', textAlign:'center'}}>📡 Syncing your history...</td></tr>
                            ) : requests.length > 0 ? (
                                requests.map((req) => {
                                    const statusInfo = getFriendlyStatus(req.status);
                                    return (
                                        <tr key={req._id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <div style={{fontWeight:'bold', fontSize:'15px'}}>{req.itemName}</div>
                                                <div style={{fontSize:'11px', color:'#999'}}>ID: {req._id.slice(-6)}</div>
                                            </td>
                                            <td style={styles.td}>
                                                {req.price > 0 ? (
                                                    <span style={{color: '#28a745', fontWeight:'bold'}}>₹{req.price}</span>
                                                ) : (
                                                    <span style={{color: '#6f42c1', fontWeight:'bold'}}>FREE (Direct)</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{fontSize:'12px'}}>{req.razorpayPaymentId || "Personal Request"}</div>
                                                <div style={{fontSize:'10px', color:'#777'}}>{req.paymentMode || "Direct"}</div>
                                            </td>
                                            <td style={styles.td}>{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: statusInfo.bg,
                                                    color: statusInfo.color,
                                                    border: `1px solid ${statusInfo.color}33`
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={styles.noData}>
                                        <div style={{fontSize:'40px', marginBottom:'10px'}}>📪</div>
                                        No requests found yet. <br/>
                                        <span onClick={() => navigate('/browse-items')} style={{color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontWeight:'bold'}}>
                                            Browse Marketplace
                                        </span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '1100px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '15px' },
    backBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', background: '#fff', fontSize: '13px', fontWeight:'600' },
    refreshBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#f8f9fa', fontSize: '13px' },
    tableResponsive: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '2px solid #eee', backgroundColor: '#fcfcfc' },
    th: { textAlign: 'left', padding: '18px 15px', color: '#666', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1f1f1', transition: '0.2s' },
    td: { padding: '18px 15px', color: '#444', verticalAlign: 'middle' },
    statusBadge: { padding: '8px 16px', borderRadius: '25px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', minWidth: '120px', textAlign: 'center', letterSpacing: '0.5px' },
    noData: { textAlign: 'center', padding: '80px 20px', color: '#888', lineHeight: '1.8', fontSize: '16px' }
};

export default MyRequests;