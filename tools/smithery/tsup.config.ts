import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    sourcemap: true,
    minify: false,
    clean: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    dts: true,
    splitting: true,
    treeshake: 'recommended',
  },
])
