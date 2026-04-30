import React, { useState, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const rawRole = localStorage.getItem('userRole') || "";
    const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase(); 
    const userName = localStorage.getItem('userName');

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = {
        Admin: [
            { name: '📊 Dashboard Overview', path: '/dashboard' },
            { name: '👥 Manage Users', path: '/manage-users' },
            { name: '🚚 Add Delivery Staff', path: '/add-delivery-partner' },
            { name: '🛡️ Verify Orphanages', path: '/verify-users' },
            { name: '✅ Approve Donations', path: '/approve-donations' }, 
            { name: '📦 Warehouse Inventory', path: '/inventory-verification' }, 
            { name: '🚚 Logistics & Orders', path: '/view-orders' },
            { name: '💰 Transactions', path: '/admin-transactions' },
            { name: '📊 System Reports', path: '/system-reports' },
            { name: '📩 Inquiries', path: '/messages' },
            { name: '👤 My Profile', path: '/settings' },
        ],
        Deliverypartner: [
            { name: '🚚 Delivery Tasks', path: '/dashboard' }, 
            { name: '👤 My Profile', path: '/settings' },
        ],
        Donor: [
            { name: '📊 Dashboard', path: '/dashboard' },
            { name: '➕ Post Donation', path: '/add-product' },
            { name: '📜 My History', path: '/donation-history' },
            { name: '💰 My Impact', path: '/transaction-history' },
            { name: '📩 Inquiries', path: '/messages' },
            { name: '👤 My Profile', path: '/settings' },
        ],
        Orphanage: [
            { name: '📊 Dashboard', path: '/dashboard' },
            { name: '💰 Received Funds', path: '/transaction-history' },
            { name: '💬 Contact Admin', path: '/messages' },
            { name: '👤 My Profile', path: '/settings' },
        ],
        Buyer: [
            { name: '📊 Dashboard', path: '/dashboard' },
            { name: '🛒 Shop for Charity', path: '/browse-items' },
            { name: '🛍️ My Purchases', path: '/my-requests' },
            { name: '🎁 My Donations', path: '/transaction-history' },
            { name: '💬 Support', path: '/messages' },
            { name: '👤 My Profile', path: '/settings' },
        ]
    };

    const currentMenu = menuItems[userRole] || [];

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleNavClick = (path) => {
        navigate(path);
        if (isMobile) setIsMenuOpen(false);
    };

    return (
        <div style={styles.wrapper}>
            <aside style={{
                ...styles.sidebar,
                display: isMobile && !isMenuOpen ? 'none' : 'flex',
                position: isMobile ? 'fixed' : 'relative',
                zIndex: 1000,
                height: '100vh',
                width: isMobile ? '100%' : '260px'
            }}>
                <div style={styles.sidebarHeader}>
                    <div style={styles.brand}>TREASURE TO CHARITY</div>
                    {isMobile && <button onClick={() => setIsMenuOpen(false)} style={styles.closeBtn}>✕</button>}
                </div>
                
                <div style={styles.userBox}>
                    <strong style={{fontSize: '14px', display: 'block'}}>{userName}</strong>
                    <small style={{color: '#6f42c1', fontWeight: 'bold'}}>{userRole}</small>
                </div>
                
                <nav style={styles.nav}>
                    {currentMenu.map(item => (
                        <button 
                            key={item.path} 
                            onClick={() => handleNavClick(item.path)}
                            style={{
                                ...styles.navLink,
                                backgroundColor: location.pathname === item.path ? '#6f42c1' : 'transparent',
                                color: location.pathname === item.path ? '#fff' : '#444'
                            }}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>
            </aside>

            <main style={styles.main}>
                <header style={styles.topBar}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        {isMobile && <button onClick={() => setIsMenuOpen(true)} style={styles.menuBtn}>☰</button>}
                        <span style={styles.pageTitle}>
                            {location.pathname === '/dashboard' ? '📊 OVERVIEW' : location.pathname.replace('/', '').toUpperCase().replace('-', ' ')}
                        </span>
                    </div>
                    
                    <button onClick={handleLogout} style={styles.logoutBtnTop}>
                        {isMobile ? '➡️' : 'Logout ➡️'}
                    </button>
                </header>
                <div style={styles.content}>{children}</div>
            </main>
        </div>
    );
};

const styles = {
    wrapper: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f4f7f6' },
    sidebar: { width: '260px', background: '#fff', borderRight: '1px solid #ddd', flexDirection: 'column', padding: '20px', transition: '0.3s' },
    sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 5px' },
    brand: { fontSize: '18px', fontWeight: 'bold', color: '#6f42c1', letterSpacing: '0.5px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666', padding: '5px' },
    userBox: { padding: '15px', background: '#f8f9ff', borderRadius: '10px', marginBottom: '25px', textAlign: 'center' },
    nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' },
    navLink: { border: 'none', padding: '12px 15px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: '0.2s' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topBar: { minHeight: '65px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #eee' },
    menuBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    pageTitle: { fontWeight: 'bold', color: '#555', fontSize: '12px' },
    content: { padding: '15px', flex: 1, overflowY: 'auto' },
    logoutBtnTop: { padding: '8px 15px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default DashboardLayout;