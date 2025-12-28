import React, { useState, useEffect } from 'react';
import { bankingService } from '../services/bankingService';
import { useNavigate } from 'react-router-dom';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal'; 
import { useNotification } from '../utils/useNotification'; 
import { useGlobalLoading } from '../context/LoadingContext'; 

const Register = () => {
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { notification, showFeature, showError, showSuccess, closeNotification } = useNotification();
  const { showLoading, hideLoading, isLoading } = useGlobalLoading();
  const [isDirty, setIsDirty] = useState(false);


  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleGoBack = (e) => {
    if (e) e.preventDefault();
    if (isDirty) {
        if (!window.confirm("Bạn có chắc muốn thoát? Thông tin nhập dở sẽ bị mất.")) return;
    }
    bankingService.logout();
    navigate('/'); 
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (!isDirty) setIsDirty(true);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoading("Đang xử lý...")
    setErrorMessage('');

    if (formData.password.length < 6) {
        setErrorMessage("Mật khẩu quá ngắn (tối thiểu 6 ký tự)!");
        hideLoading(); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp!");
      hideLoading(); return;
    }

    try {
      const res = await bankingService.register(formData.username, formData.email, formData.password);
      setIsDirty(false);
      showSuccess(`Đăng ký thành công!`);
      navigate('/'); 
    } catch (error) {
      const msg = error.response?.data?.message || '';
      if (msg.includes("Username")) setErrorMessage("Tên đăng nhập đã tồn tại!");
      else if (msg.includes("Email")) setErrorMessage("Email này đã được sử dụng!");
      else setErrorMessage(msg || 'Đăng ký thất bại!');
    } finally {
      hideLoading();
    }
  };

  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    container: {
      width: '100%',
      maxWidth: 'min(500px, 90vw)',
      backgroundColor: '#ffffff',
      borderRadius: 'clamp(12px, 2vw, 16px)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: 'clamp(2rem, 5vw, 3rem)',
    },
    headerTitle: {
      textAlign: 'center',
      fontSize: 'clamp(22px, 4vw, 28px)',
      fontWeight: '700',
      color: '#333',
      marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
    },
    subTitle: {
      textAlign: 'center', 
      color: '#666', 
      fontSize: 'clamp(12px, 2.5vw, 14px)', 
      marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)'
    },
    inputGroup: {
      position: 'relative', marginBottom: '15px',
      background: 'white', borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      border: '1px solid #eee',
      transition: 'all 0.3s'
    },
    inputIcon: {
      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
      fontSize: '18px', opacity: 0.5
    },
    input: {
      width: '100%', 
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem) clamp(2.5rem, 6vw, 3rem)',
      border: 'none', 
      background: 'transparent',
      fontSize: 'clamp(14px, 2.5vw, 15px)', 
      outline: 'none', 
      color: '#333',
      borderRadius: 'clamp(8px, 1.5vw, 12px)'
    },
    eyeBtn: {
      position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.6
    },
// Trong object styles
    submitBtn: {
        width: '100%', 
        padding: 'clamp(0.75rem, 2vw, 1rem)', 
        marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        border: 'none', 
        borderRadius: 'clamp(6px, 1.5vw, 8px)',
        background: 'linear-gradient(to right, #f093fb, #f5576c)',
        color: 'white', 
        fontSize: 'clamp(14px, 2.5vw, 16px)', 
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)',
        transition: 'all 0.3s',
    },

    cancelBtn: {
      width: '100%', padding: '12px', marginTop: '15px',
      border: '1px solid #ddd', borderRadius: '12px',
      background: 'white', color: '#666', fontWeight: '600',
      cursor: 'pointer', transition: 'all 0.3s'
    },
    errorBox: {
      background: '#fff0f0', color: '#ff4d4f', padding: '10px',
      borderRadius: '8px', fontSize: '13px', textAlign: 'center',
      marginBottom: '15px', border: '1px solid #ffccc7',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
    }
  };

  return (
    <>
      {/* Global Styles */}
      <style>
        {`
          * {
            box-sizing: border-box;
          }
          .register-container {
            width: min(100%, 500px) !important;
            padding: clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem) !important;
          }
          @media (max-width: 480px) {
            .register-container {
              padding: clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem) !important;
            }
          }
          input:focus { 
            box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
            border-color: #f5576c !important;
          }
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(245, 87, 108, 0.5);
          }
        `}
      </style>

      <div style={styles.pageWrapper}>
        <div className="register-container" style={styles.container}>
          {/* Header */}
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <div style={{fontSize: '48px', marginBottom: '15px'}}>🚀</div>
            <h2 style={styles.headerTitle}>Đăng Ký Tài Khoản</h2>
            <p style={styles.subTitle}>Tham gia cùng chúng tôi - Hoàn toàn miễn phí</p>
          </div>

          {errorMessage && (
            <div style={styles.errorBox}>
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>👤</span>
              <input 
                name="username" type="text" placeholder="Tên đăng nhập" 
                value={formData.username} onChange={handleChange} 
                style={styles.input} required minLength={3} 
              />
            </div>

            {/* Email */}
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>📧</span>
              <input 
                name="email" type="email" placeholder="Địa chỉ Email" 
                value={formData.email} onChange={handleChange} 
                style={styles.input} required 
              />
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🔒</span>
              <input 
                name="password" type={showPassword ? "text" : "password"} placeholder="Mật khẩu" 
                value={formData.password} onChange={handleChange} 
                style={styles.input} required minLength={6} 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Confirm Password */}
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🛡️</span>
              <input 
                name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" 
                value={formData.confirmPassword} onChange={handleChange} 
                style={styles.input} required 
              />
               <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              style={{
                ...styles.submitBtn, 
                
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              ✨ TẠO TÀI KHOẢN NGAY
            </button>
          </form>


          <div style={{marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#666'}}>
             Đã là thành viên? <span onClick={handleGoBack} style={{color: '#f5576c', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline'}}>Đăng nhập tại đây</span>
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

export default Register;