import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditUser = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', role: '' });

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/users/user/${id}`, {
                    headers: { "Content-Type": "application/json" }
                });
                setFormData({ name: res.data.name, email: res.data.email, role: res.data.role });
            } catch (err) { console.error("Error loading user", err); }
        };
        fetchUser();
    }, [id, API_BASE_URL]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/users/update-user/${id}`, formData, {
                headers: { "Content-Type": "application/json" }
            });
            
            if(res.data.success) {
                alert("User Updated Successfully!");
                navigate('/manage-users');
            }
        } catch (err) { alert("Update Failed"); }
    };

    return (
        <div style={styles.container}>
            <h2 style={{textAlign: 'center', color: '#333'}}>Editing: {formData.name}</h2>
            <form onSubmit={handleUpdate} style={{marginTop: '20px'}}>
                <label style={styles.label}>Full Name</label>
                <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Full Name" 
                    style={styles.input} 
                />
                
                <label style={styles.label}>Email Address</label>
                <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="Email Address" 
                    style={styles.input} 
                />
                
                <button type="submit" style={styles.saveBtn}>💾 Save Details</button>
            </form>
        </div>
    );
};

const styles = {
    container: { maxWidth: '500px', margin: '50px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Segoe UI' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' },
    input: { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' },
    saveBtn: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }
};

export default EditUser;