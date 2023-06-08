/** @type {import("tsup").Options} */
const options = {
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
  ignoreWatch: [
    "**/.turbo",
    "**/dist",
    "**/node_modules",
    "**/.DS_STORE",
    "**/.git",
  ],

}

/** @type {import("tsup").Options} */
const optionsCJS = {
  ...options,
  format: 'esm',
  dts: true,
  splitting: false,
};

/** @type {import("tsup").Options} */
const optionsESM = {
  ...options,
  format: 'cjs',
  dts: {
    compilerOptions: {
      target: 'ES5',
      module: 'commonjs',
      moduleResolution: 'node',
    },
  },
}

module.exports = { options, optionsCJS, optionsESM };