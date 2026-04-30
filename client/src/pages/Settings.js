import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const config = {
    headers: { 
        "Content-Type": "application/json" 
    }
};

const Settings = () => {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState({
        name: '', email: '', role: '', ownerName: '', phone: '',
        address: '', bankName: '', accountNumber: '', ifscCode: '', upiId: ''
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchUserData = useCallback(async () => {
        const targetId = id || localStorage.getItem('userId');
        if (!targetId) { navigate('/login'); return; }

        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/user/${targetId}`, config);
            setUserData(res.data);
        } catch (err) { console.error("Failed to fetch profile", err); }
    }, [id, API_BASE_URL, navigate]); 

    useEffect(() => { fetchUserData(); }, [fetchUserData]);

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const targetId = id || localStorage.getItem('userId');
        try {
            await axios.patch(`${API_BASE_URL}/api/users/update-user/${targetId}`, userData, config);
            
            if (!id) {
                localStorage.setItem('userAddress', userData.address || ""); 
                localStorage.setItem('userPhone', userData.phone || "");
                localStorage.setItem('userName', userData.name || "");
            }

            alert("✅ Profile & Bank Details Saved Permanently!");
            setIsEditing(false);
            fetchUserData();
            
            if (id) { navigate('/manage-users'); }
        } catch (err) {
            alert("❌ Failed to update. Check if Account Number/Phone is valid.");
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h2 style={{margin: 0}}>{id ? `Editing: ${userData.name}` : 'My Profile & Settings'}</h2>
            </div>

            <div style={styles.card}>
                <div style={styles.avatarSection}>
                    <div style={styles.avatarCircle}>{userData.name ? userData.name.charAt(0).toUpperCase() : '?'}</div>
                    <h3>{userData.name}</h3>
                    <span style={styles.roleBadge}>{userData.role}</span>
                </div>

                <div style={styles.formGrid}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input name="name" value={userData.name} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                    </div>
                    
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input value={userData.email} disabled style={{...styles.input, backgroundColor: '#f9f9f9'}} />
                    </div>

                    <div style={styles.divider}>Contact Details</div>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input name="phone" value={userData.phone || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                    </div>
                    <div style={styles.fieldGroupFull}>
                        <label style={styles.label}>Address</label>
                        <textarea name="address" value={userData.address || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.textareaEdit : styles.textarea} />
                    </div>

                    {(userData.role === 'Orphanage' || userData.role === 'Donor') && (
                        <>
                            <div style={styles.divider}>
                                {userData.role === 'Donor' ? 'Payout Information (For 30% Share)' : 'Banking Information'}
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Bank Name</label>
                                <input name="bankName" value={userData.bankName || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Account Number</label>
                                <input name="accountNumber" value={userData.accountNumber || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>IFSC Code</label>
                                <input name="ifscCode" value={userData.ifscCode || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>UPI ID (GPay / PhonePe)</label>
                                <input name="upiId" value={userData.upiId || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                            </div>
                        </>
                    )}
                </div>

                <div style={styles.actionButtons}>
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} style={styles.saveBtn}>💾 Save Changes</button>
                            <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} style={styles.editBtn}>✏️ {id ? 'Admin: Edit Details' : 'Edit Profile'}</button>
                            {!id && <button onClick={handleLogout} style={styles.logoutBtn}>LOGOUT</button>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '40px', fontFamily: 'Segoe UI' },
    header: { maxWidth: '800px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' },
    backLink: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
    card: { maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    avatarSection: { textAlign: 'center', marginBottom: '30px' },
    avatarCircle: { width: '80px', height: '80px', backgroundColor: '#6f42c1', color: '#fff', fontSize: '35px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0 auto 10px auto' },
    roleBadge: { backgroundColor: '#eee', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    fieldGroup: { display: 'flex', flexDirection: 'column' },
    fieldGroupFull: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }, 
    label: { fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '5px' },
    input: { padding: '10px', border: 'none', borderBottom: '1px solid #eee', fontSize: '16px', color: '#333', background: 'transparent' },
    textarea: { padding: '10px', border: 'none', borderBottom: '1px solid #eee', fontSize: '16px', color: '#333', background: 'transparent', resize: 'none', height: '60px' },
    inputEdit: { padding: '10px', border: '1px solid #007bff', borderRadius: '5px', fontSize: '16px', backgroundColor: '#f0f8ff', outline: 'none' },
    textareaEdit: { padding: '10px', border: '1px solid #007bff', borderRadius: '5px', fontSize: '16px', backgroundColor: '#f0f8ff', height: '60px', outline: 'none' },
    divider: { gridColumn: '1 / -1', marginTop: '20px', borderBottom: '2px solid #eee', paddingBottom: '5px', color: '#6f42c1', fontWeight: 'bold', fontSize: '18px' },
    actionButtons: { marginTop: '40px', display: 'flex', gap: '15px', justifyContent: 'center' },
    editBtn: { padding: '12px 25px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    saveBtn: { padding: '12px 25px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { padding: '12px 25px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    logoutBtn: { padding: '12px 25px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Settings;