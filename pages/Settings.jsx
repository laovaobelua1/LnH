import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankingService } from '../services/bankingService';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal';
import Layout from '../components/Layout';
import { useNotification } from '../utils/useNotification';


const Settings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [avatar, setAvatar] = useState(localStorage.getItem('user_avatar') || 'https://via.placeholder.com/150');
  

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('app_theme') === 'dark');
  

  const [language, setLanguage] = useState(localStorage.getItem('app_language') || 'vi');

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const { notification, showFeature, showError, showSuccess, closeNotification } = useNotification();


  
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAvatar = e.target.result;
        setAvatar(newAvatar);
        localStorage.setItem('user_avatar', newAvatar);
        showSuccess("✅ Đổi ảnh đại diện thành công!");
      };
      reader.readAsDataURL(file);
    }
  };


  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('app_theme', newTheme);

  };

  // Xử lý đổi Ngôn ngữ
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    localStorage.setItem('app_language', e.target.value);
  };

  const handleLogout = () => {
    bankingService.logout();
    navigate('/');
  };

  // Mock toggle
  const toggleMock = (setter, label) => {
    setter(prev => {
        const newVal = !prev;
        showSuccess(`Đã ${newVal ? 'BẬT' : 'TẮT'} tính năng ${label} (Mô phỏng)`);
        return newVal;
    });
  };


  const styles = {
    outerWrapper: {
      minHeight: '100vh', width: '100%',
      backgroundColor: '#e4e6eb', // Nền desktop
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '20px', paddingBottom: '20px', boxSizing: 'border-box',
    },
    container: {
      width: '100%', maxWidth: '480px', minHeight: '90vh',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', // Đổi màu theo Theme
      color: isDarkMode ? '#ffffff' : '#333333',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      position: 'relative', borderRadius: '30px',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)', overflow: 'hidden',
    },
    header: {
      background: 'linear-gradient(135deg, #007bff, #0056b3)',
      padding: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px'
    },
    backBtn: { background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
    
    // Avatar Section
    profileSection: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '30px 20px', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f0f0f0'
    },
    avatarWrapper: { position: 'relative', marginBottom: '15px' },
    avatarImg: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
    cameraBtn: {
      position: 'absolute', bottom: '5px', right: '5px',
      width: '30px', height: '30px', borderRadius: '50%',
      backgroundColor: '#007bff', color: 'white', border: '2px solid white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px'
    },
    
    // List Menu
    sectionTitle: { 
      padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem) clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)', 
      fontSize: 'clamp(12px, 2vw, 14px)', 
      fontWeight: 'bold', 
      color: '#555', 
      textTransform: 'uppercase' 
    },
    menuList: { padding: '0 clamp(1rem, 3vw, 1.5rem)' },
    menuItem: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: 'clamp(0.75rem, 2vw, 1rem) 0', 
      borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0'
    },
    menuLabel: { 
      fontSize: 'clamp(14px, 2.5vw, 16px)', 
      fontWeight: '500',
      color: '#333'
    },
    
    // Switch Toggle (CSS thuần)
    switch: { position: 'relative', display: 'inline-block', width: '50px', height: '26px' },
    slider: (checked) => ({
      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: checked ? '#28a745' : '#ccc', borderRadius: '34px', transition: '.4s'
    }),
    sliderBefore: (checked) => ({
      position: 'absolute', content: '""', height: '20px', width: '20px',
      left: checked ? '26px' : '4px', bottom: '3px',
      backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
    }),
    
    select: {
      padding: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
      borderRadius: 'clamp(6px, 1.5vw, 8px)', 
      border: '1px solid #ccc',
      backgroundColor: isDarkMode ? '#333' : '#ffffff', 
      color: isDarkMode ? '#ffffff' : '#333',
      fontSize: 'clamp(13px, 2.5vw, 14px)'
    }
  };

  // Component Switch nhỏ gọn
  const ToggleSwitch = ({ checked, onChange }) => (
    <div style={styles.switch} onClick={onChange}>
      <span style={styles.slider(checked)}></span>
      <span style={styles.sliderBefore(checked)}></span>
    </div>
  );

  return (
    <Layout>
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        {/* Input file ẩn để chọn ảnh */}
        <input 
          type="file" ref={fileInputRef} 
          style={{ display: 'none' }} accept="image/*" 
          onChange={handleAvatarChange} 
        />

        {/* HEADER */}
        <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: 'clamp(8px, 1.5vw, 12px)', color: '#ffffff', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center'}}>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', color: '#ffffff' }}>Cài đặt</h2>
        </div>

        {/* PROFILE & AVATAR */}
        <div style={styles.profileSection}>
          <div style={styles.avatarWrapper}>
            <img src={avatar} alt="Avatar" style={styles.avatarImg} />
            <div style={styles.cameraBtn} onClick={() => fileInputRef.current.click()}>📷</div>
          </div>
          <h3 style={{ margin: 0, color: '#333', fontSize: 'clamp(18px, 3vw, 20px)' }}>{user.accountName || user.username}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 'clamp(12px, 2vw, 13px)' }}>Thay đổi thông tin cá nhân</p>
        </div>

        {/* NHÓM 1: CÁ NHÂN HÓA */}
        <div style={styles.sectionTitle}>Giao diện & Ngôn ngữ</div>
        <div style={styles.menuList}>
          
          {/* Đổi Giao diện (Dark Mode) */}
          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>🌙 Chế độ tối (Dark Mode)</span>
            <ToggleSwitch checked={isDarkMode} onChange={toggleTheme} />
          </div>

          {/* Đổi Ảnh nền (Demo màu sắc) */}
          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>🖼️ Ảnh nền App</span>
            <div style={{display: 'flex', gap: '5px'}}>
               <div style={{width: '20px', height: '20px', borderRadius: '50%', background: '#fff', border: '1px solid #ccc', cursor: 'pointer'}}></div>
               <div style={{width: '20px', height: '20px', borderRadius: '50%', background: '#ffecd2', cursor: 'pointer'}}></div>
               <div style={{width: '20px', height: '20px', borderRadius: '50%', background: '#d4fc79', cursor: 'pointer'}}></div>
            </div>
          </div>

          {/* Đổi Ngôn ngữ */}
          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>🌐 Ngôn ngữ</span>
            <select value={language} onChange={handleLanguageChange} style={styles.select}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="jp">日本語</option>
            </select>
          </div>
        </div>

        {/* NHÓM 2: BẢO MẬT (MOCK) */}
        <div style={styles.sectionTitle}>Bảo mật & Đăng nhập</div>
        <div style={styles.menuList}>
          
          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>👁️ Đăng nhập Sinh trắc học</span>
            <ToggleSwitch checked={biometricEnabled} onChange={() => toggleMock(setBiometricEnabled, 'Sinh trắc học')} />
          </div>

          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>👆 Xác thực Vân tay</span>
            <ToggleSwitch checked={fingerprintEnabled} onChange={() => toggleMock(setFingerprintEnabled, 'Vân tay')} />
          </div>

          {/* --- 1. Cập nhật thông tin tài khoản (Đã sửa lại cho đồng bộ) --- */}
          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>📝 Cập nhật thông tin tài khoản</span>
            <button 
              style={{
                padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem)', 
                fontSize: 'clamp(11px, 2vw, 12px)',
                backgroundColor: '#007bff',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'clamp(4px, 1vw, 6px)',
                cursor: 'pointer',
                fontWeight: '500'
              }} 
              onClick={() => navigate('/update-account')}
            >
              Cập nhật
            </button>
          </div>

          <div style={styles.menuItem}>
            <span style={styles.menuLabel}>🔐 Đổi mật khẩu đăng nhập</span>
            <button 
            style={{
              padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem)', 
              fontSize: 'clamp(11px, 2vw, 12px)',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: 'clamp(4px, 1vw, 6px)',
              cursor: 'pointer',
              fontWeight: '500'
            }} 
            onClick={() => showSuccess("Chức năng đang phát triển")}
          >
            Thay đổi
          </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div style={{ padding: '30px 20px' }}>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%', 
              padding: 'clamp(0.75rem, 2vw, 1rem)', 
              borderRadius: 'clamp(8px, 1.5vw, 12px)', 
              border: 'none',
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              fontWeight: 'bold', 
              fontSize: 'clamp(14px, 2.5vw, 16px)', 
              cursor: 'pointer'
            }}
          >
            Đăng xuất
          </button>
          <p style={{textAlign: 'center', color: '#666', fontSize: 'clamp(10px, 2vw, 11px)', marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)'}}>Phiên bản: 1.0.5</p>
        </div>

        {/* GlobalModal */}
        <GlobalModal 
            config={notification} 
            onClose={closeNotification} 
            styles={commonStyles} 
        />
      </div>
    </Layout>
  );
};

export default Settings;