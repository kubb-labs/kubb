import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'

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
  splitting: true,
}

export const optionsCJS: Options = {
  ...options,
  format: 'cjs',
  dts: true,
  splitting: true,
}

export const optionsFlat: Options = {
  format: ['cjs', 'esm'],
  entry: ['./src/**/!(*.d|*.test).ts'],
  outDir: './dist',
  sourcemap: true,
  clean: true,
  dts: true,
  minify: false,
  bundle: true,
  skipNodeModulesBundle: true,
  treeshake: true,
  shims: true,
  ignoreWatch: options.ignoreWatch,
  esbuildPlugins: [esbuildPluginFilePathExtensions({ esmExtension: 'js', cjsExtension: 'cjs' })] as Options['esbuildPlugins'],
}

export default {
  default: options,
  esm: optionsESM,
  cjs: optionsCJS,
  flat: optionsFlat,
} as const
