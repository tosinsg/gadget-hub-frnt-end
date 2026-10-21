import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The dev server watches the project for changes. Some editors and tools save files by
// writing a temporary file and renaming it, which can leave a transient `.something.tmp`
// that the watcher tries to open after it has gone - crashing the server with EBUSY.
// Ignoring those patterns keeps the dev server stable.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/.*.tmp', '**/*.tmpdir/**', '**/.*.tmpdir/**'],
    },
  },
})
