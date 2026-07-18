import { defineConfig } from 'vite';

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
  test: {
    globals: true,
    environment: 'node',
  },
});
