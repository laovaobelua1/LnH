import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { bankingService } from '../services/bankingService';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    bankingService.logout();
    localStorage.clear();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Trang chủ', icon: '🏠' },
    { path: '/transfer', label: 'Chuyển tiền', icon: '💸' },
    { path: '/settings', label: 'Cài đặt', icon: '⚙️' },
  ];

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .user-info-desktop { display: none !important; }
          .logout-btn-desktop { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .logo-text { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 480px) {
          .layout-main { padding: 1.5rem 1rem !important; }
          .layout-header-content { padding: 0 1rem !important; height: auto !important; min-height: 60px !important; }
        }
        @media (min-width: 1400px) {
          .layout-main { max-width: 1400px !important; }
        }
      `}</style>
      <div style={styles.layout}>
        {/* Header/Navbar */}
        <header style={styles.header}>
          <div className="layout-header-content" style={styles.headerContent}>
            <div style={styles.logoSection}>
              <Link to="/dashboard" style={styles.logo}>
                <span style={styles.logoIcon}>🏦</span>
                <span className="logo-text" style={styles.logoText}>Banking App</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav" style={styles.desktopNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...styles.navLink,
                    ...(isActive(link.path) ? styles.navLinkActive : {})
                  }}
                >
                  <span style={styles.navIcon}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div style={styles.userSection}>
              <div className="user-info-desktop" style={styles.userInfo}>
                <span style={styles.userName}>
                  {user?.accountName || user?.username || 'User'}
                </span>
              </div>
              <button onClick={handleLogout} className="logout-btn-desktop" style={styles.logoutBtn}>
                Đăng xuất
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-btn"
                style={styles.mobileMenuBtn}
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="mobile-nav" style={styles.mobileNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive(link.path) ? styles.mobileNavLinkActive : {})
                  }}
                >
                  <span style={styles.navIcon}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              <div style={{ padding: '12px 15px', borderTop: '1px solid #e9ecef', marginTop: '10px' }}>
                <div style={{ marginBottom: '10px', color: '#333', fontWeight: '600', fontSize: '14px' }}>
                  {user?.accountName || user?.username || 'User'}
                </div>
                <button onClick={handleLogout} style={{ ...styles.logoutBtn, width: '100%' }}>
                  Đăng xuất
                </button>
              </div>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="layout-main" style={styles.main}>
          {children}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>
            © 2024 Banking App. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
};

const styles = {
  layout: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  headerContent: {
    maxWidth: '100%',
    width: '100%',
    margin: '0 auto',
    padding: '0 clamp(1rem, 3vw, 2rem)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'clamp(60px, 8vh, 80px)',
    gap: 'clamp(0.5rem, 2vw, 1.5rem)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(0.5rem, 1.5vw, 1rem)',
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 'clamp(16px, 2.5vw, 20px)',
  },
  logoIcon: {
    fontSize: 'clamp(20px, 3.5vw, 28px)',
  },
  logoText: {
    marginLeft: '5px',
  },
  desktopNav: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(0.25rem, 1vw, 0.5rem)',
    padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)',
    textDecoration: 'none',
    color: '#666',
    borderRadius: 'clamp(6px, 1vw, 8px)',
    transition: 'all 0.3s',
    fontSize: 'clamp(13px, 2vw, 15px)',
    fontWeight: '500',
  },
  navLinkActive: {
    backgroundColor: '#007bff',
    color: '#ffffff',
  },
  navIcon: {
    fontSize: '18px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  userName: {
    color: '#333',
    fontWeight: '600',
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  mobileMenuBtn: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
    padding: '5px',
  },
  mobileNav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e9ecef',
  },
  mobileNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 15px',
    textDecoration: 'none',
    color: '#666',
    borderRadius: '6px',
    marginBottom: '5px',
    fontSize: '15px',
    fontWeight: '500',
  },
  mobileNavLinkActive: {
    backgroundColor: '#007bff',
    color: '#ffffff',
  },
  main: {
    flex: 1,
    maxWidth: 'min(1200px, 95vw)',
    width: '100%',
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e9ecef',
    padding: '20px',
    textAlign: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
};

export default Layout;

