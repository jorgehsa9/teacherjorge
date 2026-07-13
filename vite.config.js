import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

let commitCount = '0';
try {
  commitCount = execSync('git rev-list --count HEAD').toString().trim();
} catch (e) {
  console.warn('Failed to get git commit count', e);
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`1.${commitCount}.0`)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Teacher Jorge - Dashboard',
        short_name: 'Teacher Jorge',
        description: 'Plataforma para Alunos do Teacher Jorge',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
