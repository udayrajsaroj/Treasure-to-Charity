import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const headers = { 
        "Content-Type": "application/json" 
    };
const ManageUsers = () => {
    const [users, setUsers] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null); 
    const [formData, setFormData] = useState({
        name: '', email: '', role: '', phone: '', address: ''
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/all`, { headers });
            setUsers(res.data);
        } catch (err) { 
            console.error("Error fetching user list", err); 
        }
    }, [API_BASE_URL]);

    useEffect(() => { 
        fetchUsers(); 
    }, [fetchUsers]);

    const handleAdminEdit = (user) => {
        setEditUser(user._id);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            address: user.address || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/users/update/${editUser}`, formData, { headers });
            if (res.data.success) {
                alert("✅ Profile updated successfully!");
                setIsModalOpen(false);
                fetchUsers(); 
            }
        } catch (err) { 
            alert("Failed to update user details."); 
        }
    };

    const handleToggleBlock = async (userId) => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/users/toggle-block/${userId}`, {}, { headers });
            if (res.data.success) {
                alert(res.data.message);
                fetchUsers();
            }
        } catch (err) { 
            alert("Status update action failed."); 
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user permanently?")) {
            try {
                const res = await axios.delete(`${API_BASE_URL}/api/users/delete-user/${userId}`, { headers });
                if (res.data.success) {
                    alert("User deleted successfully!");
                    setUsers(users.filter(user => user._id !== userId));
                }
            } catch (err) { 
                alert("Delete operation failed."); 
            }
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>System Users Management</h2>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user._id} style={styles.tr}>
                                        <td style={styles.td}>{user.name}</td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>
                                            <span style={{...styles.tag, backgroundColor: user.role === 'Admin' ? '#cfe2ff' : user.role === 'Orphanage' ? '#d1e7dd' : '#e2e3e5'}}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{...styles.tag, backgroundColor: user.isBlocked ? '#f8d7da' : '#d1e7dd', color: user.isBlocked ? '#842029' : '#0f5132'}}>
                                                {user.isBlocked ? "Blocked" : "Active"}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionGroup}>
                                                <button onClick={() => handleAdminEdit(user)} style={styles.editBtn}>✏️ Edit</button>
                                                <button onClick={() => handleToggleBlock(user._id)} style={styles.blockBtn}>
                                                    {user.isBlocked ? "🔓 Unblock" : "🚫 Block"}
                                                </button>
                                                <button onClick={() => handleDelete(user._id)} style={styles.deleteBtn}>🗑️ Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={styles.noData}>No system users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={{color: '#007bb5', marginBottom: '20px'}}>👤 Edit User Profile</h3>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input style={styles.input} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input style={styles.input} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div style={{display: 'flex', gap: '15px'}}>
                             <div style={{...styles.inputGroup, flex: 1}}>
                                <label style={styles.label}>Contact Number</label>
                                <input style={styles.input} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div style={{...styles.inputGroup, flex: 1}}>
                                <label style={styles.label}>Change Role</label>
                                <select style={styles.input} value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                    <option value="Admin">Admin</option>
                                    <option value="Donor">Donor</option>
                                    <option value="Buyer">Buyer</option>
                                    <option value="Orphanage">Orphanage</option>
                                    <option value="DeliveryPartner">Delivery Partner</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Home/Organization Address</label>
                            <textarea style={{...styles.input, minHeight: '60px'}} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div style={styles.modalActions}>
                            <button onClick={handleSaveChanges} style={styles.saveBtn}>Save Changes</button>
                            <button onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)' },
    inputGroup: { marginBottom: '15px', textAlign: 'left' },
    label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px', textTransform: 'uppercase' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
    modalActions: { display: 'flex', gap: '10px', marginTop: '25px' },
    saveBtn: { flex: 2, backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { flex: 1, backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' },
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '50px 0', fontFamily: 'Arial' },
    container: { maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { color: '#007bb5', margin: 0 },
    backBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '2px solid #007bb5' },
    th: { textAlign: 'left', padding: '15px', color: '#444', fontWeight: 'bold' },
    tr: { borderBottom: '1px solid #eee' },
    td: { padding: '15px', color: '#555', fontSize: '14px' },
    tag: { padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    actionGroup: { display: 'flex', gap: '8px' },
    editBtn: { backgroundColor: '#ffc107', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#333' },
    blockBtn: { backgroundColor: '#fd7e14', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#fff' },
    deleteBtn: { backgroundColor: '#dc3545', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#fff' },
    noData: { textAlign: 'center', padding: '40px', color: '#888' }
};

export default ManageUsers;