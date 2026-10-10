import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

function obfuscateEnginePlugin(): Plugin {
  return {
    name: 'obfuscate-calculation-engine',
    apply: 'build', // Only obfuscate production builds, keeping dev lightning-fast
    enforce: 'post',
    transform(code, id) {
      // Obfuscate calculation engine and electrical rule services only
      const isEngineOrRules =
        (id.includes('/src/engine/') ||
          id.includes('\\src\\engine\\') ||
          id.includes('/src/services/ruleService') ||
          id.includes('\\src\\services\\ruleService')) &&
        !id.includes('__tests__') &&
        !id.includes('.test.');

      if (isEngineOrRules) {
        const obfuscated = JavaScriptObfuscator.obfuscate(code, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.8,
          deadCodeInjection: false, // Keep output lean and fast
          numbersToExpressions: true,
          simplify: true,
          stringArray: true,
          stringArrayThreshold: 0.85,
          splitStrings: true,
          splitStringsChunkLength: 6,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        });

        return {
          code: obfuscated.getObfuscatedCode(),
          map: null,
        };
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), obfuscateEnginePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    sourcemap: false, // Ensure source maps are disabled so raw code cannot be inspected
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
});
