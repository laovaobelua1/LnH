import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankingService } from '../services/bankingService';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal';
import Layout from '../components/Layout';
import { useNotification } from '../utils/useNotification';
import { useGlobalLoading } from '../context/LoadingContext';

const UpdateAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // State quản lý dữ liệu
  const [accountName, setAccountName] = useState('');
  const [originalData, setOriginalData] = useState(null); // Lưu dữ liệu cũ để gửi lại backend
  const { notification, showFeature, showError, showSuccess, closeNotification } = useNotification();
  const { showLoading, hideLoading, isLoading } = useGlobalLoading();
  const [fetching, setFetching] = useState(true);

  // --- 1. LẤY DỮ LIỆU CŨ KHI VÀO TRANG ---
  useEffect(() => {
    if (!user || !user.id) {
      navigate('/');
      return;
    }

    const fetchCurrentInfo = async () => {
      try {
        const response = await bankingService.getAccountInfo(user.id);
        const data = response.data;
        
        // Lưu dữ liệu gốc
        setOriginalData(data);
        // Điền tên hiện tại vào ô nhập
        setAccountName(data.accountName || '');
      } catch (error) {
        console.error("Lỗi lấy thông tin:", error);
        showError("Không thể tải thông tin tài khoản!");
        navigate('/settings');
      } finally {
        setFetching(false);
      }
    };

    fetchCurrentInfo();
  }, [user?.id, navigate]);

  // --- 2. XỬ LÝ CẬP NHẬT ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!accountName.trim()) {
        showError("Tên tài khoản không được để trống!");
        return;
    }

    showLoading("Đang xử lý...");

    try {
        // 1. Kiểm tra dữ liệu gốc có tồn tại không
        if (!originalData) {
            showError("Chưa tải được thông tin tài khoản, vui lòng thử lại!");
            return;
        }

        // 2. Chuẩn bị Payload với số dư THỰC TẾ
        const payload = {
            userId: user.id,
            accountName: accountName, // Tên mới người dùng nhập
            
            // Lấy lại các thông tin cũ từ originalData
            accountType: originalData.accountType, 
            currency: originalData.currency,
            
            initialDeposit: originalData.balance > 0 ? originalData.balance : 1 
        };

        console.log("Gửi payload chuẩn:", payload);

      const response = await bankingService.updateAccount(user.id, payload);
      
      // Cập nhật thành công -> Lưu lại vào LocalStorage để đồng bộ hiển thị
      const updatedAccount = response.data;
      
      // Cập nhật lại user trong localStorage (nếu có lưu accountName ở đó)
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          accountName: updatedAccount.accountName
      }));

      showSuccess("Cập nhật tên tài khoản thành công!");
      navigate('/dashboard'); // Hoặc quay lại Settings

    } catch (error) {
      console.error("Lỗi update:", error);
      showError("Cập nhật thất bại: " + (error.response?.data?.message || "Lỗi hệ thống"));
    } finally {
      hideLoading();
    }
  };

  // --- STYLES (Glassmorphism) ---
  const styles = {
    wrapper: {
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: "'Segoe UI', Roboto, sans-serif", padding: '20px'
    },
    card: {
      width: '100%', maxWidth: '500px',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
    },
    title: {
      textAlign: 'center', color: '#333', fontSize: '24px', fontWeight: 'bold', marginBottom: '30px'
    },
    inputGroup: { marginBottom: 'clamp(1rem, 3vw, 1.5rem)' },
    label: { 
      display: 'block', 
      marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
      color: '#333', 
      fontWeight: '600', 
      fontSize: 'clamp(13px, 2.5vw, 14px)' 
    },
    input: {
      width: '100%', 
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)', 
      border: '1px solid #ddd',
      fontSize: 'clamp(14px, 2.5vw, 16px)', 
      outline: 'none', 
      transition: '0.3s',
      backgroundColor: '#ffffff',
      color: '#333',
      boxSizing: 'border-box'
    },
    inputDisabled: {
      width: '100%', 
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)', 
      border: '1px solid #e0e0e0',
      fontSize: 'clamp(14px, 2.5vw, 16px)', 
      outline: 'none',
      backgroundColor: '#f9f9f9', 
      color: '#666',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%', 
      padding: 'clamp(0.75rem, 2vw, 1rem)',
      background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
      color: '#ffffff', 
      border: 'none', 
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      fontSize: 'clamp(14px, 2.5vw, 16px)', 
      fontWeight: 'bold', 
      cursor: 'pointer',
      marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
      boxShadow: '0 5px 15px rgba(79, 172, 254, 0.4)',
      opacity: isLoading ? 0.7 : 1
    },
    backButton: {
      marginTop: '15px', textAlign: 'center', cursor: 'pointer', color: '#666', fontSize: '14px'
    }
  };

  if (fetching) return <div style={{textAlign: 'center', marginTop: 'clamp(2rem, 5vw, 3rem)', color: '#333', fontSize: 'clamp(14px, 2.5vw, 16px)'}}>⏳ Đang tải thông tin...</div>;

  return (
    <Layout>
      <div style={{maxWidth: 'min(600px, 95vw)', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: 'clamp(8px, 1.5vw, 12px)', padding: 'clamp(2rem, 5vw, 3rem)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <h2 style={{fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#333'}}>✏️ Cập Nhật Tài Khoản</h2>

        <form onSubmit={handleUpdate}>
          {/* 1. Tên tài khoản (CHO PHÉP SỬA) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên hiển thị mới</label>
            <input 
              type="text" 
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nhập tên tài khoản mới"
              required
              style={styles.input}
            />
          </div>

          {/* 2. Số tài khoản (KHÔNG CHO SỬA) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Số tài khoản (Cố định)</label>
            <input 
              type="text" 
              value={originalData?.accountNumber || '...'}
              readOnly
              disabled
              style={styles.inputDisabled}
            />
          </div>

          {/* 3. Loại tài khoản (KHÔNG CHO SỬA) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Loại tài khoản</label>
            <input 
              type="text" 
              value={originalData?.accountType || 'PAYMENT'}
              readOnly
              disabled
              style={styles.inputDisabled}
            />
          </div>

          {/* 4. Tiền tệ (KHÔNG CHO SỬA) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Đơn vị tiền tệ</label>
            <input 
              type="text" 
              value={originalData?.currency || 'VND'}
              readOnly
              disabled
              style={styles.inputDisabled}
            />
          </div>

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
          </button>
        </form>

        <button 
          onClick={() => navigate('/settings')} 
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '20px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Quay lại Cài đặt
        </button>

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

export default UpdateAccount;