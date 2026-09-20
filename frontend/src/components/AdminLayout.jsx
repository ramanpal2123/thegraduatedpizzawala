import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import logo from '../assets/GPW.png';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard/analytics', label: 'Analytics', icon: '📊' },
    { path: '/admin/dashboard/orders', label: 'Orders', icon: '📦' },
    { path: '/admin/dashboard/menu', label: 'Menu', icon: '🍕' },
    { path: '/admin/dashboard/toppings', label: 'Toppings', icon: '🧀' },
    { path: '/admin/dashboard/offers', label: 'Offers', icon: '🎁' },
    { path: '/admin/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin');
  };

  const isActive = (path) => location.pathname === path;
  const currentItem = menuItems.find((item) => isActive(item.path));

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div style={styles.wrapper}>
      <div className="admin-sidebar-desktop" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoRow}>
            <img src={logo} alt="Pizza Wala Logo" style={styles.logoImg} />
            <div>
              <h2 style={styles.logo}>Pizza Wala</h2>
              <p style={styles.logoSub}>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              style={isActive(item.path) ? styles.navItemActive : styles.navItem}
              onClick={() => navigate(item.path)}
            >
              <span style={{ marginRight: '10px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      <div className="admin-mobile-header" style={styles.mobileHeader}>
        <div style={styles.mobileLogoRow}>
          <img src={logo} alt="Pizza Wala Logo" style={styles.mobileLogoImg} />
        </div>

        <button
          style={styles.mobileMenuTrigger}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span style={styles.mobileMenuIcon}>{currentItem?.icon || '☰'}</span>
          <span style={styles.mobileMenuLabel}>{currentItem?.label || 'Menu'}</span>
          <span
            style={{
              ...styles.chevron,
              transform: mobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▾
          </span>
        </button>
        <button style={styles.mobileLogoutBtn} onClick={handleLogout}>
          🚪 Logout
        </button>

        {mobileMenuOpen && (
          <>
            <div style={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)} />
            <div style={styles.mobileDropdown}>
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  style={
                    isActive(item.path)
                      ? styles.mobileDropdownItemActive
                      : styles.mobileDropdownItem
                  }
                  onClick={() => handleNavigate(item.path)}
                >
                  <span style={{ marginRight: '10px' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="admin-content-area" style={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0d0d0d',
  },
  sidebar: {
    width: '230px',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    borderRight: '1px solid #2a2a2a',
  },
  sidebarHeader: { padding: '10px 20px 24px', borderBottom: '1px solid #2a2a2a' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoImg: { height: '38px', width: '38px', objectFit: 'contain', borderRadius: '8px' },
  logo: { fontSize: '18px', marginBottom: '2px', color: '#fff' },
  logoSub: { fontSize: '12px', color: '#999' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 12px', flex: 1 },
  navItem: {
    background: 'transparent',
    color: '#ccc',
    padding: '11px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'left',
    fontWeight: 500,
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    color: '#fff',
    padding: '11px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'left',
    fontWeight: 600,
    boxShadow: '0 2px 10px rgba(211,47,47,0.4)',
  },
  logoutBtn: {
    margin: '12px',
    background: 'transparent',
    color: '#ef5350',
    border: '1px solid #333',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  mobileHeader: {
    display: 'none',
    background: 'linear-gradient(180deg, #1c1c1c, #0d0d0d)',
    color: '#fff',
    padding: '12px 16px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2a2a2a',
  },
  mobileLogoRow: { display: 'flex', alignItems: 'center' },
  mobileLogoImg: { height: '30px', width: '30px', objectFit: 'contain', borderRadius: '6px' },
  mobileMenuTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1c1c1c',
    color: '#fff',
    padding: '9px 16px',
    borderRadius: '22px',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid #333',
  },
  mobileMenuIcon: { fontSize: '15px' },
  mobileMenuLabel: {},
  chevron: { fontSize: '11px', transition: 'transform 0.2s ease', marginLeft: '2px' },
  mobileLogoutBtn: {
    background: 'rgba(239,83,80,0.15)',
    color: '#ef5350',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '16px',
  },
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 190,
  },
  mobileDropdown: {
    position: 'fixed',
    top: '62px',
    left: '16px',
    right: '16px',
    background: '#1c1c1c',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    zIndex: 201,
    border: '1px solid #2a2a2a',
  },
  mobileDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: '#1c1c1c',
    color: '#ccc',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'left',
    borderBottom: '1px solid #2a2a2a',
    borderRadius: 0,
  },
  mobileDropdownItemActive: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: 'rgba(211,47,47,0.15)',
    color: '#ef5350',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: 700,
    textAlign: 'left',
    borderBottom: '1px solid #2a2a2a',
    borderRadius: 0,
  },
  content: {
    flex: 1,
    marginLeft: '230px',
    minHeight: '100vh',
  },
};

export default AdminLayout;