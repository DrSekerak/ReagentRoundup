import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets work both at the domain root and under /ReagentRoundup/.
  base: './',
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' },
});
