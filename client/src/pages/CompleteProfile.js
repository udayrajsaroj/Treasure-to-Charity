import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); 
    
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    
    const userRole = localStorage.getItem('userRole') || "";
    const userId = localStorage.getItem('userId');

    const [formData, setFormData] = useState({
        ownerName: '',
        address: '',
        phone: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        upiId: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); 

        if (!userId || userId === "undefined") {
            alert("Session expired. Please login again.");
            navigate('/login');
            return;
        }

        try {
            const res = await axios.put(`${API_BASE_URL}/api/users/complete-profile/${userId}`, 
                formData, 
                { headers: { "Content-Type": "application/json" } }
            );

            if (res.data.success) {
                localStorage.setItem('userAddress', formData.address); 
                localStorage.setItem('userPhone', formData.phone);

                alert("Profile Updated Successfully!");
                navigate('/dashboard'); 
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error updating profile.");
        } finally {
            setLoading(false); 
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h2 style={{color: '#6f42c1', textAlign: 'center'}}>Update Your Profile</h2>
                <p style={{textAlign: 'center', marginBottom: '20px', color: '#666'}}>
                    {userRole === 'Orphanage' ? "Provide details to receive donations." : "Save your details for faster checkout."}
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <h4 style={styles.sectionTitle}>1. Personal & Contact Details</h4>
                    <input name="ownerName" placeholder="Full Name" onChange={handleChange} required style={styles.input} />
                    <input name="phone" placeholder="Phone Number" onChange={handleChange} required style={styles.input} />
                    <textarea name="address" placeholder="Full Delivery Address" onChange={handleChange} required style={styles.textarea} />

                    {userRole === 'Orphanage' && (
                        <>
                            <h4 style={styles.sectionTitle}>2. Bank Details (For Receiving Funds)</h4>
                            <input name="bankName" placeholder="Bank Name" onChange={handleChange} required style={styles.input} />
                            <input name="accountNumber" placeholder="Account Number" onChange={handleChange} required style={styles.input} />
                            <input name="ifscCode" placeholder="IFSC Code" onChange={handleChange} required style={styles.input} />
                            <input name="upiId" placeholder="UPI ID (Optional)" onChange={handleChange} style={styles.input} />
                        </>
                    )}

                    <button type="submit" disabled={loading} style={{...styles.btn, opacity: loading ? 0.7 : 1}}>
                        {loading ? 'Saving...' : 'Save & Go to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f3e5f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Segoe UI', padding: '20px' },
    container: { width: '100%', maxWidth: '500px', backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    sectionTitle: { margin: '10px 0 5px 0', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '15px' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '5px', outline: 'none' },
    textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '5px', height: '80px', outline: 'none', resize: 'none' },
    btn: { padding: '15px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }
};

export default CompleteProfile;