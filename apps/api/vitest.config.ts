import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        dir: 'src',
        hookTimeout: 60000, // 60 seconds for MongoDB Memory Server startup
        testTimeout: 30000,  // 30 seconds for individual tests
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
