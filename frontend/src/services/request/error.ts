export const errorConfig = {
    errorHandler(error: any) {
        const { response } = error || {};
        if (response?.status === 401) {
            try {
                localStorage.removeItem('token');
            } catch (e) {}
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
                return;
            }
        }
        throw error;
    },
};