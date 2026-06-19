import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
  ],
  build: {
    // Inline all assets — fonts, images, everything
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Single JS chunk
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
})
