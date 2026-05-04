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
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            const payload = { ...formData, role: 'DeliveryPartner' };
            const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, payload, config);
            if (response.data.success) {
                alert("✅ Delivery Partner Created Successfully!");
                navigate('/dashboard'); 
            }
        } catch (err) {
            console.error("Staff Creation Error:", err.response?.data);
            alert(err.response?.data?.error || err.response?.data?.message || "Error creating partner.");
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.iconWrapper}>🚚</div>
                <h2 style={styles.title}>Add Delivery Partner</h2>
                <p style={styles.subtitle}>Create a secure account for your logistics staff.</p>
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input 
                            type="text" name="name" 
                            placeholder="Enter full name" 
                            onChange={handleChange} required 
                            style={styles.input} 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input 
                            type="email" name="email" 
                            placeholder="email@example.com" 
                            onChange={handleChange} required 
                            style={styles.input} 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input 
                            type="password" name="password" 
                            placeholder="Min. 6 characters" 
                            onChange={handleChange} required 
                            style={styles.input} 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input 
                            type="text" name="phone" 
                            placeholder="10 digit mobile number" 
                            onChange={handleChange} required 
                            style={styles.input} 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Hub Address</label>
                        <textarea 
                            name="address" 
                            placeholder="Hub Address / Office Location" 
                            onChange={handleChange} required 
                            style={styles.textarea} 
                        />
                    </div>
                    
                    <button type="submit" style={styles.btn}>
                        ✅ Create Staff Account
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { 
        minHeight: '100vh',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        padding: '20px',
        boxSizing: 'border-box',
        backgroundColor: '#f4f7f6',
    },
    card: { 
        width: '100%',
        maxWidth: '450px',       // ✅ mobile pe full width, desktop pe 450px
        padding: '30px 25px', 
        background: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
    },
    iconWrapper: {
        fontSize: '40px',
        textAlign: 'center',
        marginBottom: '10px',
    },
    title: {
        color: '#6f42c1', 
        textAlign: 'center',
        margin: '0 0 8px 0',
        fontSize: '22px',
    },
    subtitle: {
        textAlign: 'center', 
        color: '#888', 
        marginBottom: '25px',
        fontSize: '13px',
    },
    form: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    label: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#555',
        textTransform: 'uppercase',
    },
    input: { 
        padding: '12px', 
        borderRadius: '8px', 
        border: '1px solid #ddd', 
        fontSize: '14px', 
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',  // ✅ overflow nahi hoga
    },
    textarea: { 
        padding: '12px', 
        borderRadius: '8px', 
        border: '1px solid #ddd', 
        fontSize: '14px', 
        resize: 'none', 
        height: '80px', 
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',  // ✅ overflow nahi hoga
        fontFamily: 'inherit',
    },
    btn: { 
        padding: '14px', 
        background: '#6f42c1', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '15px',
        marginTop: '5px',
    }
};

export default AddDeliveryPartner;