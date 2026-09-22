import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` matches the GitHub Pages sub-path (https://<user>.github.io/meal-tracker/).
// If you later move to a root-domain host (Vercel/Netlify/custom domain), set base to '/'.
export default defineConfig({
  base: '/meal-tracker/',
  plugins: [react()],
})
