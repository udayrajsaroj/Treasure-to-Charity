import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddDeliveryPartner = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', address: ''
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const config = { 
            headers: { 
                "Content-Type": "application/json"
            } 
        };
        
        try {
            const payload = { ...formData, role: 'DeliveryPartner' };
            
            const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, payload, config);
            
            if (response.data.success) {
                alert("✅ Delivery Partner Created Successfully!");
                navigate('/dashboard'); 
            }
        } catch (err) {
            console.error("Staff Creation Error:", err.response?.data);
            alert(err.response?.data?.error || err.response?.data?.message || "Error creating partner. Check backend logs.");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={{color: '#6f42c1', textAlign: 'center'}}>🚚 Add New Delivery Partner</h2>
                <p style={{textAlign: 'center', color: '#666', marginBottom: '20px'}}>
                    Create a secure account for your logistics staff.
                </p>
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required style={styles.input} />
                    <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required style={styles.input} />
                    <input type="password" name="password" placeholder="Password (Min. 6 chars)" onChange={handleChange} required style={styles.input} />
                    <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required style={styles.input} />
                    <textarea name="address" placeholder="Hub Address / Office Location" onChange={handleChange} required style={styles.textarea} />
                    
                    <button type="submit" style={styles.btn}>Create Staff Account</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
    card: { width: '400px', padding: '30px', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
    textarea: { padding: '12px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '14px', resize: 'none', height: '80px', outline: 'none' },
    btn: { padding: '12px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.3s' }
};

export default AddDeliveryPartner;