import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://banking.duchuysaidepchieu.id.vn', 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');

    const isPublicUrl = 
        config.url.includes('/auth/signin') || 
        config.url.includes('/auth/login') ||  
        config.url.includes('/auth/signup') || 
        config.url.includes('/auth/register');

    if (token && !isPublicUrl) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config } = error;

    if (response) {
      if (response.status === 401) {
        
        const isLoginRequest = config.url && config.url.includes('/auth/signin');

        if (!isLoginRequest) {
            console.warn("Phiên đăng nhập hết hạn. Đang đăng xuất...");

            localStorage.clear(); 
            window.location.href = '/';
            
            return Promise.reject(error);
        }
      }

      if (response.status === 403) {
        console.error("Bạn không có quyền thực hiện chức năng này!");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;