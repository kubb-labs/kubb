/* eslint-disable no-param-reassign */
import { defineConfig, type Options } from 'tsup'

const baseOptions = {
  entry: ['src/index.ts'],
  treeshake: true,
  sourcemap: false,
  minify: false,
  clean: true,
  /**
   * @link https://stackoverflow.com/questions/31931614/require-is-not-defined-node-js
   */
  banner: {
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },
  platform: 'node',
  shims: true,
} satisfies Options

export default defineConfig([
  {
    ...baseOptions,
    format: 'esm',
    dts: true,
    splitting: false,
  },
])
