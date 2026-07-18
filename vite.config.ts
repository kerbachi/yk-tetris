import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Bind to all interfaces so the dev server is reachable from outside the
    // container/VM (e.g. Cursor's port forwarding), not just localhost.
    host: true,
  },
  preview: {
    host: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
