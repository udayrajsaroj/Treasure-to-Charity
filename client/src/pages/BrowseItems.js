import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BrowseItems = () => {
    const [products, setProducts] = useState([]);
    const [orphanages, setOrphanages] = useState([]); 
    const [buyerWantsToDonate, setBuyerWantsToDonate] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedOrphanage, setSelectedOrphanage] = useState(''); 
    const [shippingAddress, setShippingAddress] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [payLoading, setPayLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail') || "test@example.com";
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = useCallback(async () => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            const res = await axios.get(`${API_BASE_URL}/api/products/approved`, config);
            const allItems = Array.isArray(res.data) ? res.data : [];
            setCart(allItems.filter(p => p.status === 'In Cart' && p.lockedBy === userId)); 
            setProducts(allItems.filter(p => p.status === 'Live'));

            const userRes = await axios.get(`${API_BASE_URL}/api/users/all`, config);
            if (Array.isArray(userRes.data)) {
                setOrphanages(userRes.data.filter(user => user.role === 'Orphanage' && user.isVerified));
                const curr = userRes.data.find(user => user._id === userId);
                if (curr) { setShippingAddress(curr.address || ""); setContactPhone(curr.phone || ""); }
            }
        } catch (err) { console.error("Fetch Error:", err); }
    }, [API_BASE_URL, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const addToCart = async (item) => {
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/products/lock/${item._id}`, { userId }, config);
            if (res.data.success) { fetchData(); alert("🛒 Added to Cart!"); }
        } catch (err) { alert("⚠️ Item taken!"); fetchData(); }
    };

    const removeFromCart = async (id) => {
        const config = { headers: { "Content-Type": "application/json" } };
        try { await axios.patch(`${API_BASE_URL}/api/products/unlock/${id}`, {}, config); fetchData(); } catch (err) { console.error("Unlock failed"); }
    };

    const getFinalBill = () => {
        return cart.reduce((acc, item) => {
            const original = Number(item.price) || 0;
            const discount = buyerWantsToDonate ? 0 : (original * 0.40);
            return { totalToPay: acc.totalToPay + (original - discount), originalPrice: acc.originalPrice + original };
        }, { totalToPay: 0, originalPrice: 0 });
    };

    const handleBuyerCheckout = async () => {
        if (!window.Razorpay || cart.length === 0) { alert("Razorpay SDK missing or cart empty!"); return; }
        if (buyerWantsToDonate && !selectedOrphanage) { alert("Please select an NGO!"); return; }
        if (contactPhone.length !== 10) { alert("Enter valid phone!"); return; }

        setPayLoading(true);
        const config = { headers: { "Content-Type": "application/json" } };

        try {
            const masterItem = cart[0];
            const orderRes = await axios.post(`${API_BASE_URL}/api/orders/create`, {
                productId: masterItem._id, 
                requesterId: userId, 
                requesterName: userName,
                shippingAddress, 
                phone: contactPhone, 
                buyerWantsToDonate: buyerWantsToDonate,
                orphanageId: selectedOrphanage
            }, config);

            const { razorpayOrder, success, orderId } = orderRes.data;

            if (success && razorpayOrder) {
                const options = {
                    key: "rzp_test_SF9nc2yIVsOczO", 
                    amount: razorpayOrder.amount, 
                    currency: "INR", 
                    order_id: razorpayOrder.id,
                    name: "Treasure to Charity",
                    description: "Secure Donation & Purchase",
                    image: "https://cdn-icons-png.flaticon.com/512/1000/1000957.png", 
                    handler: async function (response) {
                        try {
                            const verifyRes = await axios.post(`${API_BASE_URL}/api/orders/verify`, {
                                ...response, 
                                orderId, 
                                userEmail: localStorage.getItem('userEmail')
                            }, config);

                            if (verifyRes.data.success) {
                                const remaining = cart.slice(1);
                                for (const item of remaining) {
                                    await axios.post(`${API_BASE_URL}/api/orders/create`, {
                                        productId: item._id, 
                                        requesterId: userId, 
                                        requesterName: userName,
                                        shippingAddress, 
                                        phone: contactPhone, 
                                        buyerWantsToDonate,
                                        status: 'Purchased', 
                                        razorpayPaymentId: response.razorpay_payment_id
                                    }, config);
                                }
                                alert(`✅ Payment Successful!`); 
                                setCart([]); 
                                setIsCartOpen(false); 
                                fetchData(); 
                            }
                        } catch (err) {
                            console.error("Verification Failed");
                        }
                    },
                    modal: { 
                        ondismiss: () => setPayLoading(false),
                        escape: false 
                    },
                    prefill: { 
                        name: userName, 
                        email: userEmail, 
                        contact: contactPhone 
                    },
                    theme: { color: "#6f42c1" }
                };
                new window.Razorpay(options).open();
            }
        } catch (err) { alert("Checkout failed. Check console for CORS error."); } finally { setPayLoading(false); }
    };

    const handleOrphanageCheckout = async () => {
        if (cart.length === 0) return;
        setPayLoading(true);
        const config = { headers: { "Content-Type": "application/json" } };
        try {
            for (const item of cart) {
                await axios.post(`${API_BASE_URL}/api/orders/create`, {
                    productId: item._id, requesterId: userId, requesterName: userName,
                    shippingAddress, phone: contactPhone, buyerWantsToDonate: true, orderType: 'OUTGOING'
                }, config);
            }
            alert(`✅ Request Sent!`); setCart([]); setIsCartOpen(false); fetchData();
        } catch (err) { alert("Request failed."); } finally { setPayLoading(false); }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h2 style={{color: '#6f42c1', margin:0}}>🎁 Marketplace</h2>
                <button onClick={() => setIsCartOpen(true)} style={styles.cartBtn}>🛒 Cart ({cart.length})</button>
            </div>

            <div style={{...styles.grid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))'}}>
                {products.map((item) => (
                    <div key={item._id} style={styles.card}>
                        <img src={item.image || 'https://via.placeholder.com/300x150'} alt={item.itemName} style={styles.image} />
                        
                        <div style={styles.content}>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={styles.categoryBadge}>{item.category}</span>
                            </div>

                            <h3 style={styles.title}>{item.itemName}</h3>

                            <p style={styles.description}>
                                {item.description || "The item is in good condition and it is good for daily usage."}
                            </p>

                            <p style={styles.priceTag}>
                                {userRole === 'Orphanage' ? "FREE" : `₹${item.price}`}
                            </p>

                            <button 
                                onClick={() => addToCart(item)} 
                                style={userRole === 'Orphanage' ? styles.reqBtn : styles.addBtn}
                            >
                                Add <span style={{fontSize:'18px'}}>+</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isCartOpen && (
                <div style={styles.cartOverlay}>
                    <div style={{...styles.cartBox, width: isMobile ? '100%' : '380px'}}>
                        <div style={styles.cartHeader}>
                            <h3>🛒 Cart</h3>
                            <button onClick={() => setIsCartOpen(false)}>✖</button>
                        </div>

                        {cart.length === 0 ? (
                            <div style={{textAlign: 'center', padding: '40px 20px'}}>
                                <p style={{fontSize: '50px', margin: '0'}}>🧺</p>
                                <h4 style={{color: '#888', marginTop: '10px'}}>Your cart is empty</h4>
                                <p style={{fontSize: '12px', color: '#aaa'}}>Add some treasures to make an impact!</p>
                            </div>
                        ) : (
                            <>
                                {userRole !== 'Orphanage' && (
                                    <div style={styles.impactBox}>
                                        <p style={{fontSize:'12px', fontWeight:'bold'}}>NGO or 40% Discount?</p>
                                        <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                            <button onClick={() => setBuyerWantsToDonate(true)} style={{...styles.toggleBtn, backgroundColor: buyerWantsToDonate ? '#2d8a4e' : '#eee', color: buyerWantsToDonate ? '#fff' : '#333'}}> Support NGO </button>
                                            <button onClick={() => setBuyerWantsToDonate(false)} style={{...styles.toggleBtn, backgroundColor: !buyerWantsToDonate ? '#dc3545' : '#eee', color: !buyerWantsToDonate ? '#fff' : '#333'}}> 40% Discount </button>
                                        </div>
                                    </div>
                                )}

                                <div style={styles.cartList}>
                                    {cart.map(item => (
                                        <div key={item._id} style={styles.cartItem}>
                                            <b>{item.itemName}</b> - ₹{item.price} 
                                            <button onClick={() => removeFromCart(item._id)}>🗑️</button>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.checkoutSection}>
                                    <div style={styles.totalRow}>
                                        <span>Total:</span> 
                                        <span>₹{getFinalBill().totalToPay.toFixed(0)}</span>
                                    </div>
                                    
                                    {buyerWantsToDonate && (
                                        <select style={styles.select} value={selectedOrphanage} onChange={(e) => setSelectedOrphanage(e.target.value)}>
                                            <option value="">-- Choose NGO --</option>
                                            {orphanages.map(org => (<option key={org._id} value={org._id}>{org.name}</option>))}
                                        </select>
                                    )}

                                    <textarea style={styles.textarea} placeholder="Delivery Address" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                                    <input style={styles.input} placeholder="Contact Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                                    
                                    <button 
                                        onClick={userRole === 'Orphanage' ? handleOrphanageCheckout : handleBuyerCheckout} 
                                        style={styles.checkoutBtn} 
                                        disabled={payLoading}
                                    >
                                        {payLoading ? 'Processing...' : 'Place Order'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '15px', fontFamily: 'Segoe UI' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto 15px auto' },
    cartBtn: { padding: '8px 15px', backgroundColor: '#ffc107', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
    grid: { display: 'grid', gap: '15px', maxWidth: '1200px', margin: '0 auto' },
    card: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    image: { width: '100%', height: '140px', objectFit: 'cover' },
    content: { padding: '12px' },
    categoryBadge: { backgroundColor: '#f3e5f5', color: '#6f42c1', padding: '2px 8px', borderRadius: '15px', fontSize: '9px', fontWeight: 'bold' },
    title: { fontSize: '14px', margin: '8px 0', fontWeight:'600' },
    priceTag: { fontWeight: 'bold', color: '#28a745', fontSize: '15px', marginBottom:'10px' },
    addBtn: { width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'11px', fontWeight:'bold' },
    reqBtn: { width: '100%', padding: '10px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'11px', fontWeight:'bold' },
    cartOverlay: { position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
    cartBox: { backgroundColor: '#fff', height: '100%', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflowY:'auto' },
    cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    impactBox: { background: '#f0f7ff', padding: '12px', borderRadius: '8px', margin: '15px 0' },
    toggleBtn: { flex: 1, padding: '8px', fontSize: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    cartList: { flex: 1, marginTop: '10px' },
    cartItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px dashed #eee', paddingBottom: '8px', fontSize: '12px' },
    checkoutSection: { borderTop: '2px solid #eee', paddingTop: '10px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' },
    checkoutBtn: { width: '100%', padding: '12px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    textarea: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '50px', marginBottom: '5px' },
    input: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '5px' },
    select: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '5px' }
};

export default BrowseItems;