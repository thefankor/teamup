const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';

export type UserRole = 'USER' | 'ADMIN' | string;

export interface TokenInfo {
    access_token: string;
    refresh_token: string;
}

export interface ContactInfo {
    phone?: string | null;
    email?: string | null;
    github_username?: string | null;
    vk_username?: string | null;
    tg_username?: string | null;
    whatsapp_username?: string | null;
}

export interface UserProfile {
    id: string;
    user_type: UserRole;
    first_name?: string | null;
    last_name?: string | null;
    middle_name?: string | null;
    avatar_url?: string | null;
    position?: string | null;
    about?: string | null;
    looking_for_projects?: boolean;
    tags?: string[];
    skills?: string[];
    contact_info?: ContactInfo;
    education?: unknown[];
    projects?: unknown[];
}

export interface GithubUserProfile {
    login: string;
    avatar_url: string;
    profile_url: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    api_url: string;
}

export interface GithubRepository {
    name: string;
    html_url: string;
    description?: string | null;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    created_at: string;
    updated_at: string;
}

export interface GithubRepositoriesResponse {
    user_login: string;
    items: GithubRepository[];
}

interface UserAvatarUploadResponse {
    upload_url: string;
    object_key: string;
}

type SessionExpiredReason =
    | 'missing_refresh_token'
    | 'refresh_failed'
    | 'unauthorized'
    | 'logout';

type AuthFailureHandler = (reason: SessionExpiredReason) => void;

interface RequestMeta {
    skipAuthRefresh?: boolean;
    skipAuthHeader?: boolean;
    hasRetried?: boolean;
}

type RequestOptions = RequestInit & { meta?: RequestMeta };

class ApiClient {
    private baseURL: string;
    private static authFailureHandler: AuthFailureHandler | null = null;
    private static refreshPromise: Promise<string | null> | null = null;

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    static setAuthFailureHandler(handler: AuthFailureHandler | null) {
        ApiClient.authFailureHandler = handler;
    }

    private static notifyAuthFailure(reason: SessionExpiredReason) {
        ApiClient.authFailureHandler?.(reason);
    }

    getToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    hasStoredSession(): boolean {
        return Boolean(this.getAccessToken() || this.getRefreshToken());
    }

    getAccessToken(): string | null {
        return this.getToken();
    }

    setToken(token: string | null) {
        // Backward-compatible alias: stores access token only.
        if (token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
    }

    setRefreshToken(token: string | null) {
        if (token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    }

    setTokens(tokens: Partial<TokenInfo> | null) {
        if (!tokens) {
            this.clearTokens();
            return;
        }

        if (tokens.access_token !== undefined) {
            this.setToken(tokens.access_token ?? null);
        }

        if (tokens.refresh_token !== undefined) {
            this.setRefreshToken(tokens.refresh_token ?? null);
        }
    }

    clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // Cleanup previous legacy key if it exists
        localStorage.removeItem('token');
    }

    private async parseResponse<T>(response: Response): Promise<T | null> {
        if (response.status === 204) {
            return null;
        }
        return (await response.json()) as T;
    }

    private createError(errorBody: unknown, status: number): Error & { status?: number } {
        const body = (errorBody ?? {}) as { detail?: unknown };
        const message =
            typeof body.detail === 'string'
                ? body.detail
                : ((body.detail as { message?: string } | undefined)?.message ??
                  JSON.stringify(body.detail ?? errorBody ?? { detail: 'Ошибка сервера' }) ??
                  `HTTP error! status: ${status}`);

        const err = new Error(message) as Error & { status?: number };
        err.status = status;
        return err;
    }

    private buildHeaders(options: RequestInit, skipAuthHeader = false): Headers {
        const headers = new Headers(options.headers || {});
        const token = this.getAccessToken();
        const isFormData = options.body instanceof FormData;

        if (!headers.has('Content-Type') && options.body && !isFormData) {
            headers.set('Content-Type', 'application/json');
        }

        if (!skipAuthHeader && token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { meta = {}, ...requestOptions } = options;
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
            ...requestOptions,
            headers: this.buildHeaders(requestOptions, meta.skipAuthHeader),
        };

        try {
            const response = await fetch(url, config);

            if (
                response.status === 401 &&
                !meta.skipAuthRefresh &&
                !meta.hasRetried &&
                endpoint !== '/auth/login' &&
                endpoint !== '/auth/verify' &&
                endpoint !== '/auth/refresh'
            ) {
                const refreshed = await this.refreshAccessToken();

                if (refreshed) {
                    return this.request<T>(endpoint, {
                        ...requestOptions,
                        meta: { ...meta, hasRetried: true },
                    });
                }

                ApiClient.notifyAuthFailure('unauthorized');
            }

            if (!response.ok) {
                const errorBody = await response
                    .json()
                    .catch(() => ({ detail: 'Ошибка сервера' }));
                throw this.createError(errorBody, response.status);
            }

            return (await this.parseResponse<T>(response)) as T;
        } catch (error) {
            if (
                error instanceof TypeError &&
                error.message.toLowerCase().includes('fetch')
            ) {
                const networkError = new Error(
                    'Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на http://localhost:8000',
                ) as Error & { name: string };
                networkError.name = 'NetworkError';
                console.error('Network error:', networkError);
                throw networkError;
            }

            console.error('API request failed:', error);
            throw error;
        }
    }

    private async refreshAccessToken(): Promise<string | null> {
        if (ApiClient.refreshPromise) {
            return ApiClient.refreshPromise;
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearTokens();
            ApiClient.notifyAuthFailure('missing_refresh_token');
            return null;
        }

        ApiClient.refreshPromise = (async () => {
            try {
                const response = await this.request<TokenInfo>('/auth/refresh', {
                    method: 'POST',
                    body: JSON.stringify({ refresh_token: refreshToken }),
                    meta: {
                        skipAuthRefresh: true,
                    },
                });

                this.setTokens(response);
                return response.access_token;
            } catch (error) {
                this.clearTokens();
                ApiClient.notifyAuthFailure('refresh_failed');
                return null;
            } finally {
                ApiClient.refreshPromise = null;
            }
        })();

        return ApiClient.refreshPromise;
    }

    async get<T = unknown>(endpoint: string, options: RequestOptions = {}) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T = unknown>(
        endpoint: string,
        data?: unknown,
        options: RequestOptions = {},
    ) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
        });
    }

    async patch<T = unknown>(
        endpoint: string,
        data?: unknown,
        options: RequestOptions = {},
    ) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
        });
    }

    async put<T = unknown>(
        endpoint: string,
        data?: unknown,
        options: RequestOptions = {},
    ) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
        });
    }

    async delete<T = unknown>(endpoint: string, options: RequestOptions = {}) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    async logout() {
        try {
            if (this.getAccessToken()) {
                await this.post('/auth/logout', undefined, {
                    meta: { skipAuthRefresh: true },
                });
            }
        } catch (error) {
            // Даже при ошибке logout очищаем локальную сессию.
            console.warn('Logout request failed:', error);
        } finally {
            this.clearTokens();
            ApiClient.notifyAuthFailure('logout');
        }
    }
}

const buildQuery = (params: Record<string, unknown> = {}) => {
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    );

    return new URLSearchParams(
        Object.entries(cleanParams).map(([key, value]) => [key, String(value)]),
    ).toString();
};

interface CachedEntry {
    value: unknown;
    expiresAt: number;
}

const GET_CACHE_TTL_MS = 20_000;
const getCache = new Map<string, CachedEntry>();
const inFlightGetRequests = new Map<string, Promise<unknown>>();

const makeGetKey = (endpoint: string, token: string | null) =>
    `${token || 'anonymous'}::${endpoint}`;

const cachedGetRequest = async <T>(endpoint: string, ttlMs = GET_CACHE_TTL_MS): Promise<T> => {
    const client = new ApiClient();
    const cacheKey = makeGetKey(endpoint, client.getAccessToken());
    const now = Date.now();
    const cached = getCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
        return cached.value as T;
    }

    const pending = inFlightGetRequests.get(cacheKey);
    if (pending) {
        return pending as Promise<T>;
    }

    const requestPromise = client.get<T>(endpoint).then((data) => {
        getCache.set(cacheKey, {
            value: data,
            expiresAt: now + ttlMs,
        });
        return data;
    }).finally(() => {
        inFlightGetRequests.delete(cacheKey);
    });

    inFlightGetRequests.set(cacheKey, requestPromise);
    return requestPromise;
};

const clearProjectsCache = () => {
    for (const key of getCache.keys()) {
        if (key.includes('::/projects')) {
            getCache.delete(key);
        }
    }
};

export const authAPI = {
    login: async (email: string) => {
        const client = new ApiClient();
        return client.post<Record<string, never>>('/auth/login', { email });
    },

    verify: async (email: string, code: string) => {
        const client = new ApiClient();
        const response = await client.post<TokenInfo>('/auth/verify', { email, code });
        client.setTokens(response);
        return response;
    },

    logout: async () => {
        const client = new ApiClient();
        await client.logout();
    },
};

export const userAPI = {
    getProfile: async () => {
        const client = new ApiClient();
        return client.get<UserProfile>('/user');
    },

    getProfileById: async (userId: string) => {
        const client = new ApiClient();
        return client.get<UserProfile>(`/user/${userId}`);
    },

    setUserType: async (userId: string, userType: UserRole) => {
        const client = new ApiClient();
        return client.put<UserProfile>(`/user/${userId}/user_type`, { user_type: userType });
    },

    updateProfile: async (data: unknown) => {
        const client = new ApiClient();
        return client.patch<UserProfile>('/user', data);
    },

    updateContacts: async (data: unknown) => {
        const client = new ApiClient();
        return client.patch<UserProfile>('/user/contacts', data);
    },

    updateSkills: async (skills: string[]) => {
        const client = new ApiClient();
        return client.put<UserProfile>('/user/skills', { skills });
    },

    updateTags: async (tags: string[]) => {
        const client = new ApiClient();
        return client.put<UserProfile>('/user/tags', { tags });
    },

    addEducation: async (data: unknown) => {
        const client = new ApiClient();
        return client.post<UserProfile>('/user/education', data);
    },

    updateEducation: async (eduId: string, data: unknown) => {
        const client = new ApiClient();
        return client.patch<UserProfile>(`/user/education/${eduId}`, data);
    },

    deleteEducation: async (eduId: string) => {
        const client = new ApiClient();
        return client.delete<UserProfile>(`/user/education/${eduId}`);
    },

    getAvatarUploadUrl: async (contentType: string) => {
        const client = new ApiClient();
        const query = new URLSearchParams({ content_type: contentType }).toString();
        return client.post<UserAvatarUploadResponse>(`/user/avatar/upload-url?${query}`);
    },

    confirmAvatarUpload: async (objectKey: string) => {
        const client = new ApiClient();
        const query = new URLSearchParams({ object_key: objectKey }).toString();
        return client.put<UserProfile>(`/user/avatar/confirm?${query}`);
    },

    deleteAvatar: async () => {
        const client = new ApiClient();
        return client.delete<void>('/user/avatar');
    },

    uploadAvatar: async (file: File) => {
        const normalizedType = file.type || 'application/octet-stream';
        const { upload_url, object_key } = await userAPI.getAvatarUploadUrl(normalizedType);

        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': normalizedType,
            },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error('Не удалось загрузить файл в хранилище');
        }

        return userAPI.confirmAvatarUpload(object_key);
    },
};

export const projectsAPI = {
    list: async (params: Record<string, unknown> = {}) => {
        const queryParams = buildQuery(params);
        return cachedGetRequest(`/projects${queryParams ? `?${queryParams}` : ''}`);
    },

    get: async (projectId: string) => {
        return cachedGetRequest(`/projects/${projectId}`);
    },

    create: async (data: unknown) => {
        const client = new ApiClient();
        const result = await client.post('/projects', data);
        clearProjectsCache();
        return result;
    },

    update: async (projectId: string, data: unknown) => {
        const client = new ApiClient();
        const result = await client.patch(`/projects/${projectId}`, data);
        clearProjectsCache();
        return result;
    },

    delete: async (projectId: string) => {
        const client = new ApiClient();
        const result = await client.delete(`/projects/${projectId}`);
        clearProjectsCache();
        return result;
    },

    myProjects: async (params: Record<string, unknown> = {}) => {
        const client = new ApiClient();
        const queryParams = buildQuery(params);
        return client.get(`/projects/me/list${queryParams ? `?${queryParams}` : ''}`);
    },

    participatingProjects: async (params: Record<string, unknown> = {}) => {
        const client = new ApiClient();
        const queryParams = buildQuery(params);
        return client.get(`/projects/me/participating${queryParams ? `?${queryParams}` : ''}`);
    },

    setStatus: async (projectId: string, status: string) => {
        const client = new ApiClient();
        const result = await client.put(`/projects/${projectId}/status/${status}`);
        clearProjectsCache();
        return result;
    },

    submitApplication: async (projectId: string, data: unknown) => {
        const client = new ApiClient();
        const result = await client.post(`/projects/${projectId}/applications`, data);
        clearProjectsCache();
        return result;
    },

    withdrawApplication: async (projectId: string, applicationId: string) => {
        const client = new ApiClient();
        const result = await client.post(`/projects/${projectId}/applications/${applicationId}/withdraw`);
        clearProjectsCache();
        return result;
    },

    listApplications: async (projectId: string, params: Record<string, unknown> = {}) => {
        const client = new ApiClient();
        const queryParams = buildQuery(params);
        return client.get(
            `/projects/${projectId}/applications${queryParams ? `?${queryParams}` : ''}`,
        );
    },

    decideApplication: async (projectId: string, applicationId: string, data: unknown) => {
        const client = new ApiClient();
        const result = await client.post(`/projects/${projectId}/applications/${applicationId}/decision`, data);
        clearProjectsCache();
        return result;
    },
};

export const githubAPI = {
    getUserProfile: async (username: string) => {
        const client = new ApiClient();
        return client.get<GithubUserProfile>(`/github/users/${encodeURIComponent(username)}`);
    },

    getTopRepos: async (username: string, limit = 3) => {
        const client = new ApiClient();
        const query = new URLSearchParams({ limit: String(limit) }).toString();
        return client.get<GithubRepositoriesResponse>(
            `/github/users/${encodeURIComponent(username)}/top-repos?${query}`,
        );
    },
};

export default ApiClient;
