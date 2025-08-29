import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    proxy: {
      '/api/nutstore': {
        target: 'https://dav.jianguoyun.com',
        changeOrigin: true,
        secure: true,
        ws: false,
        rewrite: (path) => path.replace(/^\/api\/nutstore/, '/dav'),
        headers: {
          'User-Agent': 'MirrorPhone-WebDAV-Client/1.0'
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('坚果云代理错误:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('坚果云代理请求:', req.method, req.url, '->', proxyReq.getHeader('host'));
            // 确保保持原始的Authorization头
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            // 设置正确的Content-Type for WebDAV
            if (req.method === 'PUT' || req.method === 'POST') {
              proxyReq.setHeader('Content-Type', 'application/octet-stream');
            }
            // 设置WebDAV相关的头
            if (req.method === 'PROPFIND' || req.method === 'MKCOL') {
              proxyReq.setHeader('Content-Type', 'application/xml');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('坚果云代理响应:', proxyRes.statusCode, req.url);
            // 记录响应头
            console.log('响应头:', Object.fromEntries(proxyRes.headers.entries()));
          });
        }
      }
    }
  }
})
