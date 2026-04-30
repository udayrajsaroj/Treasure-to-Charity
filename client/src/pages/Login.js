import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; 
import GameBackground from './GameBackground'; 

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false); 
    const [loading, setLoading] = useState(false); 

    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/users/login`, {
                email: formData.email.toLowerCase().trim(),
                password: formData.password
            }, {
                headers: { "Content-Type": "application/json" }
            });

            const user = res.data.user;
            localStorage.setItem('userToken', res.data.token);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userId', user._id); 

            alert('🚀 Login Successful! Welcome back.');
            
            if (user.role === 'Orphanage' && !user.isProfileComplete) {
                navigate('/complete-profile');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            alert(err.response?.data?.message || 'Login Failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="login-unique-portal"> 
            <GameBackground /> 

            <div className="auth-wrapper">
                <div className="glass-card">
                    <h2 style={styles.title}>Welcome Back 👋</h2>
                    <p style={styles.subtitle}>Login to your Social Impact Account</p>
                    
                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="udayraj@example.com" 
                                onChange={handleChange} 
                                required 
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="••••••••" 
                                    onChange={handleChange} 
                                    required 
                                    style={styles.input}
                                />
                                <span 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showPassword ? '👁️' : '🙈'}
                                </span>
                            </div>
                        </div>

                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? 'Authenticating...' : 'Login to Account'}
                        </button>
                    </form>

                    <p style={styles.footerText}>
                        Don't have an account? <Link to="/signup" style={styles.link}>Create one here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    title: { margin: '0 0 5px 0', color: '#ffffff', fontSize: '32px', fontWeight: '800', textShadow: '0 2px 10px rgba(0,0,0,0.2)' },
    subtitle: { margin: '0 0 30px 0', color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' },
    input: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', fontSize: '16px', background: 'rgba(255, 255, 255, 0.95)', outline: 'none', transition: 'all 0.3s' },
    eyeIcon: { position: 'absolute', right: '15px', top: '12px', cursor: 'pointer', fontSize: '20px' },
    button: { padding: '16px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', boxShadow: '0 8px 20px rgba(111, 66, 193, 0.4)', transition: '0.3s' },
    footerText: { marginTop: '25px', fontSize: '18px', color: '#ffffff' },
    link: { color: '#ffffff', textDecoration: 'underline', fontWeight: 'bold' }
};

export default Login;