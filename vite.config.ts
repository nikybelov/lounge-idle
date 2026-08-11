import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

// Локально: './'. На GitHub Pages CI задаёт VITE_BASE=/repo-name/
const base = process.env.VITE_BASE || './'

export default defineConfig({
  base,
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
})
