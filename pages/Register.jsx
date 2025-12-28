import React, { useState, useEffect } from 'react';
import { bankingService } from '../services/bankingService';
import { useNavigate } from 'react-router-dom';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal'; // Import Component
import { useNotification } from '../utils/useNotification'; // Import Hook
import { useGlobalLoading } from '../context/LoadingContext'; // Import Hook

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

  // --- LOGIC (GIỮ NGUYÊN) ---
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
        if (!window.confirm("⚠️ Bạn có chắc muốn thoát? Thông tin nhập dở sẽ bị mất.")) return;
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
        setErrorMessage("⚠️ Mật khẩu quá ngắn (tối thiểu 6 ký tự)!");
        hideLoading(); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("❌ Mật khẩu xác nhận không khớp!");
      hideLoading(); return;
    }

    try {
      const res = await bankingService.register(formData.username, formData.email, formData.password);
      setIsDirty(false);
      showSuccess(`✅ Đăng ký thành công! Vui lòng đăng nhập.`);
      navigate('/'); 
    } catch (error) {
      const msg = error.response?.data?.message || '';
      if (msg.includes("Username")) setErrorMessage("⚠️ Tên đăng nhập đã tồn tại!");
      else if (msg.includes("Email")) setErrorMessage("⚠️ Email này đã được sử dụng!");
      else setErrorMessage(msg || 'Đăng ký thất bại!');
    } finally {
      hideLoading();
    }
  };

  // --- STYLES "LỘNG LẪY" ---
  const styles = {
    wrapper: {
      minHeight: '100vh',
      width: '100%',
      // Gradient nền động cực đẹp
      background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      padding: '20px'
    },
    glassCard: {
      width: '100%',
      maxWidth: '420px',
      // Hiệu ứng kính mờ (Glassmorphism)
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      padding: '40px 30px',
      position: 'relative',
      overflow: 'hidden'
    },
    headerTitle: {
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: '800',
      background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '5px'
    },
    subTitle: {
      textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '25px'
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
      width: '100%', padding: '14px 14px 14px 45px', // Padding trái né icon
      border: 'none', background: 'transparent',
      fontSize: '15px', outline: 'none', color: '#333',
      borderRadius: '12px'
    },
    eyeBtn: {
      position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.6
    },
// Trong object styles
    submitBtn: {
        width: '100%', 
        padding: '15px', 
        marginTop: '10px',
        border: 'none', 
        borderRadius: '12px',
        // Gradient nút bấm
        background: 'linear-gradient(to right, #DA22FF 0%, #9733EE 51%, #DA22FF 100%)',
        backgroundSize: '200% auto',
        color: 'white', 
        fontSize: '16px', 
        fontWeight: 'bold',
        cursor: 'pointer', // Để mặc định là pointer
        boxShadow: '0 10px 20px rgba(218, 34, 255, 0.3)',
        transition: '0.5s',
        opacity: 1 // Để mặc định là 1 (hiện rõ)
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
      {/* CSS Animation Global */}
      <style>
        {`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          input:focus { box-shadow: 0 0 0 2px rgba(221, 36, 118, 0.2); }
        `}
      </style>

      <div style={styles.wrapper}>
        <div style={styles.glassCard}>
          
          {/* Header */}
          <h2 style={styles.headerTitle}>Đăng Ký Tài Khoản</h2>
          <p style={styles.subTitle}>Tham gia cùng chúng tôi - Hoàn toàn miễn phí 🚀</p>

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
              disabled={isLoading} // 1. Dùng biến từ Context (nhớ đổi loading -> isLoading)
              style={{
                ...styles.submitBtn, // 2. Kế thừa style đẹp (gradient, shadow...)
                
                // 3. Ghi đè logic hiển thị trạng thái loading tại đây
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {/* 4. Giữ nguyên text, không cần đổi thành "Đang khởi tạo..." nữa */}
              ✨ TẠO TÀI KHOẢN NGAY
            </button>
          </form>

          <button type="button" onClick={handleGoBack} style={styles.cancelBtn}>
             Hủy bỏ & Quay lại
          </button>

          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#666'}}>
             Đã là thành viên? <span onClick={handleGoBack} style={{color: '#DD2476', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'}}>Đăng nhập tại đây</span>
          </div>
          
        </div>

        {/* Đặt GlobalModal ở cuối cùng */}
        <GlobalModal 
            config={notification} 
            onClose={closeNotification} 
            styles={commonStyles} 
        />
      </div>
    </>
  );
};

export default Register;