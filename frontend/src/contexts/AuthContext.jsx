import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';
import ApiClient from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const loadUser = async () => {
        try {
            const profile = await userAPI.getProfile();
            setUser(profile);
            setIsAuthenticated(true);
        } catch (error) {
            // Если это сетевая ошибка, не удаляем токен (может быть просто бэкенд не запущен)
            if (error.name === 'NetworkError') {
                console.warn('Backend недоступен:', error.message);
                // Оставляем состояние как есть, но помечаем как неавторизованного
                setUser(null);
                setIsAuthenticated(false);
            } else {
                // Токен невалиден или другая ошибка - удаляем токен
                const client = new ApiClient();
                client.setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        } finally {
            setLoading(false);
        }
    };

    // Проверка токена при загрузке приложения
    useEffect(() => {
        const client = new ApiClient();
        const token = client.getToken();
        if (token) {
            // Пытаемся загрузить профиль пользователя
            loadUser();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email, code) => {
        try {
            const response = await authAPI.verify(email, code);
            if (response.token) {
                // Загружаем профиль пользователя
                await loadUser();
                return { success: true };
            }
            return { success: false, error: 'Токен не получен' };
        } catch (error) {
            return { success: false, error: error.message || 'Ошибка входа' };
        }
    };

    const sendCode = async (email) => {
        try {
            await authAPI.login(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || 'Ошибка отправки кода' };
        }
    };

    const logout = () => {
        const client = new ApiClient();
        client.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const isAdmin = Boolean((user?.user_type || '').toLowerCase() === 'admin');

    const value = {
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        sendCode,
        logout,
        loadUser,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Используем именованную функцию для совместимости с Fast Refresh
function useAuthHook() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const useAuth = useAuthHook;

