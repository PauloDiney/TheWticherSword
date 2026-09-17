import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Garante que `import sword from './assets/model/sword.glb'` resolva para uma
  // URL com hash no build, em vez de o Vite tentar interpretar o binário.
  assetsInclude: ['**/*.glb'],
})
