import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Capital Matrix',
        short_name: 'Matrix',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [] // Array left intentionally empty to prevent build asset errors
      }
    })
  ],
})
