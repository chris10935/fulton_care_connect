import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const chatApi = env.VITE_CHAT_API;
  const chatApiTarget = env.VITE_CHAT_API_TARGET;

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server:
      chatApi === '/api/chat' && chatApiTarget
        ? {
            proxy: {
              '/api/chat': {
                target: chatApiTarget,
                changeOrigin: true,
              },
            },
          }
        : undefined,
  };
});
