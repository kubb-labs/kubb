import type { Options } from 'tsup'

export const bannerCJS: Options['banner'] = {}

export const bannerESM: Options['banner'] = {
  /**
   * @link https://stackoverflow.com/questions/31931614/require-is-not-defined-node-js
   */
  js: `
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  `,
}

export const options: Options = {
  entry: ['src/index.ts'],
  sourcemap: true,
  minify: false,
  clean: true,
  platform: 'node',
  shims: true,
  ignoreWatch: ['**/.turbo', '**/dist', '**/node_modules', '**/.DS_STORE', '**/.git'],
  treeshake: 'recommended',
}

export const optionsESM: Options = {
  ...options,
  format: 'esm',
  dts: true,
  splitting: true,
}

export const optionsCJS: Options = {
  ...options,
  format: 'cjs',
  dts: true,
  splitting: true,
}

export default {
  default: options,
  esm: optionsESM,
  cjs: optionsCJS,
} as const
