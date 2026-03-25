import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/api', async () => {
    const actual = await vi.importActual('../services/api');
    class MockApiClient {
        static handler = null;

        static setAuthFailureHandler(handler) {
            MockApiClient.handler = handler;
        }

        hasStoredSession() {
            return false;
        }

        clearTokens() {}
    }

    return {
        ...actual,
        __esModule: true,
        default: MockApiClient,
        authAPI: {
            verify: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
        },
        userAPI: {
            getProfile: vi.fn(),
        },
    };
});

const apiModule = await import('../services/api');

function Consumer() {
    const auth = useAuth();

    return (
        <div>
            <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
            <span data-testid="admin">{String(auth.isAdmin)}</span>
            <span data-testid="loading">{String(auth.loading)}</span>
            <button type="button" onClick={() => auth.updateUser({ user_type: 'ADMIN' })}>
                set-admin
            </button>
            <button type="button" onClick={() => auth.updateUser(null)}>
                clear-user
            </button>
        </div>
    );
}

describe('AuthProvider', () => {
    it('updates derived auth state when user is set or cleared', async () => {
        render(
            <AuthProvider>
                <Consumer />
            </AuthProvider>,
        );

        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('admin')).toHaveTextContent('false');

        await userEvent.click(screen.getByRole('button', { name: 'set-admin' }));
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('admin')).toHaveTextContent('true');

        await userEvent.click(screen.getByRole('button', { name: 'clear-user' }));
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('admin')).toHaveTextContent('false');
    });

    it('resets auth state when auth failure handler is triggered', async () => {
        render(
            <AuthProvider>
                <Consumer />
            </AuthProvider>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'set-admin' }));
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

        apiModule.default.handler('unauthorized');

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });
    });
});
