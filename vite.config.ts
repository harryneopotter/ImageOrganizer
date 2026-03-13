import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'Gemini Lens',
            short_name: 'Gemini Lens',
            description: 'Bulk Image Categorizer powered by Gemini AI',
            theme_color: '#0f172a',
            background_color: '#0f172a',
            display: 'standalone',
            icons: [
              {
                src: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide@main/icons/zap.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide@main/icons/zap.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
