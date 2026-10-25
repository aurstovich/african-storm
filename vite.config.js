import { defineConfig } from 'vite';

export default defineConfig({
    base: '/african-storm/', // Имя твоего репозитория на GitHub
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});