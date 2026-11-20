import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/dist/**', '**/bundle-analysis.html']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Page modules - each page gets its own chunk
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('.')[0];
            return `page-${pageName}`;
          }
          // Vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('nepali-date-converter')) return 'vendor-nepali';
            return 'vendor';
          }
          // Core modules
          if (id.includes('/i18n.js')) return 'i18n-core';
          if (id.includes('/knowledge.js')) return 'knowledge-core';
          if (id.includes('/accounting.js')) return 'accounting-core';
          if (id.includes('/tax.js')) return 'tax-core';
          if (id.includes('/financial.js')) return 'financial-core';
          if (id.includes('/reliability.js')) return 'reliability-core';
          if (id.includes('/constants.js')) return 'constants-core';
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
});