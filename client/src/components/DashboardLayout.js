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

            {/* Mobile Overlay */}
            {isMobile && isMenuOpen && (
                <div 
                    onClick={() => setIsMenuOpen(false)}
                    style={styles.overlay}
                />
            )}

            <aside style={{
                ...styles.sidebar,
                transform: isMobile ? (isMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
                position: isMobile ? 'fixed' : 'relative',
                width: isMobile ? '75%' : '260px',  // ✅ mobile pe 75% width
                maxWidth: '280px',
                zIndex: 1001,
            }}>
                <div style={styles.sidebarHeader}>
                    <div style={styles.brand}>🎁 T2C</div>  
                    {isMobile && (
                        <button onClick={() => setIsMenuOpen(false)} style={styles.closeBtn}>✕</button>
                    )}
                </div>
                
                <div style={styles.userBox}>
                    <strong style={{fontSize: '13px', display: 'block'}}>{userName}</strong>
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

                <button onClick={handleLogout} style={styles.logoutSidebar}>
                    Logout ➡️
                </button>
            </aside>

            <main style={styles.main}>
                <header style={styles.topBar}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        {isMobile && (
                            <button onClick={() => setIsMenuOpen(true)} style={styles.menuBtn}>☰</button>
                        )}
                        <span style={styles.pageTitle}>
                            {location.pathname === '/dashboard' 
                                ? '📊 Overview' 
                                : location.pathname.replace('/', '').replace(/-/g, ' ').toUpperCase()
                            }
                        </span>
                    </div>
                    
                    {!isMobile && (
                        <button onClick={handleLogout} style={styles.logoutBtnTop}>
                            Logout ➡️
                        </button>
                    )}
                </header>
                <div style={styles.content}>{children}</div>
            </main>
        </div>
    );
};

const styles = {
    wrapper: { 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden', 
        backgroundColor: '#f4f7f6' 
    },
    overlay: {
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
    },
    sidebar: { 
        background: '#fff', 
        borderRight: '1px solid #ddd', 
        display: 'flex',
        flexDirection: 'column', 
        padding: '20px',
        height: '100vh',
        transition: 'transform 0.3s ease',
        overflowY: 'auto',
    },
    sidebarHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
    },
    brand: { 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: '#6f42c1',
    },
    closeBtn: { 
        background: 'none', 
        border: 'none', 
        fontSize: '24px', 
        cursor: 'pointer', 
        color: '#666',
    },
    userBox: { 
        padding: '12px', 
        background: '#f8f9ff', 
        borderRadius: '10px', 
        marginBottom: '20px', 
        textAlign: 'center' 
    },
    nav: { 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        overflowY: 'auto' 
    },
    navLink: { 
        border: 'none', 
        padding: '11px 12px', 
        textAlign: 'left', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        fontSize: '13px', 
        fontWeight: '500', 
        transition: '0.2s',
        whiteSpace: 'nowrap',
    },
    main: { 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        minWidth: 0,
    },
    topBar: { 
        minHeight: '60px', 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 15px', 
        borderBottom: '1px solid #eee',
    },
    menuBtn: { 
        background: 'none', 
        border: 'none', 
        fontSize: '26px', 
        cursor: 'pointer',
        color: '#6f42c1',
        fontWeight: 'bold',
    },
    pageTitle: { 
        fontWeight: 'bold', 
        color: '#555', 
        fontSize: '13px',
    },
    content: { 
        padding: '15px', 
        flex: 1, 
        overflowY: 'auto',
    },
    logoutBtnTop: { 
        padding: '8px 15px', 
        backgroundColor: '#dc3545', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '6px', 
        cursor: 'pointer', 
        fontSize: '13px', 
        fontWeight: 'bold',
    },
    logoutSidebar: {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '13px',
    }
};

export default DashboardLayout;