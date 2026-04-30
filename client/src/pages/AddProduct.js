import React, { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
    const [orphanages, setOrphanages] = useState([]);

    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Clothing', 
        description: '',
        image: '',    
        address: '', 
        phone: '',
        price: '',
        payoutPreference: 'DONATE_ALL',
        targetedOrphanageId: '' 
    });

    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false); 

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'payoutPreference' && value !== 'DONATE_ALL') {
            setFormData({ ...formData, [name]: value, targetedOrphanageId: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { 
                alert("❌ Image size must be less than 2MB!");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
                setPreview(reader.result);
            };
            reader.readAsDataURL(file); 
        }
    };

    const fetchOrphanages = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/all`, {
                headers: { "Content-Type": "application/json" }
            });
            const filtered = res.data.filter(u => u.role === 'Orphanage' && u.isVerified);
            setOrphanages(filtered);
        } catch (err) { console.error("Error fetching NGOs", err); }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchOrphanages();
    }, [fetchOrphanages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!/^\d{10}$/.test(formData.phone)) {
            alert("❌ Please enter a valid 10-digit mobile number!");
            return;
        }

        if (formData.payoutPreference === 'DONATE_ALL' && !formData.targetedOrphanageId) {
            alert("❌ Please select an Orphanage to support!");
            return;
        }

        const donorName = localStorage.getItem('userName');
        const donorId = localStorage.getItem('userId'); 
        const donorEmail = localStorage.getItem('userEmail');

        if (!donorId || donorId === "undefined") {
            alert("Session expired. Please login again.");
            navigate('/login');
            return;
        }

        setLoading(true); 
        try {
            await axios.post(`${API_BASE_URL}/api/products/add`, {
                ...formData,
                price: Number(formData.price),
                donorName, donorId, donorEmail,
                status: "Pending" 
            }, {
                headers: { "Content-Type": "application/json" }
            });

            alert('✅ Success! Donation submitted for approval.');
            navigate('/donation-history'); 
        } catch (err) {
            alert('Donation failed. Please check backend.');
        } finally {
            setLoading(false); 
        }
    };

    return (
        <div style={styles.page}>
            <div style={{...styles.container, padding: isMobile ? '20px' : '30px'}}>
                <h2 style={styles.mainTitle}>Post Donation</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Item Name</label>
                    <input name="itemName" placeholder="e.g. Winter Clothes" onChange={handleChange} required style={styles.input} />

                    <div style={{...styles.row, flexDirection: isMobile ? 'column' : 'row'}}>
                        <div style={{flex: 1}}><label style={styles.label}>Value (₹)</label><input name="price" type="number" onChange={handleChange} required style={styles.input} /></div>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} style={styles.select}>
                                <option value="Clothing">Clothing</option>
                                <option value="Books">Books</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Toys">Toys</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.payoutSection}>
                        <label style={styles.label}>Donation Mode</label>
                        <div style={{...styles.radioGroup, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '20px'}}>
                            <label style={styles.radioLabel}><input type="radio" name="payoutPreference" value="DONATE_ALL" checked={formData.payoutPreference === 'DONATE_ALL'} onChange={handleChange}/><span style={{marginLeft: '8px'}}>😇 100% Charity</span></label>
                            <label style={styles.radioLabel}><input type="radio" name="payoutPreference" value="TAKE_30" checked={formData.payoutPreference === 'TAKE_30'} onChange={handleChange}/><span style={{marginLeft: '8px'}}>💰 Get 30% Back</span></label>
                        </div>
                    </div>

                    {formData.payoutPreference === 'DONATE_ALL' && (
                        <div style={{marginTop: '15px'}}>
                            <label style={{...styles.label, color: '#6f42c1'}}>Support Targeted Orphanage</label>
                            <select 
                                name="targetedOrphanageId" 
                                value={formData.targetedOrphanageId} 
                                onChange={handleChange} 
                                style={{...styles.select, borderColor: '#6f42c1'}}
                            >
                                <option value="">-- Select orphanage to support --</option>
                                {orphanages.map(ngo => (
                                    <option key={ngo._id} value={ngo._id}>{ngo.name}</option> 
                                ))}
                            </select>
                        </div>
                    )}

                    <label style={styles.label}>Product Description</label>
                    <textarea name="description" placeholder="Describe condition..." onChange={handleChange} required style={styles.textareaLarge} />

                    <label style={styles.label}>Pickup Phone</label>
                    <input name="phone" placeholder="10-digit mobile" onChange={handleChange} required style={styles.input} />

                    <label style={styles.label}>Pickup Address</label>
                    <textarea name="address" placeholder="Full address..." onChange={handleChange} required style={styles.textareaSmall} />

                    <label style={styles.label}>Product Image</label>
                    <div style={{...styles.imageSection, flexDirection: isMobile ? 'column' : 'row'}}>
                        <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fileInput} />
                        {preview && <img src={preview} alt="Preview" style={styles.previewImg} />}
                    </div>

                    <div style={{...styles.btnGroup, flexDirection: isMobile ? 'column-reverse' : 'row'}}>
                        <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>Cancel</button>
                        <button type="submit" style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}} disabled={loading}>{loading ? 'Submitting...' : 'Submit Donation'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' },
    container: { width: '100%', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    mainTitle: { color: '#2d8a4e', textAlign: 'center', marginBottom: '20px', fontSize: '22px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    row: { display: 'flex', gap: '15px' },
    label: { fontWeight: 'bold', color: '#555', fontSize: '13px', marginBottom: '5px', display: 'block' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    select: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', width: '100%' },
    payoutSection: { background: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee' },
    radioGroup: { display: 'flex', marginTop: '8px' },
    radioLabel: { fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    imageSection: { display: 'flex', alignItems: 'center', gap: '15px', border: '1px dashed #ccc', padding: '10px', borderRadius: '8px' },
    previewImg: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' },
    textareaSmall: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', height: '60px', resize: 'none', width: '100%', boxSizing: 'border-box' },
    textareaLarge: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', height: '100px', resize: 'none', width: '100%', boxSizing: 'border-box' },
    fileInput: { fontSize: '12px' },
    btnGroup: { display: 'flex', gap: '10px', marginTop: '10px' },
    submitBtn: { flex: 2, padding: '14px', backgroundColor: '#2d8a4e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
    cancelBtn: { flex: 1, padding: '14px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default AddProduct;