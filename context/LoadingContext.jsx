import React, { createContext, useState, useContext } from 'react';
import LoadingSpinner from '../components/LoadingSpinner'; // Import component Spinner bạn đã tách

// 1. Tạo Context
const LoadingContext = createContext();

// 2. Tạo Provider
export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Đang xử lý...');

    // Hàm bật loading
    const showLoading = (text = 'Đang xử lý...') => {
        setLoadingText(text);
        setIsLoading(true);
    };

    // Hàm tắt loading
    const hideLoading = () => {
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
            {children}
            
            {isLoading && <LoadingSpinner text={loadingText} />}
        </LoadingContext.Provider>
    );
};

// 3. Tạo Hook 
export const useGlobalLoading = () => {
    return useContext(LoadingContext);
};