import React from 'react';

const GlobalModal = ({ config, onClose, styles }) => {
    if (!config || !config.isOpen) return null;

    const isError = config.type === 'error';
    const isSuccess = config.type === 'success'; 

    let contentStyle = styles.modalContent; 
    if (isError) contentStyle = styles.modalContentError || styles.modalContent;
    if (isSuccess) contentStyle = styles.modalContentSuccess || styles.modalContent;

    let themeColor = '#007bff'; 
    let icon = '🛠️';

    if (isError) {
        themeColor = '#dc3545'; 
        icon = '⚠️';
    } else if (isSuccess) {
        themeColor = '#28a745'; 
        icon = '✅';
    }

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={contentStyle} onClick={e => e.stopPropagation()}>
                
                {/* Icon */}
                <span style={{...styles.modalIcon, color: themeColor}}>{icon}</span>

                {/* Title */}
                <h3 style={{...styles.modalTitle, color: themeColor}}>{config.title}</h3>

                {/* Message */}
                <p style={styles.modalText}>{config.message}</p>

                {/* Button */}
                <button 
                    style={{
                        ...styles.modalButton, 
                        backgroundColor: themeColor,
                        boxShadow: `0 4px 15px ${themeColor}66` // Tạo bóng mờ theo màu nút
                    }} 
                    onClick={onClose}
                >
                    {isSuccess ? 'Tiếp tục ➜' : 'Đóng lại'}
                </button>
            </div>
        </div>
    );
};

export default GlobalModal;