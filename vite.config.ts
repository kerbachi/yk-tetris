import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Relative base so the built app loads over file:// inside Electron.
  base: './',
  server: {
    // Bind to all interfaces so the dev server is reachable from outside the
    // container/VM (e.g. Cursor's port forwarding), not just localhost.
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        minecraft: resolve(root, 'minecraft.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
