import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    })
  ],
  define: {
    // ====================================================================================
    // IMPORTANT: Put your API key in .env.local file as VITE_API_KEY=your_key
    // You can get a key from Google AI Studio: https://makersuite.google.com/app/apikey
    // ====================================================================================
    'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || "")
  },
  build: {
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'firebase'],
        },
      },
    },
  },
  base: '/'
  };
})
