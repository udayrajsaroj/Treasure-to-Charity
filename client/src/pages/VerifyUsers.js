import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const config = {
        headers: {
            "Content-Type": "application/json"
        }
    };
const VerifyUsers = () => {
    const [orphanages, setOrphanages] = useState([]);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchPending = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/pending-orphanages`, config);
            setOrphanages(res.data);
        } catch (err) {
            console.error("Error fetching pending users:", err);
        }
    }, [API_BASE_URL]);

    useEffect(() => { 
        fetchPending(); 
    }, [fetchPending]);

    const handleVerify = async (id) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/users/verify-user/${id}`, {}, config);
            alert("✅ Orphanage Verified Successfully! They can now access the platform.");
            fetchPending();
        } catch (err) {
            console.error("Verification Error:", err);
            alert("Verification Failed. Please check your connection.");
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 style={{color: '#d35400', margin: 0}}>Verify Orphanage Registrations</h2>
                </div>
                
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={{borderBottom: '2px solid #d35400'}}>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Govt Reg. No</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orphanages.length > 0 ? orphanages.map((user) => (
                                <tr key={user._id} style={{borderBottom: '1px solid #eee'}}>
                                    <td style={styles.td}>{user.name}</td>
                                    <td style={styles.td}>{user.email}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>{user.registrationNumber || 'N/A'}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleVerify(user._id)} style={styles.verifyBtn}>
                                            ✅ Approve
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{padding: '40px', textAlign: 'center', color: '#888'}}>
                                        No pending orphanage verifications. 🌟
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
    page: { backgroundColor: '#fdf2e9', minHeight: '100vh', padding: '40px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '900px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    backBtn: { cursor: 'pointer', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '6px', backgroundColor: '#fff', color: '#007bff', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px', color: '#555', fontSize: '14px', fontWeight: 'bold' },
    td: { padding: '15px', fontSize: '14px', color: '#333' },
    badge: { backgroundColor: '#f8f9fa', border: '1px solid #ddd', padding: '4px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px' },
    verifyBtn: { backgroundColor: '#27ae60', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }
};

export default VerifyUsers;