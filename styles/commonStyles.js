export const commonStyles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền tối mờ
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000, // Đảm bảo nổi lên trên cùng
        backdropFilter: 'blur(3px)' // Làm mờ background phía sau (hiệu ứng kính)
    },
    modalContent: {
        width: '85%',
        maxWidth: '320px',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '25px 20px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.2s ease-out' // Cần định nghĩa keyframes trong CSS global nếu muốn mượt hơn
    },
    modalIcon: {
        fontSize: '40px',
        marginBottom: '15px',
        display: 'block'
    },

    modalTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '10px',
        margin: 0
    },

    modalText: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '25px',
        lineHeight: '1.5'
    },

    modalButton: {
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        padding: '12px 0',
        width: '100%',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },

    modalOverlayError: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Tăng độ tối lên 0.6 để nổi bật lỗi hơn
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)' // Tăng độ mờ kính
    },

    modalContentError: {
        width: '85%',
        maxWidth: '320px',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '25px 20px',
        textAlign: 'center',
        boxShadow: '0 15px 40px rgba(220, 53, 69, 0.15)', // Đổ bóng màu đỏ nhạt tạo cảm giác cảnh báo
        borderTop: '5px solid #dc3545', // [QUAN TRỌNG] Viền đỏ trên cùng để nhận diện lỗi ngay
        animation: 'fadeIn 0.2s ease-out'
    },

    modalIconError: {
        fontSize: '45px', // To hơn một chút
        marginBottom: '15px',
        display: 'block',
        color: '#dc3545', // [QUAN TRỌNG] Đổi icon sang màu đỏ
        textShadow: '0 4px 10px rgba(220, 53, 69, 0.3)' // Hiệu ứng phát sáng nhẹ
    },

    modalTitleError: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#dc3545', // [QUAN TRỌNG] Tiêu đề màu đỏ
        marginBottom: '10px',
        margin: 0
    },

    modalTextError: {
        fontSize: '15px',
        color: '#555', // Màu chữ đậm hơn chút cho dễ đọc
        marginBottom: '25px',
        lineHeight: '1.5'
    },

    modalButtonError: {
        backgroundColor: '#dc3545', // [QUAN TRỌNG] Nút màu đỏ
        color: 'white',
        border: 'none',
        padding: '12px 0',
        width: '100%',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s', 
        boxShadow: '0 4px 15px rgba(220, 53, 69, 0.4)' 
    },

    modalContentSuccess: {
        width: '85%', maxWidth: '320px', backgroundColor: 'white',
        borderRadius: '20px', padding: '25px 20px', textAlign: 'center',
        boxShadow: '0 15px 40px rgba(40, 167, 69, 0.2)', // Bóng xanh lá
        borderTop: '5px solid #28a745', // Viền trên xanh lá
        animation: 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)' // Hiệu ứng nảy
    }
}