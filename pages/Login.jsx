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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);


  useEffect(() => {
    localStorage.clear(); 
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    showLoading("Đang đăng nhập...")
    setLoginError(false);

    try {
      const response = await bankingService.login(username, password);
      const { id, jwtToken, roles, username: resUser } = response.data;


      let cleanToken = jwtToken;
      if (jwtToken && jwtToken.includes(';')) {
          const cookiePart = jwtToken.split(';')[0];
          const firstEqualIndex = cookiePart.indexOf('=');
          if (firstEqualIndex !== -1) cleanToken = cookiePart.substring(firstEqualIndex + 1);
      }
      localStorage.setItem('jwtToken', cleanToken);

     
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
      if (error.response?.status === 401) showError("Sai tên đăng nhập hoặc mật khẩu!");
      else showError("Lỗi: " + (error.message || "Vui lòng thử lại"));
    } finally {
      hideLoading()
    }
  };

  // --- RESPONSIVE WEB STYLES ---
  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    container: {
      width: '100%',
      maxWidth: 'min(450px, 90vw)',
      backgroundColor: '#ffffff',
      borderRadius: 'clamp(12px, 2vw, 16px)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: 'clamp(2rem, 5vw, 3rem)',
    },
    header: { 
      textAlign: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: 'clamp(22px, 4vw, 28px)', 
      fontWeight: '700', 
      margin: '0 0 clamp(0.5rem, 1.5vw, 0.75rem) 0',
      color: '#333',
    },
    subtitle: { 
      fontSize: 'clamp(12px, 2.5vw, 14px)', 
      color: '#666', 
      margin: 0 
    },
    

    inputGroup: { position: 'relative', marginBottom: '15px' },
    inputIcon: {
        position: 'absolute', 
        left: 'clamp(0.75rem, 2vw, 1rem)', 
        top: '50%', 
        transform: 'translateY(-50%)',
        fontSize: 'clamp(16px, 3vw, 18px)', 
        color: '#0072ff', 
        opacity: 0.7
    },
    input: {
      width: '100%', 
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem) clamp(2.5rem, 6vw, 3rem)',
      borderRadius: 'clamp(6px, 1.5vw, 8px)', 
      border: '1px solid #e0e0e0',
      fontSize: 'clamp(14px, 2.5vw, 15px)', 
      outline: 'none',
      background: '#ffffff',
      transition: 'all 0.3s', 
      boxSizing: 'border-box',
      color: '#333'
    },
    eyeIcon: {
      position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)',
      cursor: 'pointer', background: 'none', border: 'none', fontSize: '18px', color: '#888'
    },
    
    button: {
      width: '100%', 
      padding: 'clamp(0.75rem, 2vw, 1rem)', 
      marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)',
      background: 'linear-gradient(to right, #667eea, #764ba2)',
      color: 'white', 
      border: 'none', 
      borderRadius: 'clamp(6px, 1.5vw, 8px)',
      fontSize: 'clamp(14px, 2.5vw, 16px)', 
      fontWeight: '600', 
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
      transition: 'all 0.3s',
    },
    devButton: {
      width: '100%', 
      padding: '12px', 
      marginTop: '10px',
      background: '#f0f0f0',
      color: '#666', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      fontSize: '14px', 
      fontWeight: '500', 
      cursor: 'pointer',
      transition: 'all 0.3s',
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
      color: '#667eea', fontWeight: '600', textDecoration: 'none', marginLeft: '5px',
      borderBottom: '1px dashed #667eea'
    }
  };

  return (
    <>
      {/* Global Styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        .login-container {
          width: min(100%, 450px) !important;
          padding: clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem) !important;
        }
        @media (max-width: 480px) {
          .login-container {
            padding: clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem) !important;
          }
        }
        input:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            background: white !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
      `}</style>

      <div style={styles.pageWrapper}>
        <div className="login-container" style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{fontSize: '48px', marginBottom: '15px'}}>🔐</div>
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

            <div style={{textAlign: 'right', marginBottom: '20px'}}>
                <span style={{fontSize: '13px', color: '#667eea', cursor: 'pointer'}}>Quên mật khẩu?</span>
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

          {/* Dev Quick Access Button */}
          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('user', JSON.stringify({
                id: 1,
                username: 'demo',
                accountName: 'Demo User',
                roles: ['USER']
              }));
              navigate('/dashboard');
            }}
            style={styles.devButton}
          >
            🚀 Vào nhanh (Dev)
          </button>
          
          {/* Footer */}
          <div style={styles.footer}>
            <span>Người dùng mới?</span>
            <Link to="/register" style={styles.link}>
              Tạo tài khoản miễn phí
            </Link>
          </div>

          {/* GlobalModal */}
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