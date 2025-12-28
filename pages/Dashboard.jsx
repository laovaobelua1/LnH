import React, { useEffect, useState, useRef, useMemo } from 'react';
import { bankingService } from '../services/bankingService';
import { useNavigate } from 'react-router-dom';
import { commonStyles } from '../styles/commonStyles';
import GlobalModal from '../components/GlobalModal'; // Import Component
import { useNotification } from '../utils/useNotification'; // Import Hook
import { useGlobalLoading } from '../context/LoadingContext'; // Import Hook
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

  // --- LOGIC API & WEBSOCKET (Giữ nguyên) ---
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

// --- 2. KẾT NỐI WEBSOCKET QUA STOMP (MỚI) ---
  useEffect(() => {
    // Chỉ kết nối khi đã có thông tin tài khoản (để lấy Số TK subscribe)
    if (!account?.accountNumber) return;

    if (stompClient.current && stompClient.current.active) {
        return; 
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    //console.log("🚀 Đang khởi tạo STOMP Client...");

    const client = new Client({
        brokerURL: 'wss://banking.duchuysaidepchieu.id.vn/ws/websocket',
        
        // 🔥 QUAN TRỌNG: Trình duyệt không cho gửi header lúc handshake như Node.js
        // Nên ta gửi Token qua connectHeaders của giao thức STOMP
        connectHeaders: {
            Authorization: `Bearer ${token}` 
        },
        
        reconnectDelay: 5000, // Tự kết nối lại sau 5s nếu mất mạng
        
        onConnect: () => {
            console.log('✅ Đã kết nối STOMP thành công!');
            
            // Subscribe vào đúng kênh riêng của User
            // Topic: /queue/notifications/{accountNumber}
            const topic = `/queue/notifications/${account.accountNumber}`;
            console.log(`📡 Đang lắng nghe tại: ${topic}`);

            client.subscribe(topic, (message) => {
                if (message.body) {
                    const newNotif = JSON.parse(message.body);
                    console.log("🔔 Có thông báo mới:", newNotif);

                    // 1. Cập nhật State
                    setNotifications((prev) => [newNotif, ...prev]);

                    // 2. 🔥 CẬP NHẬT SỐ DƯ NGAY LẬP TỨC (REAL-TIME) 🔥
                    // Kiểm tra xem Backend gửi về key tên là gì (balance, newBalance, v.v...)
                    const updatedBalance = newNotif.balance;
                    alert("Đã cập nhật chưa nhỉ")

                    if (updatedBalance !== undefined && updatedBalance !== null) {
                        console.log("💰 Cập nhật nóng số dư:", updatedBalance);
                        
                        
                        setAccount((prevAccount) => ({
                            ...prevAccount,       // Giữ nguyên tên, số TK, currency...
                            balance: updatedBalance // Chỉ thay đổi số dư
                        }));
                    }
                // 🔥 PHÁT ÂM THANH (Sử dụng biến audioPlayer duy nhất) 🔥
                    try {
                        // Reset thời gian để phát lại được ngay
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
            console.error('❌ Lỗi STOMP:', frame.headers['message']);
            console.error('Chi tiết:', frame.body);
        },

        onWebSocketClose: () => {
            //console.log('⚠️ Mất kết nối WebSocket.');
            
        }
    });

    // Kích hoạt kết nối
    client.activate();
    stompClient.current = client;

    // Dọn dẹp khi thoát trang
    return () => {
        if (stompClient.current) {
            stompClient.current.deactivate();
            stompClient.current = null; // Reset ref
        }
    };
  }, [account?.accountNumber, audioPlayer]); // Chạy lại khi có thông tin account

const handleLogout = () => {
    // 1. Ngắt kết nối STOMP
    if (stompClient.current) {
        stompClient.current.deactivate(); 
        console.log("🛑 Đã ngắt kết nối STOMP");
    }

    // 2. Dừng âm thanh (SỬA LẠI ĐOẠN NÀY)
    // Dùng trực tiếp audioPlayer, không dùng audioRef.current
    if (audioPlayer) {
        audioPlayer.pause();        // Tạm dừng
        audioPlayer.currentTime = 0; // Tua về đầu
    }

    // 3. Xóa dữ liệu phiên làm việc
    bankingService.logout(); 
    localStorage.clear(); 

    // 4. Chuyển hướng về Login
    navigate('/');
};

  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await bankingService.markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    } catch (error) { console.error(error); }
  };

  const scanQRFromImage = (file) => { /* ... Logic scan ảnh (Giữ nguyên) ... */
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
        showLoading("📸 Đang phân tích mã QR..."); // Đặt nội dung
        let rawQrContent
        try {
            // Thời gian giới hạn: 5000ms (5 giây)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Request timed out")), 5000)
            );

            // Đua giữa quét QR và Timeout
            rawQrContent = await Promise.race([
                scanQRFromImage(file), 
                timeoutPromise
            ]);

            // Nếu code chạy đến đây nghĩa là quét QR xong trước 5s
            console.log("Kết quả:", rawQrContent);
            hideLoading()

        } catch (error) {
            hideLoading()
            if (error.message === "Request timed out") {
                showError("❌ Quét QR quá lâu, vui lòng thử lại!");
            } else {
                showError("❌ Lỗi khi quét QR: " + error.message);
            }
        }
        let qrData;
        try { qrData = JSON.parse(rawQrContent); } catch(err) {showError("❌ QR sai định dạng!"); return; }

        if (qrData.bankCode !== "HUY_BANK_CORE") { showError("⛔ Ngân hàng không hỗ trợ!"); return; }
        if (!qrData.accountNumber) { showError("❌ Thiếu số tài khoản!"); return; }

        navigate('/transfer', { state: { scannedAccount: qrData.accountNumber } });
      } catch (error) { showError("❌ Ảnh không hợp lệ."); }
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

  // --- STYLES ĐÃ ĐIỀU CHỈNH CĂN GIỮA ---
// --- CSS STYLES (CĂN GIỮA HOÀN CHỈNH) ---
  const styles = {
    // 1. Lớp nền bao ngoài cùng (Màu xám, căn giữa nội dung)
    outerWrapper: {
      display: 'flex',            // 1. Bật chế độ Flex
      justifyContent: 'center',   // 2. Ép con cái vào giữa
      width: '100%',              // 3. QUAN TRỌNG: Mở rộng khung cha ra hết màn hình
      minHeight: '100vh',         // 4. Cao hết màn hình
      
      // --- Các dòng trang trí ---
      backgroundColor: 'rgba(205, 34, 83, 1)ff', 
      paddingTop: '20px',
      boxSizing: 'border-box',
    },

    // 2. Khung App (Màu trắng, giới hạn chiều rộng)
    container: {
      margin: '0 auto',
      width: '100%',
      maxWidth: '480px',          // QUAN TRỌNG: Giới hạn chiều rộng như điện thoại
      minHeight: '90vh',          // Chiều cao tối thiểu
      backgroundColor: '#ffffffff',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      position: 'relative',       // Để các thành phần con absolute bám theo
      borderRadius: '30px',       // Bo góc cho giống điện thoại
      boxShadow: '0 0 20px rgba(0,0,0,0.1)', // Đổ bóng nổi bật
      overflow: 'hidden',         // Cắt các phần thừa
      paddingBottom: '90px',      // Chừa chỗ cho menu dưới
    },

    // 3. Header
    header: {
      background: 'linear-gradient(135deg, #007bff, #0056b3)',
      padding: '30px 25px 80px 25px',
      color: 'white',
    },

    // 4. Card Tài khoản
    card: {
      backgroundColor: 'white',
      margin: '-50px 20px 20px 20px', // Đẩy lên đè lên header
      padding: '20px',
      borderRadius: '20px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      position: 'relative',
    },

    // 5. Grid tiện ích
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)', // 4 cột đều nhau
      gap: '20px 10px',
      padding: '0 20px',
    },
    gridItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      cursor: 'pointer',
    },
    iconBox: {
      width: '50px',
      height: '50px',
      borderRadius: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      marginBottom: '8px',
    },
    menuLabel: {
      fontSize: '11px',
      color: '#555',
      fontWeight: '600',
    },

    // 6. Banner quảng cáo
    banner: {
      margin: '25px 20px',
      borderRadius: '20px',
      height: '100px',
      background: 'linear-gradient(135deg, #ff9966, #ff5e62)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 25px',
      color: 'white',
      boxShadow: '0 8px 20px rgba(255, 94, 98, 0.3)',
      position: 'relative',
      overflow: 'hidden',
    },

    // 7. Bottom Bar (Menu dưới cùng)
    bottomBar: {
      position: 'fixed',          // Cố định để luôn nổi
      bottom: '25px',             // Cách đáy màn hình một chút
      left: 0, 
      right: 0,                   // Kết hợp left 0 right 0 để căng ngang
      margin: '0 auto',           // Tự động căn giữa
      width: '100%',
      maxWidth: '480px',          // Rộng bằng đúng Container
      height: '75px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '0 0 30px 30px', // Bo tròn đáy khớp với container
      boxShadow: '0 -5px 20px rgba(0,0,0,0.05)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
    },
    navItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#999',
      fontSize: '10px',
      cursor: 'pointer',
      width: '60px',
    },
    scanBtn: {
      width: '65px',
      height: '65px',
      background: 'linear-gradient(135deg, #28a745, #218838)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      color: 'white',
      boxShadow: '0 8px 20px rgba(40, 167, 69, 0.4)',
      transform: 'translateY(-30px)', // Nổi lên trên
      border: '6px solid #f2f4f6',
      cursor: 'pointer',
    },
    
    // Panel thông báo
    notifOverlay: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
    },
    notifPanel: {
      position: 'absolute', top: 0, right: 0, width: '85%', height: '100%',
      backgroundColor: 'white', zIndex: 1200, padding: '20px',
      overflowY: 'auto', boxShadow: '-5px 0 20px rgba(0,0,0,0.1)',
    },
    badge: {
      position: 'absolute', top: '-6px', right: '12px',
      backgroundColor: '#ff3b30', color: 'white',
      fontSize: '10px', padding: '2px 6px', borderRadius: '10px',
    }
  };


return (
    // Lớp bao ngoài cùng để căn giữa
    <div style={styles.outerWrapper}>
      
      {/* Khung App chính */}
      <div style={styles.container}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

        {/* HEADER */}
        <div style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>Xin chào,</p>
              <h2 style={{ margin: '5px 0 0 0', fontSize: '22px', fontWeight: 'bold' }}>
                {account?.accountName ? account.accountName.toUpperCase() : (user?.accountName ? user.accountName.toUpperCase() : user?.username)}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate('/settings')} style={{background: 'rgba(255,255,255,0.2)', width: '35px', height: '35px', borderRadius: '50%', border: 'none', fontSize: '16px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>⚙️</button>
              <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Đăng xuất</button>
            </div>
          </div>
        </div>

        {/* CARD TÀI KHOẢN */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tài khoản thanh toán</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333', letterSpacing: '1px' }}>
                  {showAccountDetails ? account?.accountNumber : '•••• •••• ••••'}
                </p>
                <button onClick={() => setShowAccountDetails(!showAccountDetails)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#007bff', fontSize: '16px', padding: 0 }}>
                  {showAccountDetails ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div onClick={() => showFeature('Xác thực vân tay')} style={{ cursor: 'pointer', opacity: 0.5, fontSize: '24px' }}>👆</div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #eee', margin: '20px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>Số dư khả dụng</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#28a745' }}>
                {!account ? (
                        <span style={{fontSize: '16px', color: '#999'}}>⏳ Đang cập nhật...</span>
                    ) : (
                        /* Nếu có dữ liệu -> Kiểm tra xem có đang ẩn số dư không */
                        showAccountDetails 
                            ? `${account.balance.toLocaleString()} ${account.currency}` 
                            : '******'
                    )}
              </p>
            </div>
            {showAccountDetails && (
              <button onClick={handleDownloadQR} style={{ fontSize: '12px', padding: '8px 12px', background: '#f8f9fa', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ⬇ QR
              </button>
            )}
          </div>
        </div>

        {/* LƯỚI TIỆN ÍCH */}
        <h4 style={{ padding: '0 25px', margin: '10px 0 15px 0', color: '#333', fontSize: '15px', fontWeight: '700' }}>Dịch vụ tài chính</h4>
        <div style={styles.gridContainer}>
          {features.map((item, index) => (
            <div key={index} style={styles.gridItem} onClick={item.action}>
              <div style={{ ...styles.iconBox, background: item.bg, color: item.color }}>{item.icon}</div>
              <span style={styles.menuLabel}>{item.name}</span>
            </div>
          ))}
        </div>

        {/* BANNER QUẢNG CÁO */}
        <div style={styles.banner}>
          <div style={{ flex: 1, zIndex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Sổ Tiết Kiệm Online</h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Lãi suất hấp dẫn tới 8.5%/năm</p>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '10px', marginTop: '8px', display: 'inline-block' }}>🔥 Hot</span>
          </div>
          <span style={{ fontSize: '50px', transform: 'rotate(-10deg)', opacity: 0.9 }}>💰</span>
        </div>

        {/* BOTTOM BAR (MENU DƯỚI) */}
        <div style={styles.bottomBar}>
          <div style={{ ...styles.navItem, color: '#007bff' }}>
            <span style={{ fontSize: '22px' }}>🏠</span>
            <span style={{ marginTop: '3px' }}>Trang chủ</span>
          </div>

          <div style={{ ...styles.navItem, position: 'relative' }} onClick={() => setShowNotificationPanel(true)}>
            <span style={{ fontSize: '22px' }}>🔔</span>
            <span style={{ marginTop: '3px' }}>Thông báo</span>
            {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          </div>

          {/* NÚT QUÉT QR Ở GIỮA */}
          <div style={{ position: 'relative', width: '60px', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => fileInputRef.current.click()} style={styles.scanBtn}>📸</button>
          </div>

          <div style={styles.navItem} onClick={() => showFeature('Lịch sử')}>
            <span style={{ fontSize: '22px' }}>🕒</span>
            <span style={{ marginTop: '3px' }}>Lịch sử</span>
          </div>

          <div style={styles.navItem} onClick={() => navigate('/settings')}>
              <span style={{ fontSize: '22px' }}>⚙️</span>
              <span style={{ marginTop: '3px' }}>Cài đặt</span>
          </div>
        </div>

        {/* PANEL THÔNG BÁO */}
        {showNotificationPanel && (
          <>
            <div style={styles.notifOverlay} onClick={() => setShowNotificationPanel(false)}></div>
            <div style={styles.notifPanel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Thông báo</h3>
                <button onClick={() => setShowNotificationPanel(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>&times;</button>
              </div>
              
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  Chưa có thông báo mới
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {notifications.map((notif) => (
                    <li key={notif.id} onClick={() => handleMarkAsRead(notif)} style={{ padding: '15px', borderBottom: '1px solid #f0f0f0', background: notif.isRead ? 'white' : '#f0f9ff', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', position: 'relative' }}>
                      {!notif.isRead && <span style={{ position: 'absolute', top: '15px', right: '10px', width: '8px', height: '8px', background: '#007bff', borderRadius: '50%' }}></span>}
                      <div style={{ fontWeight: '600', color: '#333', marginBottom: '5px', fontSize: '14px', lineHeight: '1.4' }}>{notif.description}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                        <div>Mã GD: <span style={{ fontFamily: 'monospace', background: '#eee', padding: '2px 4px', borderRadius: '4px' }}>{notif.transactionReference}</span></div>
                        {notif.accountNumber && (<div style={{ marginTop: '2px' }}>TK: {notif.accountNumber}</div>)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#aaa' }}>{new Date(notif.transactionDate).toLocaleString('vi-VN')}</span>
                        <span style={{ fontWeight: 'bold', color: notif.amount.includes('-') ? '#dc3545' : '#28a745', fontSize: '13px' }}>
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

      {/* Đặt GlobalModal ở cuối cùng */}
      <GlobalModal 
          config={notification} 
          onClose={closeNotification} 
          styles={commonStyles} 
      />

    </div>
    

  );
};

export default Dashboard;