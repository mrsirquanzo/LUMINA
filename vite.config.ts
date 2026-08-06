import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Exclude agent-scratch worktrees which contain duplicate copies of the repo's
    // test files (gitignored under .claude/worktrees) and would otherwise inflate the suite.
    // `dist/**` holds the compiled server output from `npm run build:server`; running
    // the suite after a server build would otherwise execute stale compiled duplicates
    // of every server test against the previous build's code.
    exclude: [...configDefaults.exclude, '.claude/**', '**/worktrees/**', 'dist/**'],
  },
})
