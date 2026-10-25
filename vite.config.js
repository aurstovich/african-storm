import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // <--- ВАЖНО: точка и слэш!
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});