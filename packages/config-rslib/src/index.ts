import type { LibConfig, RslibConfig } from '@rslib/core'

export const optionsESM: LibConfig = {
  bundle: false,
  format: 'esm',
  dts: { bundle: true, autoExtension: true },
  syntax: ['es2015', 'node 20'],
  shims: {
    cjs: {
      'import.meta.url': true,
    },
    esm: {
      __dirname: true,
      __filename: true,
      require: true,
    },
  },
}

export const optionsCJS: LibConfig = {
  bundle: false,
  format: 'cjs',
  dts: { bundle: true, autoExtension: true },
  syntax: ['es2015', 'node 20'],
  shims: {
    cjs: {
      'import.meta.url': true,
    },
    esm: {
      __dirname: true,
      __filename: true,
      require: true,
    },
  },
}

export const options: RslibConfig = {
  source: {
    entry: {
      index: 'src/index.ts',
    },
  },
  lib: [optionsESM, optionsCJS],
  output: {
    target: 'node',
    sourceMap: true,
    cleanDistPath: true,
  },
}

export default {
  default: options,
  esm: optionsESM,
  cjs: optionsCJS,
} as const
