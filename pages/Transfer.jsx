import React, { useState, useEffect, useRef } from 'react';
import { bankingService } from '../services/bankingService';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal';
import Layout from '../components/Layout';
import { useNotification } from '../utils/useNotification';
import { useGlobalLoading } from '../context/LoadingContext';

const Transfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const billRef = useRef(null); 

  // --- STATE QUẢN LÝ ---
  const [formData, setFormData] = useState({
    sourceAccountNumber: '',
    destinationAccountNumber: '',
    amount: '',
    description: '',
  });

  const [currentBalance, setCurrentBalance] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [recipientName, setRecipientName] = useState(''); 
  const [isAccountChecked, setIsAccountChecked] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [inputCaptcha, setInputCaptcha] = useState('');
  const { notification, showFeature, showError, showSuccess, closeNotification } = useNotification();
  const { showLoading, hideLoading, isLoading } = useGlobalLoading();


  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!user || !user.id) { navigate('/'); return; }
      try {
        const res = await bankingService.getAccountInfo(user.id);
        setFormData(prev => ({ ...prev, sourceAccountNumber: res.data.accountNumber }));
        setCurrentBalance(res.data.balance);
        setCurrency(res.data.currency || 'VND');
      } catch (error) { navigate('/dashboard'); }
    };
    fetchAccountInfo();
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (location.state?.scannedAccount && formData.sourceAccountNumber) {
        const scannedAcc = location.state.scannedAccount;
        if (scannedAcc === formData.sourceAccountNumber) {
            showError("⚠️ Không thể chuyển cho chính mình!");
            navigate('/dashboard');
            return;
        }
        setFormData(prev => ({ ...prev, destinationAccountNumber: scannedAcc }));
        autoCheckAccount(user.id, scannedAcc);
    }
  }, [location.state, formData.sourceAccountNumber]);

  const generateCaptcha = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); }
    setCaptchaCode(code);
    setInputCaptcha('');
  };

  const autoCheckAccount = async (userId, accNum) => {
    try {
        const res = await bankingService.checkDestinationAccount(userId, accNum);
        setRecipientName(res.data.accountName || res.data);
        setIsAccountChecked(true);
    } catch (error) { console.error(error); }
  };

  const handleCheckAccount = async () => {
    if (!formData.destinationAccountNumber) return showError("Vui lòng nhập số tài khoản!");
    if (formData.destinationAccountNumber === formData.sourceAccountNumber) return showError("⛔ Không thể chuyển cho chính mình!");
    showLoading("Đang xử lý...")
    try {
      const res = await bankingService.checkDestinationAccount(user.id, formData.destinationAccountNumber);
      setRecipientName(res.data.accountName || res.data);
      setIsAccountChecked(true);
    } catch (error) { showError("❌ Không tìm thấy tài khoản!"); setIsAccountChecked(false); setRecipientName(''); } 
    finally { hideLoading(); }
  };

  const handleResetAccount = () => {
    setIsAccountChecked(false); setRecipientName('');
    setFormData(prev => ({ ...prev, destinationAccountNumber: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputCaptcha.toUpperCase() !== captchaCode) { showError("Mã Captcha sai!"); generateCaptcha(); return; }
    if (parseFloat(formData.amount) > currentBalance) { showError("Số dư không đủ!"); return; }

    showLoading("Đang xử lý...");
    try {
      const payload = {
        sourceAccountNumber: formData.sourceAccountNumber,
        destinationAccountNumber: formData.destinationAccountNumber,
        amount: parseFloat(formData.amount),
        transactionType: 'TRANSFER', currency: currency, description: formData.description
      };
      const res = await bankingService.createTransaction(user.id, payload);
      setTransactionResult(res.data);
    } catch (error) { showError(`Lỗi: ${error.response?.data?.message || 'Thất bại'}`); generateCaptcha(); } 
    finally { hideLoading(); }
  };

  const handleSaveBill = () => {
    if (billRef.current) {
        html2canvas(billRef.current).then(canvas => {
            const link = document.createElement('a');
            link.download = `Bill_${transactionResult.transactionReference}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }
  };

  // --- RESPONSIVE WEB STYLES ---
  const styles = {
    container: {
        maxWidth: 'min(800px, 95vw)',
        margin: '0 auto',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        borderRadius: 'clamp(8px, 1.5vw, 12px) clamp(8px, 1.5vw, 12px) 0 0',
        color: 'white',
        textAlign: 'center',
        marginBottom: '0',
    },
    atmCard: {
        background: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
        margin: '0 0 clamp(1.5rem, 4vw, 2.5rem) 0',
        borderRadius: '0 0 clamp(8px, 1.5vw, 12px) clamp(8px, 1.5vw, 12px)',
        padding: 'clamp(1.25rem, 3vw, 2rem)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(33, 147, 176, 0.3)',
        position: 'relative',
    },
    chip: {
        width: '40px', height: '30px', background: '#ffdb4d', borderRadius: '5px', marginBottom: '15px',
        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
    },
    formBody: { 
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        backgroundColor: 'white',
        borderRadius: 'clamp(8px, 1.5vw, 12px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    inputGroup: { marginBottom: 'clamp(1rem, 3vw, 1.5rem)' },
    label: { 
        display: 'block', 
        marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
        fontSize: 'clamp(11px, 2vw, 13px)', 
        color: '#666', 
        fontWeight: '600', 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px' 
    },
    input: {
        width: '100%', 
        padding: 'clamp(0.75rem, 2vw, 1rem)', 
        borderRadius: 'clamp(8px, 1.5vw, 12px)',
        border: '1px solid #e0e0e0', 
        background: '#f9f9f9',
        fontSize: 'clamp(14px, 2.5vw, 16px)', 
        fontWeight: '500', 
        color: '#333',
        outline: 'none', 
        transition: 'all 0.3s',
        boxSizing: 'border-box'
    },
    btnCheck: {
        position: 'absolute', right: '5px', top: '33px', // Căn chỉnh nút kiểm tra vào trong input
        padding: '8px 15px', borderRadius: '8px',
        border: 'none', background: 'linear-gradient(45deg, #11998e, #38ef7d)',
        color: 'white', fontWeight: 'bold', cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(56, 239, 125, 0.3)'
    },
    recipientBox: {
        marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
        padding: 'clamp(0.75rem, 2vw, 1rem)', 
        borderRadius: 'clamp(8px, 1.5vw, 10px)',
        background: 'rgba(56, 239, 125, 0.15)', 
        color: '#007f30',
        display: 'flex', 
        alignItems: 'center', 
        gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
        fontSize: 'clamp(13px, 2.5vw, 14px)'
    },
    btnSubmit: {
        width: '100%', 
        padding: 'clamp(0.75rem, 2vw, 1rem)', 
        borderRadius: 'clamp(10px, 2vw, 15px)',
        border: 'none', 
        background: 'linear-gradient(135deg, #0062cc, #00c6ff)',
        color: '#ffffff', 
        fontSize: 'clamp(16px, 3vw, 18px)', 
        fontWeight: 'bold',
        cursor: 'pointer', 
        marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        boxShadow: '0 8px 20px rgba(0, 98, 204, 0.4)',
        transition: 'transform 0.2s',
    },
    // BILL STYLES
    billOverlay: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
        zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
    },
    billCard: {
        background: 'white', width: '100%', maxWidth: '380px',
        padding: '0', borderRadius: '0',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
    },
    billHeader: {
        background: '#28a745', padding: '30px 20px', textAlign: 'center', color: 'white',
        borderBottom: '5px dashed white' 
    }
  };


  if (transactionResult) {
    return (
        <div style={styles.billOverlay}>
            <div style={styles.billCard} ref={billRef}>

                <div style={styles.billHeader}>
                    <div style={{width: '60px', height: '60px', background: 'white', borderRadius: '50%', margin: '0 auto 15px auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <span style={{fontSize: '30px', color: '#28a745'}}>✓</span>
                    </div>
                    <h2 style={{margin: 0, fontSize: 'clamp(18px, 3.5vw, 20px)', color: '#ffffff'}}>Giao dịch thành công!</h2>
                    <p style={{margin: 'clamp(0.5rem, 1.5vw, 0.75rem) 0 0 0', opacity: 0.95, fontSize: 'clamp(13px, 2.5vw, 14px)', color: '#ffffff'}}>{new Date().toLocaleString('vi-VN')}</p>
                    <h1 style={{margin: 'clamp(0.75rem, 2vw, 1rem) 0 0 0', fontSize: 'clamp(26px, 5vw, 32px)', color: '#ffffff'}}>{transactionResult.amount.toLocaleString()} VND</h1>
                </div>

                {/* Phần nội dung chi tiết */}
                <div style={{padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)', background: '#fdfdfd'}}>
                    <RowBill label="Mã giao dịch" value={transactionResult.transactionReference} />
                    <RowBill label="Nguồn" value={transactionResult.sourceAccountNumber} />
                    <RowBill label="Người nhận" value={transactionResult.destinationAccountName || transactionResult.destinationAccountNumber} />
                    <RowBill label="Nội dung" value={transactionResult.description} />
                    <RowBill label="Phí GD" value="Miễn phí" isStatus={true} />
                </div>

                {/* Footer Hóa đơn */}
                <div style={{padding: 'clamp(1rem, 3vw, 1.5rem)', background: '#f5f5f5', textAlign: 'center'}}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Verify" width="60" style={{opacity: 0.7}} />
                    <p style={{fontSize: 'clamp(9px, 2vw, 10px)', color: '#666', margin: 'clamp(0.5rem, 1.5vw, 0.75rem) 0'}}>HUY BANK - Smart Banking</p>
                </div>
            </div>

            {/* Các nút hành động bên dưới hóa đơn */}
            <div style={{position: 'absolute', bottom: '30px', display: 'flex', gap: '15px'}}>
                <button onClick={handleSaveBill} style={{padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 2rem)', borderRadius: 'clamp(20px, 4vw, 30px)', border: 'none', background: '#ffffff', color: '#333', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontSize: 'clamp(13px, 2.5vw, 14px)'}}>📸 Lưu ảnh</button>
                <button onClick={() => navigate('/dashboard')} style={{padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 2rem)', borderRadius: 'clamp(20px, 4vw, 30px)', border: 'none', background: '#28a745', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(40, 167, 69, 0.4)', fontSize: 'clamp(13px, 2.5vw, 14px)'}}>Về trang chủ 🏠</button>
            </div>
        </div>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
            <h2 style={{margin: 0, fontSize: '24px', fontWeight: '600'}}>Chuyển khoản</h2>
        </div>

        {/* THẺ ATM ẢO HIỂN THỊ SỐ DƯ */}
        <div style={styles.atmCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <div style={styles.chip}></div>
                <span style={{fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 'bold', opacity: 0.9, color: '#ffffff'}}>HUY BANK</span>
            </div>
            <div style={{fontSize: 'clamp(12px, 2.5vw, 14px)', opacity: 0.95, marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)', color: '#ffffff'}}>Số tài khoản nguồn</div>
            <div style={{fontSize: 'clamp(18px, 3.5vw, 20px)', letterSpacing: 'clamp(1px, 0.5vw, 2px)', fontWeight: 'bold', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', textShadow: '0 2px 4px rgba(0,0,0,0.2)', color: '#ffffff'}}>
                {formData.sourceAccountNumber ? formData.sourceAccountNumber.replace(/(\d{4})/g, '$1 ').trim() : '.... .... ....'}
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                 <div>
                    <div style={{fontSize: 'clamp(9px, 2vw, 10px)', opacity: 0.9, color: '#ffffff'}}>CHỦ THẺ</div>
                    <div style={{fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: 'bold', color: '#ffffff'}}>{user?.accountName || user?.username || 'PHAM DUC HUY'}</div>
                 </div>
                 <div style={{textAlign: 'right'}}>
                     <div style={{fontSize: 'clamp(9px, 2vw, 10px)', opacity: 0.9, color: '#ffffff'}}>SỐ DƯ KHẢ DỤNG</div>
                     <div style={{fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 'bold', color: '#ffffff'}}>{currentBalance.toLocaleString()} {currency}</div>
                 </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formBody}>
            
            {/* BƯỚC 1: NHẬP SỐ TÀI KHOẢN */}
            <div style={styles.inputGroup}>
                <label style={styles.label}>Tài khoản thụ hưởng</label>
                <div style={{position: 'relative'}}>
                    <input 
                        placeholder="Nhập số tài khoản người nhận..." 
                        value={formData.destinationAccountNumber}
                        onChange={e => setFormData({...formData, destinationAccountNumber: e.target.value})} 
                        disabled={isAccountChecked}
                        style={styles.input}
                    />
                    {!isAccountChecked ? (
                        <button 
                            type="button" 
                            onClick={handleCheckAccount} 
                            disabled={isLoading} // Chặn click khi đang tải
                            style={{
                                ...styles.btnCheck,
                                // Thêm hiệu ứng mờ đi khi đang tải
                                opacity: isLoading ? 0.7 : 1, 
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            KIỂM TRA
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleResetAccount} 
                            disabled={isLoading} 
                            style={{
                                ...styles.btnCheck, 
                                background: '#ffc107', 
                                color: '#333',

                                opacity: isLoading ? 0.7 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            SỬA ✏️
                        </button>
                    )}
                </div>
                
                {/* Hiển thị tên người nhận sau khi check */}
                {isAccountChecked && recipientName && (
                    <div style={styles.recipientBox}>
                        <div style={{width: 'clamp(28px, 5vw, 30px)', height: 'clamp(28px, 5vw, 30px)', background: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>👤</div>
                        <div>
                            <div style={{fontSize: 'clamp(9px, 2vw, 10px)', opacity: 0.7, color: '#666'}}>TÊN NGƯỜI NHẬN</div>
                            <strong style={{color: '#333', fontSize: 'clamp(13px, 2.5vw, 14px)'}}>{recipientName.toUpperCase()}</strong>
                        </div>
                    </div>
                )}
            </div>

            {/* BƯỚC 2: NHẬP TIỀN & NỘI DUNG */}
            {isAccountChecked && (
                <div style={{animation: 'fadeIn 0.5s'}}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Số tiền muốn chuyển</label>
                        <input 
                            type="number" 
                            placeholder="0 VND" 
                            value={formData.amount} 
                            onChange={e => setFormData({...formData, amount: e.target.value})} 
                            style={{...styles.input, color: '#0062cc', fontWeight: 'bold', fontSize: 'clamp(18px, 3.5vw, 20px)'}}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Lời nhắn</label>
                        <input 
                            placeholder="Nhập nội dung chuyển tiền..." 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            style={styles.input}
                        />
                    </div>

                    {/* CAPTCHA SECTION */}
                    <div style={{background: '#f8f9fa', padding: 'clamp(0.75rem, 2vw, 1rem)', borderRadius: 'clamp(10px, 2vw, 15px)', border: '1px dashed #ccc', marginBottom: 'clamp(1rem, 3vw, 1.5rem)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'}}>
                             <label style={{...styles.label, margin: 0, color: '#333'}}>Mã xác thực</label>
                             <div style={{fontFamily: 'monospace', fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 'bold', letterSpacing: 'clamp(2px, 0.5vw, 3px)', background: '#e2e6ea', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: 'clamp(4px, 1vw, 5px)', userSelect: 'none', color: '#333'}}>{captchaCode}</div>
                             <span onClick={generateCaptcha} style={{cursor: 'pointer', fontSize: 'clamp(16px, 3vw, 18px)'}}>🔄</span>
                        </div>
                        <input 
                            placeholder="Nhập mã bảo mật ở trên" 
                            value={inputCaptcha} 
                            onChange={e => setInputCaptcha(e.target.value)} 
                            style={{...styles.input, background: '#ffffff', color: '#333'}}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={styles.btnSubmit}>
                        {isLoading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN CHUYỂN TIỀN 🚀'}
                    </button>
                </div>
            )}
        </form>
      </div>

      {/* GlobalModal */}
      <GlobalModal 
          config={notification} 
          onClose={closeNotification} 
          styles={commonStyles} 
      />
    </Layout>
  );
};

// Component con để render dòng hóa đơn
const RowBill = ({ label, value, isStatus }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', borderBottom: '1px solid #e0e0e0', paddingBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
        <span style={{ color: '#666', fontSize: 'clamp(12px, 2.5vw, 13px)' }}>{label}</span>
        <span style={{ fontWeight: '600', color: isStatus ? '#28a745' : '#333', fontSize: 'clamp(13px, 2.5vw, 14px)', textAlign: 'right', maxWidth: '60%' }}>
            {value}
        </span>
    </div>
);

// Thêm keyframe cho animation (cần chèn vào file CSS global hoặc dùng style tag)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(styleSheet);

export default Transfer;