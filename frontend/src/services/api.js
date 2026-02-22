const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }

            // Если ответ пустой (204 No Content), возвращаем null
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            // Обработка сетевых ошибок
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError = new Error('Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на http://localhost:8000');
                networkError.name = 'NetworkError';
                console.error('Network error:', networkError);
                throw networkError;
            }

            // Обработка других ошибок
            console.error('API request failed:', error);
            throw error;
        }
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Auth API
export const authAPI = {
    login: async (email) => {
        const client = new ApiClient();
        return client.post('/auth/login', { email });
    },

    verify: async (email, code) => {
        const client = new ApiClient();
        const response = await client.post('/auth/verify', { email, code });
        if (response.token) {
            client.setToken(response.token);
        }
        return response;
    },
};

// User API
export const userAPI = {
    getProfile: async () => {
        const client = new ApiClient();
        return client.get('/user');
    },

    updateProfile: async (data) => {
        const client = new ApiClient();
        return client.patch('/user', data);
    },

    updateContacts: async (data) => {
        const client = new ApiClient();
        return client.patch('/user/contacts', data);
    },

    updateSkills: async (skills) => {
        const client = new ApiClient();
        return client.put('/user/skills', { skills });
    },

    updateTags: async (tags) => {
        const client = new ApiClient();
        return client.put('/user/tags', { tags });
    },

    addEducation: async (data) => {
        const client = new ApiClient();
        return client.post('/user/education', data);
    },

    updateEducation: async (eduId, data) => {
        const client = new ApiClient();
        return client.patch(`/user/education/${eduId}`, data);
    },

    deleteEducation: async (eduId) => {
        const client = new ApiClient();
        return client.delete(`/user/education/${eduId}`);
    },
};

// Projects API
export const projectsAPI = {
    list: async (params = {}) => {
        const client = new ApiClient();
        // Фильтруем undefined и null значения
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
        );
        const queryParams = new URLSearchParams(cleanParams).toString();
        return client.get(`/projects${queryParams ? `?${queryParams}` : ''}`);
    },

    get: async (projectId) => {
        const client = new ApiClient();
        return client.get(`/projects/${projectId}`);
    },

    create: async (data) => {
        const client = new ApiClient();
        return client.post('/projects', data);
    },

    update: async (projectId, data) => {
        const client = new ApiClient();
        return client.patch(`/projects/${projectId}`, data);
    },

    delete: async (projectId) => {
        const client = new ApiClient();
        return client.delete(`/projects/${projectId}`);
    },

    myProjects: async (params = {}) => {
        const client = new ApiClient();
        // Фильтруем undefined и null значения
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
        );
        const queryParams = new URLSearchParams(cleanParams).toString();
        return client.get(`/projects/me/list${queryParams ? `?${queryParams}` : ''}`);
    },

    participatingProjects: async (params = {}) => {
        const client = new ApiClient();
        // Фильтруем undefined и null значения
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
        );
        const queryParams = new URLSearchParams(cleanParams).toString();
        return client.get(`/projects/me/participating${queryParams ? `?${queryParams}` : ''}`);
    },

    setStatus: async (projectId, status) => {
        const client = new ApiClient();
        return client.put(`/projects/${projectId}/status/${status}`);
    },

    // Applications API
    submitApplication: async (projectId, data) => {
        const client = new ApiClient();
        return client.post(`/projects/${projectId}/applications`, data);
    },

    withdrawApplication: async (projectId, applicationId) => {
        const client = new ApiClient();
        return client.post(`/projects/${projectId}/applications/${applicationId}/withdraw`);
    },

    listApplications: async (projectId, params = {}) => {
        const client = new ApiClient();
        // Фильтруем undefined и null значения
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
        );
        const queryParams = new URLSearchParams(cleanParams).toString();
        return client.get(`/projects/${projectId}/applications${queryParams ? `?${queryParams}` : ''}`);
    },

    decideApplication: async (projectId, applicationId, data) => {
        const client = new ApiClient();
        return client.post(`/projects/${projectId}/applications/${applicationId}/decision`, data);
    },
};

export default ApiClient;

