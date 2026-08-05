import { defineConfig } from 'vite'

// Локально: './'. На GitHub Pages CI задаёт VITE_BASE=/repo-name/
const base = process.env.VITE_BASE || './'

export default defineConfig({
  base,
})
