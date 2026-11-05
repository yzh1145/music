import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 后端地址：换机器时可用环境变量 API_TARGET 覆盖，例如 API_TARGET=http://192.168.1.10:8080
const target = process.env.API_TARGET || 'http://localhost:8080'

// 开发服务器：/api、/images、/audio 全部代理到 Spring Boot
export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.FRONTEND_PORT) || 5173,
    // 需要局域网内其它设备访问时，用 npm run dev -- --host 启动
    host: process.env.FRONTEND_HOST || 'localhost',
    watch: {
      // 忽略编辑器/工具原子写文件时产生的临时目录与临时文件，否则监听器会因文件被占用而崩溃
      ignored: ['**/*.tmpdir/**', '**/*.tmp', '**/.git/**', '**/dist/**']
    },
    proxy: {
      '/api': { target, changeOrigin: true },
      '/images': { target, changeOrigin: true },
      '/audio': { target, changeOrigin: true }
    }
  }
})
