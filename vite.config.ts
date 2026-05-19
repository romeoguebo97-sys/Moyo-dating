import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Minification maximale
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Supprime tous les console.log en prod
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
        passes: 2,               // Double passe de compression
      },
      mangle: true,
      format: {
        comments: false,         // Supprime tous les commentaires
      },
    },

    // Découpage du bundle en morceaux
    rollupOptions: {
      output: {
        manualChunks: {
          // React dans son propre chunk (mis en cache par le navigateur)
          'vendor-react': ['react', 'react-dom'],
        },
        // Noms de fichiers avec hash pour cache navigateur
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Taille limite avant avertissement (en ko)
    chunkSizeWarningLimit: 1000,

    // Génère les sourcemaps uniquement en dev
    sourcemap: false,

    // Cible les navigateurs modernes (bundle plus léger)
    target: 'es2015',
  },

  // Optimisation des dépendances au démarrage
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },

  // Compression des assets statiques
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
})
