import React, { useState, useEffect } from 'react';
import { bankingService } from '../services/bankingService';
import { useNavigate, Link } from 'react-router-dom';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal'; // Import Component
import { useNotification } from '../utils/useNotification'; // Import Hook
import { useGlobalLoading } from '../context/LoadingContext'; // Import Hook

const Login = () => {
  const navigate = useNavigate();
  const { notification, showFeature, showError, closeNotification } = useNotification();
  const { showLoading, hideLoading, isLoading } = useGlobalLoading();
  // --- STATE QUẢN LÝ ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // --- 1. TỰ ĐỘNG DỌN DẸP KHI VÀO TRANG ---
  useEffect(() => {
    localStorage.clear(); // Xóa sạch token cũ để tránh lỗi 401 giả
  }, []);

  // --- 2. XỬ LÝ ĐĂNG NHẬP ---
  const handleLogin = async (e) => {
    e.preventDefault();
    showLoading("Đang đăng nhập...")
    setLoginError(false);

    try {
      const response = await bankingService.login(username, password);
      const { id, jwtToken, roles, username: resUser } = response.data;

      // Xử lý chuỗi Token (Nếu backend trả về dạng cookie string)
      let cleanToken = jwtToken;
      if (jwtToken && jwtToken.includes(';')) {
          const cookiePart = jwtToken.split(';')[0];
          const firstEqualIndex = cookiePart.indexOf('=');
          if (firstEqualIndex !== -1) cleanToken = cookiePart.substring(firstEqualIndex + 1);
      }
      localStorage.setItem('jwtToken', cleanToken);

      // Kiểm tra Account Info
      try {
        const accResponse = await bankingService.getAccountInfo(id);
        localStorage.setItem('user', JSON.stringify({ 
            id, username: resUser, roles, accountName: accResponse.data.accountName 
        }));
        navigate('/dashboard');
      } catch (accError) {
        localStorage.setItem('user', JSON.stringify({ id, username: resUser, roles }));
        navigate('/create-account', { state: { userId: id } });
      }

    } catch (error) {
      setLoginError(true);
      if (error.response?.status === 401) showError("❌ Sai tên đăng nhập hoặc mật khẩu!");
      else showError("❌ Lỗi: " + (error.message || "Vui lòng thử lại"));
    } finally {
      hideLoading()
    }
  };

  // --- STYLES "RỰC RỠ & BẮT MẮT" ---
  const styles = {
    wrapper: {
      minHeight: '100vh', width: '100%',
      // Gradient nền động: Xanh dương - Tím - Hồng
      background: 'linear-gradient(-45deg, #00c6ff, #0072ff, #9D50BB, #6E48AA)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: "'Segoe UI', Roboto, sans-serif", padding: '20px'
    },
    glassCard: {
      width: '100%', maxWidth: '400px',
      // Hiệu ứng kính mờ
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.3)',
      padding: '40px 30px',
      display: 'flex', flexDirection: 'column', gap: '20px'
    },
    header: { textAlign: 'center' },
    title: {
      fontSize: '32px', fontWeight: '800', margin: '0 0 5px 0',
      background: 'linear-gradient(45deg, #0072ff, #00c6ff)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: '14px', color: '#666', margin: 0 },
    
    // Input được bọc trong group để có icon
    inputGroup: { position: 'relative', marginBottom: '15px' },
    inputIcon: {
        position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '18px', color: '#0072ff', opacity: 0.7
    },
    input: {
      width: '100%', padding: '14px 14px 14px 45px', // Padding trái né icon
      borderRadius: '12px', border: '1px solid #e0e0e0',
      fontSize: '15px', outline: 'none',
      background: 'rgba(255,255,255,0.8)',
      transition: 'all 0.3s', boxSizing: 'border-box',
      color: '#213547'
    },
    eyeIcon: {
      position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)',
      cursor: 'pointer', background: 'none', border: 'none', fontSize: '18px', color: '#888'
    },
    
    button: {
      width: '100%', 
      padding: '15px', 
      marginTop: '10px',
      background: 'linear-gradient(to right, #00c6ff, #0072ff)',
      color: 'white', 
      border: 'none', 
      borderRadius: '12px',
      fontSize: '16px', 
      fontWeight: 'bold', 
      cursor: 'pointer', // Để mặc định là pointer
      boxShadow: '0 5px 15px rgba(0, 114, 255, 0.4)',
      transition: 'all 0.2s', // Đổi transform thành all để mượt cả opacity
      opacity: 1 // Để mặc định là 1
    },

    errorBox: {
      background: '#fff0f0', color: '#d32f2f', padding: '10px',
      borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #ffcdd2',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
    },
    footer: {
      textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666',
      borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px'
    },
    link: {
      color: '#0072ff', fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px',
      borderBottom: '1px dashed #0072ff'
    }
  };

  return (
    <>
      {/* Animation Global */}
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        input:focus {
            border-color: #0072ff !important;
            box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.1);
            background: white !important;
        }
      `}</style>

      <div style={styles.wrapper}>
        <div style={styles.glassCard}>
          
          {/* Header */}
          <div style={styles.header}>
            <div style={{fontSize: '40px', marginBottom: '10px'}}>🔐</div>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Đăng nhập để tiếp tục giao dịch</p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div style={styles.errorBox}>
              Tên đăng nhập hoặc mật khẩu sai!
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text" placeholder="Tên đăng nhập" 
                value={username} onChange={(e) => setUsername(e.target.value)} 
                required style={styles.input}
              />
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🔒</span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Mật khẩu" 
                value={password} onChange={(e) => setPassword(e.target.value)} 
                required style={styles.input}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div style={{textAlign: 'right', marginBottom: '15px'}}>
                <span style={{fontSize: '12px', color: '#0072ff', cursor: 'pointer'}}>Quên mật khẩu?</span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading} 
              style={{
                ...styles.button, 
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              ĐĂNG NHẬP NGAY ➜
            </button>
          </form>
          
          {/* Footer */}
          <div style={styles.footer}>
            <span>Người dùng mới?</span>
            <Link to="/register" style={styles.link}>
              Tạo tài khoản miễn phí
            </Link>
          </div>
        {/* Đặt GlobalModal ở cuối cùng */}
        <GlobalModal 
            config={notification} 
            onClose={closeNotification} 
            styles={commonStyles} 
        />

        </div>
      </div>
    </>
  );
};

export default Login;