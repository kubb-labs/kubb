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
  dts: {
    compilerOptions: {
      target: 'ES5',
      module: 'commonjs',
      moduleResolution: 'node',
    },
  },
  banner: bannerCJS,
  // esbuildOptions: (options) => {
  //   options.footer = {
  //     // This will ensure we can continue writing this plugin
  //     // as a modern ECMA module, while still publishing this as a CommonJS
  //     // library with a default export, as that's how ESLint expects plugins to look.
  //     // @see https://github.com/evanw/esbuild/issues/1182#issuecomment-1011414271
  //     js: 'module.exports = module.exports.default;',
  //   }
  // },
}
