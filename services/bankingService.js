import axiosClient from '../api/axiosClient';

export const bankingService = {
  // 1.1 Đăng nhập
  login: (username, password) => {
    console.log("Đã đăng nhập được chưa")
    return axiosClient.post('/api/v1/auth/signin', { username, password });
  },
  
  // 1.2 Đăng ký (Cập nhật theo SignupRequest)
  register: (username, email, password) => {
    return axiosClient.post('/api/v1/auth/signup', {
      username,
      email,
      password,
      role: ["user"] // Backend nhận Set<String>, gửi mảng là ok
    });
  },

  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
  },

  // 2. Tài khoản
  createAccount: (data) => {
    return axiosClient.post('/api/v1/account', data);
  },

  // Lấy thông tin tài khoản (Dùng để check xem đã có TK chưa)
  getAccountInfo: (userId) => {
    return axiosClient.get(`/api/v1/account/${userId}`);
  },

  // 3. Giao dịch [cite: 34]
  createTransaction: (userId, data) => {
    // [cite: 39, 40]
    return axiosClient.post(`/api/v1/transaction/${userId}`, data);
  },

  getTransactionHistory: (userId, accountNumber) => {
    // [cite: 54]
    return axiosClient.get(`/api/v1/transaction/${userId}/reference/account/${accountNumber}`);
  },

  // 4. Thông báo [cite: 57]
  getNotifications: (userId) => {
    // [cite: 59]
    return axiosClient.get(`/api/v1/notification/${userId}`);
  },

  // @GetMapping("{userId}/destination-account/name/{accountNumber}")
  checkDestinationAccount: (userId, destinationAccountNumber) => {
    return axiosClient.get(`/api/v1/transaction/${userId}/destination-account/name/${destinationAccountNumber}`);
  },

  // @PutMapping("/mark-read/{id}")
  // Giả định đường dẫn đầy đủ là /api/v1/notification/mark-read/{id}
  markNotificationAsRead: (id) => {
    return axiosClient.put(`/api/v1/notification/mark-read/${id}`);
  },

  // Hàm cập nhật thông tin tài khoản
  updateAccount: (userId, data) => {
      // data là object chứa: userId, accountName, accountType, currency, initialDeposit
      return axiosClient.put(`/api/v1/account/${userId}`, data); 
  },

  logout: () => {
      // 1. Xóa client session
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      
      // 2. (Tùy chọn) Gọi API Backend nếu Backend có hỗ trợ Blacklist Token
      // return axiosClient.post('/api/v1/auth/signout'); 
      
      // Hiện tại chỉ cần xử lý phía Client là đủ để chặn người dùng truy cập lại
    },
};