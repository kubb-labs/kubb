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
  treeshake: true,
  sourcemap: true,
  minify: false,
  clean: true,
  platform: 'node',
  shims: true,
  ignoreWatch: ['**/.turbo', '**/dist', '**/node_modules', '**/.DS_STORE', '**/.git'],
}

export const optionsESM: Options = {
  ...options,
  format: 'esm',
  dts: true,
  splitting: false,
  banner: bannerESM,
}

export const optionsCJS: Options = {
  ...options,
  format: 'cjs',
  dts: true,
  banner: bannerCJS,
  splitting: false,
}
