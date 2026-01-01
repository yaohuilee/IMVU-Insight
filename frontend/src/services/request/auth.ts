export const authConfig = {
    requestInterceptors: [
        (config: any = {}) => {
            let token: string | null = null;
            try {
                token = localStorage.getItem('access_token');
            } catch {
                token = null;
            }

            if (token) {
                config.headers = {
                    ...(config.headers || {}),
                    Authorization: `Bearer ${token}`,
                };
            }

            return config;
        },
    ],
};