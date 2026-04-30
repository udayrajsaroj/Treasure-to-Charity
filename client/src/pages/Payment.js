import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Payment = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    if (!state) {
        navigate('/browse-items');
        return null;
    }

    const { productId, itemName, price, userName, userRole } = state;

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(async () => {
            try {
                await axios.post(`${API_BASE_URL}/api/orders/create`, {
                    productId,
                    itemName,
                    requesterName: userName,
                    requesterRole: userRole,
                    price: price,
                    status: 'Paid'
                }, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                alert('Payment Successful! Thank you for your support.');
                navigate('/my-requests');
            } catch (err) {
                console.error("Payment Error:", err);
                alert('Payment Failed. Please check your connection and try again.');
                setLoading(false);
            }
        }, 2000);
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={{color: '#28a745', textAlign: 'center'}}>Secure Checkout</h2>
                <div style={styles.summary}>
                    <p><strong>Item:</strong> {itemName}</p>
                    <p><strong>Total to Pay:</strong> ₹{price}</p>
                </div>

                <form onSubmit={handlePayment} style={styles.form}>
                    <label style={styles.label}>Card Number</label>
                    <input placeholder="1234 5678 9101 1121" required style={styles.input} />
                    
                    <div style={styles.row}>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Expiry</label>
                            <input placeholder="MM/YY" required style={styles.input} />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>CVV</label>
                            <input placeholder="123" type="password" required style={styles.input} />
                        </div>
                    </div>

                    <button type="submit" style={styles.payBtn} disabled={loading}>
                        {loading ? 'Processing...' : `Pay ₹${price} Now`}
                    </button>
                </form>
                <button onClick={() => navigate('/browse-items')} style={styles.cancelBtn}>Cancel Transaction</button>
            </div>
        </div>
    );
};

const styles = {
    page: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI' },
    card: { width: '400px', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    summary: { backgroundColor: '#e9f7ef', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#155724' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#555' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '5px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    row: { display: 'flex', gap: '15px' },
    payBtn: { padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' },
    cancelBtn: { marginTop: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline', width: '100%', textAlign: 'center' }
};

export default Payment;