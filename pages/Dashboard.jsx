import React, { useEffect, useState, useRef, useMemo } from 'react';
import { bankingService } from '../services/bankingService';
import { useNavigate } from 'react-router-dom';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal';
import Layout from '../components/Layout';
import { useNotification } from '../utils/useNotification';
import { useGlobalLoading } from '../context/LoadingContext';
import jsQR from 'jsqr';
import { Client } from '@stomp/stompjs';

const NOTIFICATION_SOUND = 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Glass_ping.mp3';

const Dashboard = () => {
  const { notification, showFeature, showError, closeNotification } = useNotification();
  const { showLoading, hideLoading } = useGlobalLoading();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const stompClient = useRef(null);

  const audioPlayer = useMemo(() => {
      const audio = new Audio(NOTIFICATION_SOUND);
      audio.volume = 1.0;
      return audio;
  }, []);

  const fileInputRef = useRef(null);

  // --- STATE ---
  const [account, setAccount] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const fetchData = async () => {
      try {
        const [accRes, notifRes] = await Promise.all([
          bankingService.getAccountInfo(user.id),
          bankingService.getNotifications(user.id)
        ]);
        setAccount(accRes.data);
        const sortedNotifs = (notifRes.data || []).sort((a, b) => 
            new Date(b.transactionDate) - new Date(a.transactionDate)
        );
        setNotifications(sortedNotifs);
      } catch (error) { console.error("Lỗi data:", error); }
    };
    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    if (!account?.accountNumber) return;

    if (stompClient.current && stompClient.current.active) {
        return; 
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const client = new Client({
        brokerURL: 'wss://banking.duchuysaidepchieu.id.vn/ws/websocket',
        
        connectHeaders: {
            Authorization: `Bearer ${token}` 
        },
        
        reconnectDelay: 5000, 
        
        onConnect: () => {
            console.log('Đã kết nối STOMP thành công!');
            
            // Subscribe vào đúng kênh riêng của User
            // Topic: /queue/notifications/{accountNumber}
            const topic = `/queue/notifications/${account.accountNumber}`;
            console.log(`Đang lắng nghe tại: ${topic}`);

            client.subscribe(topic, (message) => {
                if (message.body) {
                    const newNotif = JSON.parse(message.body);
                    console.log("Có thông báo mới:", newNotif);

                    setNotifications((prev) => [newNotif, ...prev]);

                    const updatedBalance = newNotif.balance;
                    alert("Đã cập nhật chưa nhỉ")

                    if (updatedBalance !== undefined && updatedBalance !== null) {
                        console.log("Cập nhật nóng số dư:", updatedBalance);
                        
                        
                        setAccount((prevAccount) => ({
                            ...prevAccount,       // Giữ nguyên tên, số TK, currency...
                            balance: updatedBalance // Chỉ thay đổi số dư
                        }));
                    }
                    try {
                        audioPlayer.currentTime = 0;
                        
                        const playPromise = audioPlayer.play();
                        
                        if (playPromise !== undefined) {
                            playPromise.catch((error) => {
                                console.warn("⚠️ Autoplay bị chặn (Click vào trang để mở khóa):", error);
                            });
                        }
                    } catch (err) {
                        console.error("Lỗi Audio:", err);
                    }
                }
            });
        },
        
        onStompError: (frame) => {
            console.error('Lỗi STOMP:', frame.headers['message']);
            console.error('Chi tiết:', frame.body);
        },

        onWebSocketClose: () => {
            //console.log('Mất kết nối WebSocket.');
            
        }
    });

    client.activate();
    stompClient.current = client;

    return () => {
        if (stompClient.current) {
            stompClient.current.deactivate();
            stompClient.current = null;
        }
        // Cleanup audio
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
    };
  }, [account?.accountNumber, audioPlayer]);


  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await bankingService.markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    } catch (error) { console.error(error); }
  };

  const scanQRFromImage = (file) => { 
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = img.width; canvas.height = img.height;
          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) resolve(code.data); else reject(new Error("No QR found"));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      event.target.value = '';
      try {
        showLoading("📸 Đang phân tích mã QR..."); 
        let rawQrContent
        try {
            // Thời gian giới hạn: 5000ms (5 giây)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Request timed out")), 5000)
            );

            rawQrContent = await Promise.race([
                scanQRFromImage(file), 
                timeoutPromise
            ]);

            console.log("Kết quả:", rawQrContent);
            hideLoading()

        } catch (error) {
            hideLoading()
            if (error.message === "Request timed out") {
                showError("Quét QR quá lâu, vui lòng thử lại!");
            } else {
                showError("Lỗi khi quét QR: " + error.message);
            }
        }
        let qrData;
        try { qrData = JSON.parse(rawQrContent); } catch(err) {showError("QR sai định dạng!"); return; }

        if (qrData.bankCode !== "HUY_BANK_CORE") { showError("Ngân hàng không hỗ trợ!"); return; }
        if (!qrData.accountNumber) { showError("Thiếu số tài khoản!"); return; }

        navigate('/transfer', { state: { scannedAccount: qrData.accountNumber } });
      } catch (error) { showError("Ảnh không hợp lệ."); }
    }
  };

  const handleDownloadQR = () => {
    if (!account?.qrCode) return;
    const qrSrc = account.qrCode.startsWith('data:image') ? account.qrCode : `data:image/png;base64,${account.qrCode}`;
    const link = document.createElement('a');
    link.href = qrSrc; link.download = `MyQRCode_${account.accountNumber}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };


  const features = [
    { name: 'Chuyển tiền', icon: '💸', action: () => navigate('/transfer'), bg: '#e3f2fd', color: '#0d47a1' },
    { name: 'Tiết kiệm', icon: '🐷', action: () => showFeature('Gửi Tiết Kiệm'), bg: '#fff3e0', color: '#e65100' },
    { name: 'Nạp ĐT', icon: '📱', action: () => showFeature('Nạp tiền điện thoại'), bg: '#e8f5e9', color: '#1b5e20' },
    { name: 'Thanh toán', icon: '🧾', action: () => showFeature('Thanh toán hóa đơn'), bg: '#f3e5f5', color: '#4a148c' },
    { name: 'Đầu tư', icon: '📈', action: () => showFeature('Đầu tư tài chính'), bg: '#ffebee', color: '#b71c1c' },
    { name: 'Vé máy bay', icon: '✈️', action: () => showFeature('Đặt vé máy bay'), bg: '#e0f7fa', color: '#006064' },
    { name: 'Thẻ game', icon: '🎮', action: () => showFeature('Mua thẻ Game'), bg: '#fce4ec', color: '#880e4f' },
    { name: 'Đổi quà', icon: '🎁', action: () => showFeature('Đổi điểm thưởng'), bg: '#fff8e1', color: '#ff6f00' },
  ];

  // --- RESPONSIVE WEB STYLES ---
  const styles = {
    container: {
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    welcomeSection: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      padding: 'clamp(1.5rem, 4vw, 2.5rem)',
      color: 'white',
      marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
    },
    card: {
      backgroundColor: 'white',
      padding: 'clamp(1.25rem, 3vw, 2rem)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 25vw), 1fr))',
      gap: 'clamp(1rem, 3vw, 1.5rem)',
      marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
    },
    gridItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      cursor: 'pointer',
      padding: 'clamp(0.75rem, 2vw, 1rem)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      transition: 'all 0.3s',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    iconBox: {
      width: 'clamp(50px, 8vw, 60px)',
      height: 'clamp(50px, 8vw, 60px)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'clamp(22px, 4vw, 28px)',
      marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
    },
    menuLabel: {
      fontSize: 'clamp(11px, 2vw, 13px)',
      color: '#555',
      fontWeight: '600',
    },
    banner: {
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      padding: 'clamp(1.25rem, 3vw, 2rem)',
      background: 'linear-gradient(135deg, #ff9966, #ff5e62)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: 'white',
      boxShadow: '0 4px 12px rgba(255, 94, 98, 0.3)',
      marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
    },
    scanButton: {
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 2rem)',
      background: 'linear-gradient(135deg, #28a745, #218838)',
      color: 'white',
      border: 'none',
      borderRadius: 'clamp(6px, 1.5vw, 8px)',
      fontSize: 'clamp(14px, 2.5vw, 16px)',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
      marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
    },
    notifButton: {
      position: 'fixed',
      bottom: 'clamp(1rem, 3vw, 2rem)',
      right: 'clamp(1rem, 3vw, 2rem)',
      width: 'clamp(50px, 8vw, 60px)',
      height: 'clamp(50px, 8vw, 60px)',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      fontSize: 'clamp(20px, 4vw, 24px)',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1100,
    },
    notifPanel: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      maxWidth: '90%',
      height: '100%',
      backgroundColor: 'white',
      zIndex: 1200,
      padding: '20px',
      overflowY: 'auto',
      boxShadow: '-5px 0 20px rgba(0,0,0,0.1)',
    },
    badge: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      backgroundColor: '#ff3b30',
      color: 'white',
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '12px',
      minWidth: '20px',
      textAlign: 'center',
    },
  };


return (
    <Layout>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
      <div style={styles.container}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h2 style={{ margin: '0 0 clamp(0.5rem, 1.5vw, 0.75rem) 0', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 'bold' }}>
            Xin chào, {account?.accountName || user?.accountName || user?.username}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Chào mừng bạn trở lại!</p>
        </div>

        {/* CARD TÀI KHOẢN */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: 'clamp(11px, 2vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tài khoản thanh toán</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', marginTop: 'clamp(0.25rem, 1vw, 0.5rem)' }}>
                <p style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600', color: '#333', letterSpacing: '1px' }}>
                  {showAccountDetails ? account?.accountNumber : '•••• •••• ••••'}
                </p>
                <button onClick={() => setShowAccountDetails(!showAccountDetails)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#007bff', fontSize: 'clamp(14px, 2.5vw, 16px)', padding: 0 }}>
                  {showAccountDetails ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div onClick={() => showFeature('Xác thực vân tay')} style={{ cursor: 'pointer', opacity: 0.5, fontSize: 'clamp(20px, 4vw, 24px)' }}>👆</div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #e0e0e0', margin: 'clamp(1rem, 3vw, 1.5rem) 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: 'clamp(11px, 2vw, 12px)' }}>Số dư khả dụng</p>
              <p style={{ margin: 'clamp(0.25rem, 1vw, 0.5rem) 0 0 0', fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 'bold', color: '#28a745' }}>
                {!account ? (
                        <span style={{fontSize: '16px', color: '#999'}}>⏳ Đang cập nhật...</span>
                    ) : (
                        showAccountDetails 
                            ? `${account.balance.toLocaleString()} ${account.currency}` 
                            : '******'
                    )}
              </p>
            </div>
            {showAccountDetails && (
              <button onClick={handleDownloadQR} style={{ fontSize: 'clamp(11px, 2vw, 12px)', padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)', background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 'clamp(6px, 1.5vw, 8px)', cursor: 'pointer', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 'clamp(0.25rem, 1vw, 0.5rem)' }}>
                ⬇ QR
              </button>
            )}
          </div>
        </div>

        {/* Services Grid */}
        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px', fontWeight: '700' }}>Dịch vụ tài chính</h3>
        <div style={styles.gridContainer}>
          {features.map((item, index) => (
            <div 
              key={index} 
              style={styles.gridItem} 
              onClick={item.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ ...styles.iconBox, background: item.bg, color: item.color }}>{item.icon}</div>
              <span style={styles.menuLabel}>{item.name}</span>
            </div>
          ))}
        </div>

        {/* Banner */}
        <div style={styles.banner}>
          <div>
            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Sổ Tiết Kiệm Online</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Lãi suất hấp dẫn tới 8.5%/năm</p>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', marginTop: '10px', display: 'inline-block' }}>🔥 Hot</span>
          </div>
          <span style={{ fontSize: '60px', transform: 'rotate(-10deg)', opacity: 0.9 }}>💰</span>
        </div>

        {/* QR Scan Button */}
        <button onClick={() => fileInputRef.current.click()} style={styles.scanButton}>
          📸 Quét QR Code
        </button>

        {/* Notification Button */}
        <button 
          onClick={() => setShowNotificationPanel(true)} 
          style={styles.notifButton}
        >
          🔔
          {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
        </button>

        {/* PANEL THÔNG BÁO */}
        {showNotificationPanel && (
          <>
            <div style={styles.notifOverlay} onClick={() => setShowNotificationPanel(false)}></div>
            <div style={styles.notifPanel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
                <h3 style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 18px)', color: '#333', fontWeight: '600' }}>Thông báo</h3>
                <button onClick={() => setShowNotificationPanel(false)} style={{ border: 'none', background: 'none', fontSize: 'clamp(20px, 4vw, 24px)', cursor: 'pointer', color: '#666' }}>&times;</button>
              </div>
              
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 'clamp(2rem, 5vw, 3rem)', color: '#666' }}>
                  <div style={{ fontSize: 'clamp(32px, 6vw, 40px)', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>📭</div>
                  <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', color: '#666' }}>Chưa có thông báo mới</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {notifications.map((notif) => (
                    <li key={notif.id} onClick={() => handleMarkAsRead(notif)} style={{ padding: 'clamp(0.75rem, 2vw, 1rem)', borderBottom: '1px solid #e0e0e0', background: notif.isRead ? '#ffffff' : '#f0f9ff', borderRadius: 'clamp(8px, 1.5vw, 10px)', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)', cursor: 'pointer', position: 'relative' }}>
                      {!notif.isRead && <span style={{ position: 'absolute', top: 'clamp(0.75rem, 2vw, 1rem)', right: 'clamp(0.5rem, 1.5vw, 0.75rem)', width: 'clamp(6px, 1.5vw, 8px)', height: 'clamp(6px, 1.5vw, 8px)', background: '#007bff', borderRadius: '50%' }}></span>}
                      <div style={{ fontWeight: '600', color: '#333', marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)', fontSize: 'clamp(13px, 2.5vw, 14px)', lineHeight: '1.4' }}>{notif.description}</div>
                      <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: '#666', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                        <div>Mã GD: <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: 'clamp(0.125rem, 0.5vw, 0.25rem) clamp(0.25rem, 1vw, 0.5rem)', borderRadius: 'clamp(3px, 1vw, 4px)', color: '#333' }}>{notif.transactionReference}</span></div>
                        {notif.accountNumber && (<div style={{ marginTop: 'clamp(0.125rem, 0.5vw, 0.25rem)', color: '#666' }}>TK: {notif.accountNumber}</div>)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(11px, 2vw, 12px)' }}>
                        <span style={{ color: '#666' }}>{new Date(notif.transactionDate).toLocaleString('vi-VN')}</span>
                        <span style={{ fontWeight: 'bold', color: notif.amount.includes('-') ? '#dc3545' : '#28a745', fontSize: 'clamp(12px, 2.5vw, 13px)' }}>
                          {parseFloat(notif.amount).toLocaleString()} đ
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <GlobalModal 
          config={notification} 
          onClose={closeNotification} 
          styles={commonStyles} 
      />
    </Layout>
  );
};

export default Dashboard;