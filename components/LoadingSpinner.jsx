import React from 'react'

  // --- CSS Animation Keyframes (Nhúng trực tiếp) ---
  const loadingCSS = `
    /* Hiệu ứng xoay */
    @keyframes spin-ring {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    /* Hiệu ứng xoay ngược */
    @keyframes spin-ring-rev {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }
    /* Hiệu ứng nhịp đập cho icon giữa */
    @keyframes pulse-center {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      50% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
    }
    /* Hiệu ứng chữ nhấp nháy */
    @keyframes pulseText {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    /* Vòng tròn cơ bản */
    .bank-spinner-ring {
        position: absolute;
        border-radius: 50%;
        border: 4px solid transparent;
    }
    /* Vòng 1: Lớn nhất, màu xanh sáng */
    .ring-1 {
        top: 0; left: 0; width: 100%; height: 100%;
        border-top-color: #00d2ff;
        border-left-color: rgba(0, 210, 255, 0.3);
        animation: spin-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    /* Vòng 2: Nhỡ, màu xanh đậm, xoay ngược */
    .ring-2 {
        top: 15%; left: 15%; width: 70%; height: 70%;
        border-bottom-color: #3a7bd5;
        border-right-color: rgba(58, 123, 213, 0.3);
        animation: spin-ring-rev 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    /* Biểu tượng khiên bảo mật ở giữa */
    .center-shield {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        color: #fff;
        filter: drop-shadow(0 0 10px #00d2ff);
        animation: pulse-center 2s ease-in-out infinite;
    }
  `;

const styles = {    
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 20, 40, 0.85)',
      backdropFilter: 'blur(8px)', 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999, 
      color: '#fff',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    spinnerBox: {
        position: 'relative',
        width: '100px',
        height: '100px',
        marginBottom: '25px',
    },
    text: {
      fontSize: '18px',
      fontWeight: '600',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animation: 'pulseText 2s infinite'
    }
}

const LoadingSpinner = ({ text = "Đang xử lý..." }) => {
    return (
        <div style={styles.overlay}>
            {/* Inject CSS */}
            <style>{loadingCSS}</style>

            <div style={styles.spinnerBox}>
                <div className="bank-spinner-ring ring-1"></div>
                <div className="bank-spinner-ring ring-2"></div>
                <div className="center-shield">🛡️</div>
            </div>

            <div style={styles.text}>{text}</div>
        </div>
    );
};

export default LoadingSpinner;
