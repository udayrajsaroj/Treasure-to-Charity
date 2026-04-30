import React, { useEffect, useState, useCallback } from 'react';
import {  } from 'react-router-dom';
import axios from 'axios';

const AdminTransactions = () => {
    const [orders, setOrders] = useState([]);
    const [userMap, setUserMap] = useState({});
    const [selectedBank, setSelectedBank] = useState(null); 
    const [selectedDonor, setSelectedDonor] = useState(null); 

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchOrders = useCallback(async () => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            const userRes = await axios.get(`${API_BASE_URL}/api/users/all`, config);
            const map = {};
            userRes.data.forEach(u => { map[u._id] = u.name; });
            setUserMap(map);

            const res = await axios.get(`${API_BASE_URL}/api/orders/all`, config);
            const outgoingOnly = Array.isArray(res.data) 
                ? res.data.filter(order => order.orderType === 'OUTGOING' && order.price >= 0)
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
                : [];
            setOrders(outgoingOnly);
        } catch (err) { console.error("Fetch Error:", err); }
    }, [API_BASE_URL]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const viewBankDetails = async (orphanageId) => {
        if(!orphanageId) return alert("NGO ID missing!");
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/all`, config);
            const orphan = res.data.find(u => u._id === orphanageId);
            if (orphan) setSelectedBank(orphan);
            else alert("NGO bank details not found!");
        } catch (err) { alert("Error fetching bank info"); }
    };

   const viewDonorDetails = async (donorId, targetedOrphanageId, payoutPreference) => {
        const config = { headers: { "Content-Type": "application/json" } };
        
        const isTargeted = targetedOrphanageId && 
                        targetedOrphanageId !== "null" && 
                        targetedOrphanageId !== "" && 
                        targetedOrphanageId !== undefined;

        const lookupId = isTargeted ? targetedOrphanageId : donorId;

        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/all`, config);
            const targetUser = res.data.find(u => u._id === lookupId);
            
            if (targetUser) {
                setSelectedDonor(targetUser); 
            } else {
                alert("Bank account details not found for ID: " + lookupId);
            }
        } catch (err) { alert("Error fetching payout information"); }
    };

    const handleVerifyAndClose = async (orderId) => {
        if (!window.confirm("Confirm settlement of all shares?")) return;
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            await axios.patch(`${API_BASE_URL}/api/orders/updateStatus/${orderId}`, { status: 'Settled' }, config);
            alert("✅ Settlement Complete!");
            fetchOrders(); 
        } catch (err) { alert("Failed to update status."); }
    };

    return (
        <div style={styles.page}>
            <div style={{...styles.container, padding: isMobile ? '15px' : '25px'}}>
                <div style={styles.header}>
                    <div>
                        <h2 style={{margin: 0, fontSize: isMobile ? '20px' : '24px'}}>💰 Settlement Dashboard</h2>
                        <small style={{color: '#666'}}>Admin 30% | Donor 30% | NGO 40%</small>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={fetchOrders} style={styles.backBtn}>🔄 Refresh</button>
                    </div>
                </div>

                {!isMobile && (
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={styles.th}>Item & Paid</th>
                                <th style={styles.th}>Admin (30%)</th>
                                <th style={styles.th}>Donor Share (30%)</th>
                                <th style={styles.th}>NGO Share (40%)</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((item) => {
                                const isSettled = item.status === 'Settled';
                                
                                const dbAdminShare = item.adminShare || 0;
                                const dbDonorShare = item.donorShare || 0;
                                const dbOrphanageShare = item.orphanageShare || 0;

                                const isRedirected = item.targetedOrphanageId && item.targetedOrphanageId !== "null";
                                const ngoName = userMap[item.targetedOrphanageId] || "Targeted NGO";

                                return (
                                    <tr key={item._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <strong>{item.itemName}</strong>
                                            <div style={{fontSize:'11px', color:'#28a745'}}>Paid: ₹{item.price}</div>
                                        </td>
                                        <td style={{...styles.td, color: '#007bb5', fontWeight:'bold'}}>₹{dbAdminShare.toFixed(0)}</td>
                                        <td style={styles.td}>
                                            ₹{dbDonorShare.toFixed(0)} 
                                            {!isSettled && (
                                                <button 
                                                    onClick={() => viewDonorDetails(item.donorId, item.targetedOrphanageId, item.payoutPreference)} 
                                                    style={{
                                                        ...styles.miniBtn,
                                                        borderColor: isRedirected ? '#6f42c1' : '#28a745',
                                                        color: isRedirected ? '#6f42c1' : '#28a745'
                                                    }}
                                                >
                                                    👤 {isRedirected ? ngoName : "Info"}
                                                </button>
                                            )}
                                        </td>
                                        <td style={{...styles.td, color: '#2d8a4e', fontWeight:'bold'}}>
                                            ₹{dbOrphanageShare.toFixed(0)}
                                            {dbOrphanageShare > 0 && item.orphanageId && !isSettled && (
                                                <button onClick={() => viewBankDetails(item.orphanageId)} style={styles.miniBankBtn}>🏦 Bank</button>
                                            )}
                                            {dbOrphanageShare === 0 && <div style={{fontSize:'9px', color:'#dc3545'}}>40% Discount Taken</div>}
                                        </td>
                                        <td style={styles.td}>{item.status}</td>
                                        <td style={styles.td}>
                                            {!isSettled && <button onClick={() => handleVerifyAndClose(item._id)} style={styles.verifyBtn}>Settle</button>}
                                            {isSettled && <span style={{color:'#28a745'}}>✅ Done</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {isMobile && orders.map(item => {
                    const isSettled = item.status === 'Settled'; 
                    const isRedirected = item.targetedOrphanageId && item.targetedOrphanageId !== "null";
                    const ngoName = userMap[item.targetedOrphanageId] || "NGO";

                    const dbAdminShare = item.adminShare || 0;
                    const dbDonorShare = item.donorShare || 0;
                    const dbOrphanageShare = item.orphanageShare || 0;

                    return (
                    <div key={item._id} style={styles.mobileCard}>
                        <div style={styles.cardHeader}>
                            <strong>{item.itemName}</strong>
                            <span style={{color:'#28a745', fontWeight:'bold'}}>₹{item.price}</span>
                        </div>
                        <div style={styles.cardGrid}>
                            <div style={styles.shareRow}><span>Admin:</span> <strong>₹{dbAdminShare.toFixed(0)}</strong></div>
                            <div style={styles.shareRow}><span>Donor:</span> <strong>₹{dbDonorShare.toFixed(0)}</strong></div>
                            <div style={styles.shareRow}><span>NGO:</span> <strong>₹{dbOrphanageShare.toFixed(0)}</strong></div>
                        </div>
                        <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                            {!isSettled && (
                                <button onClick={() => viewDonorDetails(item.donorId, item.targetedOrphanageId, item.payoutPreference)} style={{...styles.bankBtn, flex:1, fontSize:'11px', borderColor: isRedirected ? '#6f42c1' : '#28a745', color: isRedirected ? '#6f42c1' : '#28a745'}}>
                                    👤 {isRedirected ? ngoName : "Donor Info"}
                                </button>
                            )}
                            {!isSettled && dbOrphanageShare > 0 && (
                                <button onClick={() => viewBankDetails(item.orphanageId)} style={{...styles.bankBtn, flex:1, fontSize:'11px'}}>🏦 NGO Bank</button>
                            )}
                            {!isSettled && (
                                <button onClick={() => handleVerifyAndClose(item._id)} style={{...styles.verifyBtn, flex:1.5}}>💰 Settle</button>
                            )}
                        </div>
                    </div>
                )})}
            </div>

            {(selectedBank || selectedDonor) && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modal, width: isMobile ? '90%' : '400px'}}>
                        <h3 style={{marginTop: 0, color: selectedBank ? '#6f42c1' : '#28a745'}}>
                            {selectedBank ? '🏦 NGO Bank Details' : (selectedDonor?.role === 'Orphanage' ? '🏦 Targeted NGO Payout' : '👤 Donor Payout Info')}
                        </h3>
                        <div style={styles.bankDetailBox}>
                            <p><strong>Name:</strong> {selectedBank?.name || selectedDonor?.name}</p>
                            <p><strong>Bank:</strong> {selectedBank?.bankName || selectedDonor?.bankName || 'N/A'}</p>
                            <p><strong>A/C:</strong> {selectedBank?.accountNumber || selectedDonor?.accountNumber || 'N/A'}</p>
                            <p><strong>IFSC:</strong> {selectedBank?.ifscCode || selectedDonor?.ifscCode || 'N/A'}</p>
                            <p><strong>UPI:</strong> {selectedBank?.upiId || selectedDonor?.upiId || 'N/A'}</p>
                        </div>
                        <button onClick={() => { setSelectedBank(null); setSelectedDonor(null); }} style={styles.closeBtn}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { padding: '15px', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Segoe UI' },
    container: { maxWidth: '1200px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '2px solid #6f42c1' },
    th: { textAlign: 'left', padding: '12px', color: '#444', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' },
    td: { padding: '15px 12px', borderBottom: '1px solid #f9f9f9', fontSize: '13px' },
    tr: { transition: '0.2s' },
    verifyBtn: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
    miniBankBtn: { marginLeft: '8px', background: 'none', border: '1px solid #6f42c1', color: '#6f42c1', borderRadius: '4px', fontSize: '9px', cursor:'pointer', padding:'2px 5px' },
    miniBtn: { marginLeft: '8px', background: 'none', border: '1px solid #28a745', color: '#28a745', borderRadius: '4px', fontSize: '9px', cursor:'pointer', padding:'2px 5px' },
    bankBtn: { backgroundColor: '#fff', color: '#6f42c1', border: '1px solid #6f42c1', padding: '10px', borderRadius: '6px', fontWeight: 'bold' },
    backBtn: { border: '1px solid #ddd', padding: '8px 15px', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    mobileCard: { background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '15px', marginBottom: '15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' },
    cardGrid: { display: 'grid', gap: '8px' },
    shareRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    bankDetailBox: { background: '#f8f9ff', padding: '15px', borderRadius: '8px', margin: '15px 0', fontSize: '14px', lineHeight: '1.6' },
    closeBtn: { width: '100%', padding: '10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default AdminTransactions;