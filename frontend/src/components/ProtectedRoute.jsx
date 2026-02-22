import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

/** Маршрут только для администраторов. Иначе — сообщение «Нет доступа». */
export function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '24px',
            }}>
                <p style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    color: '#6b7280',
                    margin: 0,
                }}>
                    У вас нет доступа к этой странице.
                </p>
            </div>
        );
    }

    return children;
}

