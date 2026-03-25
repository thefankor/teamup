import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute, RoleGuard } from './ProtectedRoute';

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const { useAuth } = await import('../contexts/AuthContext');

describe('ProtectedRoute', () => {
    it('shows loader while auth is loading', () => {
        useAuth.mockReturnValue({
            loading: true,
            isAuthenticated: false,
            hasRole: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <ProtectedRoute>
                    <div>Private content</div>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('redirects anonymous user to login', () => {
        useAuth.mockReturnValue({
            loading: false,
            isAuthenticated: false,
            hasRole: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={['/profile?tab=main']}>
                <Routes>
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <div>Private content</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<div>Login page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('renders forbidden fallback when role is missing', () => {
        useAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            hasRole: () => false,
        });

        render(
            <MemoryRouter>
                <ProtectedRoute roles={['ADMIN']}>
                    <div>Admin panel</div>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.getByText('У вас нет доступа к этой странице.')).toBeInTheDocument();
    });

    it('renders content when required role is present', () => {
        useAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            hasRole: () => true,
        });

        render(
            <MemoryRouter>
                <ProtectedRoute roles={['ADMIN']}>
                    <div>Admin panel</div>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.getByText('Admin panel')).toBeInTheDocument();
    });

    it('RoleGuard hides content when user is not allowed', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            hasRole: () => false,
        });

        render(
            <MemoryRouter>
                <RoleGuard roles={['ADMIN']} fallback={<div>No access</div>}>
                    <div>Secret</div>
                </RoleGuard>
            </MemoryRouter>,
        );

        expect(screen.getByText('No access')).toBeInTheDocument();
        expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    });
});
