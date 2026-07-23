import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Empêche l'étape esbuild (celle qui convertit le code au format ES2015 avant même que Terser
  // n'intervienne) de transformer emojis/accents en séquences \u{...} — sans ça, le réglage
  // ascii_only de Terser plus bas n'a plus rien à corriger, le texte est déjà converti avant
  // qu'il ne le voie.
  // "as any" : la définition de type de cette version de Vite ne connaît pas encore "charset"
  // même si esbuild le supporte bien réellement — sans ce contournement, tsc refuse de compiler.
  esbuild: {
    charset: 'utf8',
  } as any,
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
        // Empêche aussi Terser d'échapper ces caractères de son côté.
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
