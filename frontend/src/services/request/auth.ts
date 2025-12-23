export const authConfig = {
    requestInterceptors: [
        (url: string, options: any = {}) => {
            const token = localStorage.getItem('token');
            const headers = { ...(options.headers || {}) };
            if (token) headers.Authorization = `Bearer ${token}`;
            return {
                url,
                options: {
                    ...options,
                    headers,
                },
            };
        },
    ],
};