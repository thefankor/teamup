import { beforeEach, describe, expect, it, vi } from 'vitest';
import ApiClient from './api';

describe('ApiClient', () => {
    beforeEach(() => {
        localStorage.clear();
        ApiClient.setAuthFailureHandler(null);
    });

    it('adds authorization header when access token exists', async () => {
        localStorage.setItem('auth.access_token', 'token-123');
        fetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new ApiClient();
        await client.get('/user');

        const [, options] = fetch.mock.calls[0];
        expect(options.headers.get('Authorization')).toBe('Bearer token-123');
    });

    it('refreshes token after 401 and retries original request', async () => {
        localStorage.setItem('auth.access_token', 'expired-token');
        localStorage.setItem('auth.refresh_token', 'refresh-token');

        fetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ detail: 'expired' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }),
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        access_token: 'new-access',
                        refresh_token: 'new-refresh',
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    },
                ),
            )
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ id: 'user-1' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

        const client = new ApiClient();
        const result = await client.get('/user');

        expect(result).toEqual({ id: 'user-1' });
        expect(localStorage.getItem('auth.access_token')).toBe('new-access');
        expect(localStorage.getItem('auth.refresh_token')).toBe('new-refresh');
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('clears session and notifies when 401 happens without refresh token', async () => {
        localStorage.setItem('auth.access_token', 'expired-token');
        const handler = vi.fn();
        ApiClient.setAuthFailureHandler(handler);

        fetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ detail: 'expired' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new ApiClient();

        await expect(client.get('/user')).rejects.toThrow();
        expect(localStorage.getItem('auth.access_token')).toBeNull();
        expect(handler).toHaveBeenCalledWith('missing_refresh_token');
        expect(handler).toHaveBeenCalledWith('unauthorized');
    });

    it('maps fetch failure to NetworkError', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        const client = new ApiClient();

        await expect(client.get('/user')).rejects.toMatchObject({
            name: 'NetworkError',
            message: expect.stringContaining('Не удалось подключиться к серверу'),
        });
    });

    it('logout clears tokens and notifies auth failure handler', async () => {
        localStorage.setItem('auth.access_token', 'token');
        localStorage.setItem('auth.refresh_token', 'refresh');
        const handler = vi.fn();
        ApiClient.setAuthFailureHandler(handler);

        fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

        const client = new ApiClient();
        await client.logout();

        expect(localStorage.getItem('auth.access_token')).toBeNull();
        expect(localStorage.getItem('auth.refresh_token')).toBeNull();
        expect(handler).toHaveBeenCalledWith('logout');
    });
});
