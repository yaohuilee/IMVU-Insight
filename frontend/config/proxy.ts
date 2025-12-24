export default {
    '/insight/api/': {
        target: 'http://127.0.0.1:7000',
        changeOrigin: true,
        pathRewrite: { '^/insight/api/': '' },
    }
}