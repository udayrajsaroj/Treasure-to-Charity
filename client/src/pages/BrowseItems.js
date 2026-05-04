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
        try { await axios.patch(`${API_BASE_URL}/api/products/unlock/${id}`, {}, config); fetchData(); } 
        catch (err) { console.error("Unlock failed"); }
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
                productId: masterItem._id, requesterId: userId, requesterName: userName,
                shippingAddress, phone: contactPhone, buyerWantsToDonate, orphanageId: selectedOrphanage
            }, config);

            const { razorpayOrder, success, orderId } = orderRes.data;
            if (success && razorpayOrder) {
                const options = {
                    key: "rzp_test_SF9nc2yIVsOczO", 
                    amount: razorpayOrder.amount, currency: "INR", order_id: razorpayOrder.id,
                    name: "Treasure to Charity",
                    description: "Secure Donation & Purchase",
                    handler: async function (response) {
                        try {
                            const verifyRes = await axios.post(`${API_BASE_URL}/api/orders/verify`, {
                                ...response, orderId, userEmail: localStorage.getItem('userEmail')
                            }, config);
                            if (verifyRes.data.success) {
                                const remaining = cart.slice(1);
                                for (const item of remaining) {
                                    await axios.post(`${API_BASE_URL}/api/orders/create`, {
                                        productId: item._id, requesterId: userId, requesterName: userName,
                                        shippingAddress, phone: contactPhone, buyerWantsToDonate,
                                        status: 'Purchased', razorpayPaymentId: response.razorpay_payment_id
                                    }, config);
                                }
                                alert(`✅ Payment Successful!`); 
                                setCart([]); setIsCartOpen(false); fetchData(); 
                            }
                        } catch (err) { console.error("Verification Failed"); }
                    },
                    modal: { ondismiss: () => setPayLoading(false), escape: false },
                    prefill: { name: userName, email: userEmail, contact: contactPhone },
                    theme: { color: "#6f42c1" }
                };
                new window.Razorpay(options).open();
            }
        } catch (err) { alert("Checkout failed."); } 
        finally { setPayLoading(false); }
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
        } catch (err) { alert("Request failed."); } 
        finally { setPayLoading(false); }
    };

    return (
        <div style={styles.page}>

            {/* ✅ Flipkart-style Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.headerTitle}>🛍️ Shop & Donate</h2>
                    <p style={styles.headerSub}>{products.length} items available</p>
                </div>
                <button onClick={() => setIsCartOpen(true)} style={styles.cartBtn}>
                    🛒 <span style={styles.cartBadge}>{cart.length}</span>
                </button>
            </div>

            {/* ✅ Flipkart-style Grid */}
            {products.length === 0 ? (
                <div style={styles.empty}>
                    <p style={{fontSize: '50px'}}>📦</p>
                    <p>No items available right now.</p>
                </div>
            ) : (
                <div style={{
                    ...styles.grid,
                    gridTemplateColumns: isMobile 
                        ? 'repeat(2, 1fr)'        // ✅ Mobile: 2 columns like Flipkart
                        : 'repeat(auto-fill, minmax(200px, 1fr))'
                }}>
                    {products.map((item) => (
                        <div key={item._id} style={styles.card}>
                            {/* Product Image */}
                            <div style={styles.imgWrapper}>
                                <img 
                                    src={item.image || 'https://via.placeholder.com/300x150'} 
                                    alt={item.itemName} 
                                    style={styles.image} 
                                />
                            </div>

                            {/* Product Info */}
                            <div style={styles.content}>
                                <p style={styles.categoryBadge}>{item.category}</p>
                                <p style={styles.title}>{item.itemName}</p>
                                <p style={styles.description}>
                                    {(item.description || "Good condition item.").slice(0, 45)}...
                                </p>
                                <p style={styles.priceTag}>
                                    {userRole === 'Orphanage' ? (
                                        <span style={{color: '#28a745'}}>FREE</span>
                                    ) : (
                                        <>
                                            <span style={styles.price}>₹{item.price}</span>
                                            <span style={styles.discount}> 40% off</span>
                                        </>
                                    )}
                                </p>
                                <button 
                                    onClick={() => addToCart(item)} 
                                    style={userRole === 'Orphanage' ? styles.reqBtn : styles.addBtn}
                                >
                                    {userRole === 'Orphanage' ? 'Request' : '+ Add'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ Cart Drawer */}
            {isCartOpen && (
                <div style={styles.cartOverlay}>
                    <div style={{...styles.cartBox, width: isMobile ? '100%' : '380px'}}>
                        <div style={styles.cartHeader}>
                            <h3 style={{margin: 0}}>🛒 My Cart ({cart.length})</h3>
                            <button onClick={() => setIsCartOpen(false)} style={styles.closeBtn}>✖</button>
                        </div>

                        {cart.length === 0 ? (
                            <div style={styles.emptyCart}>
                                <p style={{fontSize: '50px', margin: 0}}>🧺</p>
                                <p style={{color: '#888'}}>Cart is empty!</p>
                            </div>
                        ) : (
                            <>
                                {userRole !== 'Orphanage' && (
                                    <div style={styles.impactBox}>
                                        <p style={{fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0'}}>
                                            Choose your preference:
                                        </p>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <button 
                                                onClick={() => setBuyerWantsToDonate(true)} 
                                                style={{
                                                    ...styles.toggleBtn, 
                                                    backgroundColor: buyerWantsToDonate ? '#2d8a4e' : '#eee', 
                                                    color: buyerWantsToDonate ? '#fff' : '#333'
                                                }}
                                            >
                                                💚 Support NGO
                                            </button>
                                            <button 
                                                onClick={() => setBuyerWantsToDonate(false)} 
                                                style={{
                                                    ...styles.toggleBtn, 
                                                    backgroundColor: !buyerWantsToDonate ? '#dc3545' : '#eee', 
                                                    color: !buyerWantsToDonate ? '#fff' : '#333'
                                                }}
                                            >
                                                💰 40% Off
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cart Items */}
                                <div style={styles.cartList}>
                                    {cart.map(item => (
                                        <div key={item._id} style={styles.cartItem}>
                                            <img 
                                                src={item.image} alt={item.itemName} 
                                                style={styles.cartItemImg} 
                                            />
                                            <div style={{flex: 1}}>
                                                <p style={styles.cartItemName}>{item.itemName}</p>
                                                <p style={styles.cartItemPrice}>₹{item.price}</p>
                                            </div>
                                            <button 
                                                onClick={() => removeFromCart(item._id)} 
                                                style={styles.removeBtn}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Checkout */}
                                <div style={styles.checkoutSection}>
                                    <div style={styles.totalRow}>
                                        <span style={{fontWeight: 'bold'}}>Total:</span>
                                        <span style={{fontWeight: 'bold', color: '#28a745', fontSize: '18px'}}>
                                            ₹{getFinalBill().totalToPay.toFixed(0)}
                                        </span>
                                    </div>

                                    {buyerWantsToDonate && userRole !== 'Orphanage' && (
                                        <select 
                                            style={styles.input} 
                                            value={selectedOrphanage} 
                                            onChange={(e) => setSelectedOrphanage(e.target.value)}
                                        >
                                            <option value="">-- Choose NGO to support --</option>
                                            {orphanages.map(org => (
                                                <option key={org._id} value={org._id}>{org.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    <textarea 
                                        style={styles.input} 
                                        placeholder="📍 Delivery Address" 
                                        value={shippingAddress} 
                                        onChange={(e) => setShippingAddress(e.target.value)} 
                                        rows={2}
                                    />
                                    <input 
                                        style={styles.input} 
                                        placeholder="📞 Contact Phone" 
                                        value={contactPhone} 
                                        onChange={(e) => setContactPhone(e.target.value)} 
                                    />

                                    <button 
                                        onClick={userRole === 'Orphanage' ? handleOrphanageCheckout : handleBuyerCheckout} 
                                        style={{...styles.checkoutBtn, opacity: payLoading ? 0.7 : 1}} 
                                        disabled={payLoading}
                                    >
                                        {payLoading ? 'Processing...' : '🛒 Place Order'}
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
    page: { backgroundColor: '#f0f0f0', minHeight: '100vh', fontFamily: 'Segoe UI' },
    // Header
    header: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#6f42c1', padding: '12px 15px', position: 'sticky', top: 0, zIndex: 100,
    },
    headerTitle: { color: '#fff', margin: 0, fontSize: '18px' },
    headerSub: { color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '11px' },
    cartBtn: { 
        position: 'relative', background: '#ffc107', border: 'none', 
        borderRadius: '50%', width: '45px', height: '45px', fontSize: '18px', 
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    cartBadge: { 
        position: 'absolute', top: '-5px', right: '-5px',
        background: '#dc3545', color: '#fff', borderRadius: '50%', 
        width: '18px', height: '18px', fontSize: '10px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
    },
    // Grid
    grid: { display: 'grid', gap: '8px', padding: '10px', maxWidth: '1200px', margin: '0 auto' },
    // ✅ Flipkart-style Card
    card: { 
        backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', 
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
    },
    imgWrapper: { 
        background: '#f9f9f9', display: 'flex', 
        justifyContent: 'center', alignItems: 'center', padding: '10px',
    },
    image: { width: '100%', height: '130px', objectFit: 'contain' },
    content: { padding: '8px 10px 12px' },
    categoryBadge: { 
        backgroundColor: '#f3e5f5', color: '#6f42c1', 
        padding: '2px 6px', borderRadius: '10px', 
        fontSize: '9px', fontWeight: 'bold', display: 'inline-block', margin: '0 0 4px 0',
    },
    title: { 
        fontSize: '13px', fontWeight: '600', color: '#212121', 
        margin: '0 0 4px 0', lineHeight: '1.3',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    description: { fontSize: '11px', color: '#888', margin: '0 0 6px 0', lineHeight: '1.4' },
    priceTag: { margin: '0 0 8px 0' },
    price: { fontWeight: 'bold', color: '#212121', fontSize: '14px' },
    discount: { color: '#388e3c', fontSize: '11px', fontWeight: 'bold' },
    addBtn: { 
        width: '100%', padding: '8px', backgroundColor: '#ff6f00', 
        color: '#fff', border: 'none', borderRadius: '4px', 
        cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
    },
    reqBtn: { 
        width: '100%', padding: '8px', backgroundColor: '#6f42c1', 
        color: '#fff', border: 'none', borderRadius: '4px', 
        cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
    },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#888' },
    // Cart
    cartOverlay: { 
        position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
    },
    cartBox: { 
        backgroundColor: '#fff', height: '100%', display: 'flex', 
        flexDirection: 'column', overflowY: 'auto', boxSizing: 'border-box',
    },
    cartHeader: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '15px', background: '#6f42c1', color: '#fff',
    },
    closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' },
    emptyCart: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    impactBox: { background: '#f9f9f9', padding: '12px 15px', borderBottom: '1px solid #eee' },
    toggleBtn: { flex: 1, padding: '8px', fontSize: '11px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    cartList: { flex: 1, padding: '10px 15px' },
    cartItem: { 
        display: 'flex', alignItems: 'center', gap: '10px', 
        padding: '10px 0', borderBottom: '1px solid #f0f0f0',
    },
    cartItemImg: { width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' },
    cartItemName: { fontSize: '13px', fontWeight: '600', margin: '0 0 3px 0' },
    cartItemPrice: { fontSize: '12px', color: '#28a745', fontWeight: 'bold', margin: 0 },
    removeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
    checkoutSection: { padding: '15px', borderTop: '2px solid #eee', background: '#fff' },
    totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    input: { 
        width: '100%', padding: '10px', border: '1px solid #ddd', 
        borderRadius: '6px', marginBottom: '8px', fontSize: '13px', 
        boxSizing: 'border-box', fontFamily: 'inherit',
    },
    checkoutBtn: { 
        width: '100%', padding: '14px', backgroundColor: '#6f42c1', 
        color: '#fff', border: 'none', borderRadius: '8px', 
        fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
    },
};

export default BrowseItems;