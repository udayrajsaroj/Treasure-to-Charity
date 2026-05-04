import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const config = { headers: { "Content-Type": "application/json" } };

const Settings = () => {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const [isEditing, setIsEditing] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [userData, setUserData] = useState({
        name: '', email: '', role: '', ownerName: '', phone: '',
        address: '', bankName: '', accountNumber: '', ifscCode: '', upiId: ''
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            alert("✅ Profile Saved!");
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
            <div style={{...styles.header, padding: isMobile ? '0 5px' : '0'}}>
                <h2 style={{margin: 0, fontSize: isMobile ? '16px' : '20px'}}>
                    {id ? `Editing: ${userData.name}` : '👤 My Profile'}
                </h2>
            </div>

            <div style={{
                ...styles.card,
                padding: isMobile ? '20px 15px' : '40px',  // ✅ mobile pe kam padding
            }}>
                {/* Avatar */}
                <div style={styles.avatarSection}>
                    <div style={styles.avatarCircle}>
                        {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <h3 style={{margin: '8px 0 4px'}}>{userData.name}</h3>
                    <span style={styles.roleBadge}>{userData.role}</span>
                </div>

                {/* Form Grid — 1 column on mobile, 2 on desktop */}
                <div style={{
                    ...styles.formGrid,
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',  // ✅ key fix
                }}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input 
                            name="name" value={userData.name} onChange={handleChange} 
                            disabled={!isEditing} 
                            style={isEditing ? styles.inputEdit : styles.input} 
                        />
                    </div>
                    
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input 
                            value={userData.email} disabled 
                            style={{...styles.input, backgroundColor: '#f9f9f9'}} 
                        />
                    </div>

                    <div style={{...styles.divider, gridColumn: isMobile ? '1' : '1 / -1'}}>
                        Contact Details
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input 
                            name="phone" value={userData.phone || ''} onChange={handleChange} 
                            disabled={!isEditing} 
                            style={isEditing ? styles.inputEdit : styles.input} 
                        />
                    </div>

                    <div style={{
                        ...styles.fieldGroupFull, 
                        gridColumn: isMobile ? '1' : '1 / -1'  // ✅ mobile pe auto
                    }}>
                        <label style={styles.label}>Address</label>
                        <textarea 
                            name="address" value={userData.address || ''} onChange={handleChange} 
                            disabled={!isEditing} 
                            style={isEditing ? styles.textareaEdit : styles.textarea} 
                        />
                    </div>

                    {(userData.role === 'Orphanage' || userData.role === 'Donor') && (<>
                        <div style={{...styles.divider, gridColumn: isMobile ? '1' : '1 / -1'}}>
                            {userData.role === 'Donor' ? '💰 Payout Info (30% Share)' : '🏦 Banking Information'}
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
                            <label style={styles.label}>UPI ID</label>
                            <input name="upiId" value={userData.upiId || ''} onChange={handleChange} disabled={!isEditing} style={isEditing ? styles.inputEdit : styles.input} />
                        </div>
                    </>)}
                </div>

                {/* Action Buttons */}
                <div style={{
                    ...styles.actionButtons,
                    flexDirection: isMobile ? 'column' : 'row',  // ✅ mobile pe stacked
                }}>
                    {isEditing ? (<>
                        <button onClick={handleSave} style={styles.saveBtn}>💾 Save Changes</button>
                        <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
                    </>) : (<>
                        <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                            ✏️ {id ? 'Admin: Edit' : 'Edit Profile'}
                        </button>
                        {!id && <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Logout</button>}
                    </>)}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px 15px', fontFamily: 'Segoe UI' },
    header: { maxWidth: '800px', margin: '0 auto 15px auto' },
    card: { maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    avatarSection: { textAlign: 'center', marginBottom: '25px' },
    avatarCircle: { width: '75px', height: '75px', backgroundColor: '#6f42c1', color: '#fff', fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0 auto 10px auto' },
    roleBadge: { backgroundColor: '#eee', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' },
    formGrid: { display: 'grid', gap: '18px' },
    fieldGroup: { display: 'flex', flexDirection: 'column' },
    fieldGroupFull: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px', textTransform: 'uppercase' },
    input: { padding: '10px', border: 'none', borderBottom: '1px solid #eee', fontSize: '15px', color: '#333', background: 'transparent' },
    textarea: { padding: '10px', border: 'none', borderBottom: '1px solid #eee', fontSize: '15px', color: '#333', background: 'transparent', resize: 'none', height: '60px' },
    inputEdit: { padding: '10px', border: '1px solid #007bff', borderRadius: '6px', fontSize: '15px', backgroundColor: '#f0f8ff', outline: 'none' },
    textareaEdit: { padding: '10px', border: '1px solid #007bff', borderRadius: '6px', fontSize: '15px', backgroundColor: '#f0f8ff', height: '60px', outline: 'none', resize: 'none' },
    divider: { marginTop: '15px', borderBottom: '2px solid #eee', paddingBottom: '5px', color: '#6f42c1', fontWeight: 'bold', fontSize: '15px' },
    actionButtons: { marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' },
    editBtn: { flex: 1, padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    saveBtn: { flex: 1, padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    logoutBtn: { flex: 1, padding: '12px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }
};

export default Settings;