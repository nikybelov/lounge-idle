import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

// Локально: './'. На GitHub Pages CI задаёт VITE_BASE=/repo-name/
const base = process.env.VITE_BASE || './'

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION || '0.2.0',
    ),
    'import.meta.env.VITE_FLAVOR': JSON.stringify(process.env.VITE_FLAVOR || ''),
  },
  plugins: [
    checker({
      typescript: {
        tsconfigPath: './tsconfig.json',
      },
      overlay: {
        initialIsOpen: true,
        position: 'br',
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/admin.ts')) return 'admin'
        },
      },
    },
  },
})
