import axios from 'axios';
import { API_BASE_URL, IS_SUPABASE_MODE } from './config';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function assertLegacyApiMode(url: string) {
    if (!IS_SUPABASE_MODE) {
        return;
    }

    throw new Error(
        `A rota "${url}" ainda depende da API legada. O projeto agora esta em modo Supabase e essa tela precisa ser migrada.`
    );
}

export const api = {
    axiosInstance,

    // Contratos
    getContracts: async () => {
        const response = await api.axiosInstance.get('/contracts');
        return response.data;
    },
    uploadContract: async (formData: FormData) => {
        const response = await api.axiosInstance.post('/contracts/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    syncContract: async (id: number) => {
        const response = await api.axiosInstance.post(`/contracts/${id}/sync`);
        return response.data;
    },

    // Generic Axios methods to maintain compatibility
    get: async (url: string, config?: any) => {
        assertLegacyApiMode(url);
        return await api.axiosInstance.get(url, config);
    },
    post: async (url: string, data?: any, config?: any) => {
        assertLegacyApiMode(url);
        return await api.axiosInstance.post(url, data, config);
    },
    put: async (url: string, data?: any, config?: any) => {
        assertLegacyApiMode(url);
        return await api.axiosInstance.put(url, data, config);
    },
    delete: async (url: string, config?: any) => {
        assertLegacyApiMode(url);
        return await api.axiosInstance.delete(url, config);
    },
    patch: async (url: string, data?: any, config?: any) => {
        assertLegacyApiMode(url);
        return await api.axiosInstance.patch(url, data, config);
    },

    // Expose defaults for direct access (like baseURL)
    defaults: axiosInstance.defaults,
};

// Update defaults reference to point to the actual instance defaults if needed dynamically, 
// but for the specific error 'api.defaults.baseURL', the above mock might be enough or we link it.
api.defaults = api.axiosInstance.defaults;
