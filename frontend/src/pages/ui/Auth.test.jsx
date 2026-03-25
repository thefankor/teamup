import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Auth from './Auth';

vi.mock('../../../components/header/Header', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('../../components/seo/SeoMeta', () => ({
    SeoMeta: () => null,
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const { useAuth } = await import('../../contexts/AuthContext');

function renderAuth(route = '/login') {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Routes>
                <Route path="/login" element={<Auth />} />
                <Route path="/" element={<div>Home page</div>} />
                <Route path="/profile" element={<div>Profile page</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Auth page', () => {
    it('validates email before sending code', async () => {
        useAuth.mockReturnValue({
            sendCode: vi.fn(),
            login: vi.fn(),
            isAuthenticated: false,
        });

        renderAuth();
        fireEvent.submit(screen.getByRole('button', { name: 'Продолжить' }).closest('form'));

        expect(screen.getByText('Введите email')).toBeInTheDocument();
    });

    it('switches to code step after successful email submission', async () => {
        useAuth.mockReturnValue({
            sendCode: vi.fn().mockResolvedValue({ success: true }),
            login: vi.fn(),
            isAuthenticated: false,
        });

        renderAuth();

        await userEvent.type(screen.getByPlaceholderText('ivan@gmail.com'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

        expect(await screen.findByText('Введите код из почты')).toBeInTheDocument();
        expect(screen.getByText('На адрес user@example.com отправлен код подтверждения')).toBeInTheDocument();
    });

    it('shows validation error for short code', async () => {
        useAuth.mockReturnValue({
            sendCode: vi.fn().mockResolvedValue({ success: true }),
            login: vi.fn(),
            isAuthenticated: false,
        });

        renderAuth();

        await userEvent.type(screen.getByPlaceholderText('ivan@gmail.com'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
        await screen.findByText('Введите код из почты');

        await userEvent.type(screen.getByPlaceholderText('12345'), '12');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

        expect(screen.getByText('Код должен содержать 5 цифр')).toBeInTheDocument();
    });

    it('redirects to preserved route after successful login', async () => {
        useAuth.mockReturnValue({
            sendCode: vi.fn().mockResolvedValue({ success: true }),
            login: vi.fn().mockResolvedValue({ success: true }),
            isAuthenticated: false,
        });

        render(
            <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/profile' } }]}>
                <Routes>
                    <Route path="/login" element={<Auth />} />
                    <Route path="/profile" element={<div>Profile page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        await userEvent.type(screen.getByPlaceholderText('ivan@gmail.com'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
        await screen.findByText('Введите код из почты');

        await userEvent.type(screen.getByPlaceholderText('12345'), '12345');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

        await waitFor(() => {
            expect(screen.getByText('Profile page')).toBeInTheDocument();
        });
    });

    it('shows server error returned from login', async () => {
        useAuth.mockReturnValue({
            sendCode: vi.fn().mockResolvedValue({ success: true }),
            login: vi.fn().mockResolvedValue({ success: false, error: 'Неверный код' }),
            isAuthenticated: false,
        });

        renderAuth();

        await userEvent.type(screen.getByPlaceholderText('ivan@gmail.com'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
        await screen.findByText('Введите код из почты');

        await userEvent.type(screen.getByPlaceholderText('12345'), '12345');
        await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

        expect(await screen.findByText('Неверный код')).toBeInTheDocument();
    });
});
