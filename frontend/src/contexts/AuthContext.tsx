import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import ApiClient, { authAPI, type UserProfile, type UserRole, userAPI } from '../services/api';

type AuthActionResult = { success: true } | { success: false; error: string };

interface AuthContextValue {
    user: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, code: string) => Promise<AuthActionResult>;
    sendCode: (email: string) => Promise<AuthActionResult>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
    updateUser: (userData: UserProfile | null) => void;
    hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeRole = (role: string | null | undefined) => (role || '').toUpperCase();

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const resetAuthState = () => {
        setUser(null);
        setIsAuthenticated(false);
    };

    const loadUser = async () => {
        try {
            const profile = await userAPI.getProfile();
            setUser(profile);
            setIsAuthenticated(true);
        } catch (error) {
            const err = error as Error & { name?: string };

            if (err.name === 'NetworkError') {
                console.warn('Backend недоступен:', err.message);
                resetAuthState();
            } else {
                const client = new ApiClient();
                client.clearTokens();
                resetAuthState();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ApiClient.setAuthFailureHandler(() => {
            resetAuthState();
            setLoading(false);
        });

        return () => {
            ApiClient.setAuthFailureHandler(null);
        };
    }, []);

    useEffect(() => {
        const client = new ApiClient();

        if (client.hasStoredSession()) {
            void loadUser();
            return;
        }

        setLoading(false);
    }, []);

    const login = async (email: string, code: string): Promise<AuthActionResult> => {
        setLoading(true);
        try {
            const response = await authAPI.verify(email, code);
            if (!response.access_token || !response.refresh_token) {
                return { success: false, error: 'Токены не получены' };
            }

            await loadUser();
            return { success: true };
        } catch (error) {
            setLoading(false);
            return {
                success: false,
                error: (error as Error)?.message || 'Ошибка входа',
            };
        }
    };

    const sendCode = async (email: string): Promise<AuthActionResult> => {
        try {
            await authAPI.login(email);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: (error as Error)?.message || 'Ошибка отправки кода',
            };
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authAPI.logout();
        } finally {
            resetAuthState();
            setLoading(false);
        }
    };

    const updateUser = (userData: UserProfile | null) => {
        setUser(userData);
        setIsAuthenticated(Boolean(userData));
    };

    const hasRole = (roles: UserRole | UserRole[]) => {
        if (!isAuthenticated || !user?.user_type) {
            return false;
        }

        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        const currentRole = normalizeRole(user.user_type);
        return requiredRoles.some((role) => normalizeRole(role) === currentRole);
    };

    const isAdmin = hasRole('ADMIN');

    const value: AuthContextValue = {
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        sendCode,
        logout,
        loadUser,
        updateUser,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthHook() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const useAuth = useAuthHook;
