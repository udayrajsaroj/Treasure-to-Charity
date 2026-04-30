import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';
import GameBackground from './GameBackground'; 

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', role: 'Donor', registrationNumber: '', otp: ''
    });
    
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [timer, setTimer] = useState(10);
    const [canResend, setCanResend] = useState(false);

    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        let interval;
        if (otpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [otpSent, timer]);

    const validate = () => {
        let errs = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;

        if (!formData.name) errs.name = "Full Name is required";
        if (!emailRegex.test(formData.email)) errs.email = "Enter a valid email address";
        if (!phoneRegex.test(formData.phone)) errs.phone = "Phone must be exactly 10 digits";
        if (formData.password.length < 6) errs.password = "Password must be min 6 characters";
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const sendOtp = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/users/send-otp`, { email: formData.email }, {
                headers: { "Content-Type": "application/json" }
            });
            setOtpSent(true);
            setTimer(10); 
            setCanResend(false);
            alert("✨ OTP has been sent to your email!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to send OTP. Check if email exists.");
        } finally { setLoading(false); }
    };

    const handleResend = () => {
        sendOtp();
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!formData.otp) return alert("Please enter the OTP sent to your email.");
        
        setLoading(true);
        const payload = { ...formData };
        if (formData.role !== 'Orphanage') delete payload.registrationNumber;

        try {
            await axios.post(`${API_BASE_URL}/api/users/signup`, payload, {
                headers: { "Content-Type": "application/json" }
            });
            
            alert('🎉 Account Created Successfully!');
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.error || 'Verification Failed. Check OTP.');
        } finally { setLoading(false); }
    };

    return (
        <div id="signup-unique-portal">
            
            <GameBackground /> 

            <div className="auth-wrapper">
                <div className="glass-card">
                    <h2 style={styles.title}>🎁 Treasure to Charity</h2>
                    <p style={styles.subtitle}>Create your social impact account</p>

                    <form onSubmit={handleSignup} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input name="name" placeholder="Your Name" onChange={(e) => setFormData({...formData, name: e.target.value})} required style={styles.input} />
                            {errors.name && <span style={styles.error}>{errors.name}</span>}
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input name="email" type="email" placeholder="example@mail.com" onChange={(e) => setFormData({...formData, email: e.target.value})} required style={styles.input} disabled={otpSent}/>
                            {errors.email && <span style={styles.error}>{errors.email}</span>}
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input name="phone" type="text" placeholder="10 Digit Mobile" onChange={(e) => setFormData({...formData, phone: e.target.value})} required style={styles.input} />
                            {errors.phone && <span style={styles.error}>{errors.phone}</span>}
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input name="password" type="password" placeholder="••••••••" onChange={(e) => setFormData({...formData, password: e.target.value})} required style={styles.input} />
                            {errors.password && <span style={styles.error}>{errors.password}</span>}
                        </div>
                        
                        <div style={styles.inputGroup}>
                             <label style={styles.label}>Register as:</label>
                             <select name="role" onChange={(e) => setFormData({...formData, role: e.target.value})} style={styles.select}>
                                <option value="Donor">Donor (Donate Items)</option>
                                <option value="Buyer">Buyer (Buy Items)</option>
                                <option value="Orphanage">Orphanage (Receive Items)</option>
                            </select>
                        </div>

                        {formData.role === 'Orphanage' && (
                            <div style={styles.inputGroup}>
                                <label style={{...styles.label, color: '#e74c3c'}}>Registration ID *</label>
                                <input name="registrationNumber" placeholder="Govt ID" onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} required style={styles.input} />
                            </div>
                        )}

                        {otpSent && (
                            <div style={styles.inputGroup}>
                                <label style={{...styles.label, color: '#28a745'}}>Enter OTP Code</label>
                                <input name="otp" placeholder="6 Digit Code" onChange={(e) => setFormData({...formData, otp: e.target.value})} required style={{...styles.input, borderColor: '#28a745', borderWeight: '2px'}} />
                                
                                <div style={styles.resendContainer}>
                                    {canResend ? (
                                        <span onClick={handleResend} style={styles.resendLink}>
                                            Didn't receive? <b>Resend OTP</b>
                                        </span>
                                    ) : (
                                        <span style={styles.timerText}>
                                            Resend OTP in <b>{timer}s</b>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {!otpSent ? (
                            <button type="button" onClick={sendOtp} style={styles.otpBtn} disabled={loading}>
                                {loading ? 'Sending...' : 'Send Verification OTP'}
                            </button>
                        ) : (
                            <button type="submit" style={styles.btn} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>
                        )}
                    </form>

                    <p style={styles.footerText}>
                        Already a member? <Link to="/login" style={styles.link}>Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    title: { margin: '0 0 5px 0', color: '#6f42c1', fontSize: '24px', fontWeight: '800' },
    subtitle: { margin: '0 0 25px 0', color: '#666', fontSize: '14px', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#444', textTransform: 'uppercase' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', background: '#f9f9f9' },
    select: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', cursor: 'pointer' },
    otpBtn: { padding: '14px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    btn: { padding: '14px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    error: { color: '#e74c3c', fontSize: '11px', fontWeight: 'bold' },
    footerText: { marginTop: '20px', fontSize: '17px', color: '#555' },
    link: { color: '#6f42c1', textDecoration: 'none', fontWeight: 'bold' },
    resendContainer: { marginTop: '5px', textAlign: 'right', fontSize: '12px' },
    resendLink: { color: '#6f42c1', cursor: 'pointer', textDecoration: 'underline' },
    timerText: { color: '#777' }
};

export default Signup;