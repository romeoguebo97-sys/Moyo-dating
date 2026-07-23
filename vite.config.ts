import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
        // Empêche Terser de transformer emojis/accents en séquences \u{...} — sans ça,
        // certains moteurs JavaScript (notamment sur téléphone, dans WhatsApp) affichent
        // ces caractères comme des "�" au lieu du bon symbole.
        ascii_only: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    target: 'es2015',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
