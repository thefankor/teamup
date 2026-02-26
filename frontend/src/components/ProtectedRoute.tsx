import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../services/api';

interface ProtectedRouteProps {
    children: ReactNode;
    roles?: UserRole[];
    fallback?: ReactNode;
}

interface RoleGuardProps {
    children: ReactNode;
    roles: UserRole[];
    fallback?: ReactNode;
}

const CenteredLoader = () => <div>Загрузка...</div>;

export function ProtectedRoute({
    children,
    roles,
    fallback,
}: ProtectedRouteProps) {
    const location = useLocation();
    const { isAuthenticated, loading, hasRole } = useAuth();

    if (loading) {
        return <CenteredLoader />;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: `${location.pathname}${location.search}` }}
            />
        );
    }

    if (roles?.length && !hasRole(roles)) {
        return (
            <>
                {fallback ?? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '50vh',
                            padding: '24px',
                        }}
                    >
                        <p
                            style={{
                                textAlign: 'center',
                                fontSize: '18px',
                                color: '#6b7280',
                                margin: 0,
                            }}
                        >
                            У вас нет доступа к этой странице.
                        </p>
                    </div>
                )}
            </>
        );
    }

    return <>{children}</>;
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
    const { isAuthenticated, hasRole } = useAuth();

    if (!isAuthenticated || !hasRole(roles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
    return <ProtectedRoute roles={['ADMIN']}>{children}</ProtectedRoute>;
}
