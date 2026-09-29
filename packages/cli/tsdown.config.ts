import { defineConfig, type UserConfig } from 'tsdown'

const entry = { index: 'src/index.ts', studioWorker: 'src/runners/studio/worker.ts' }

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  deps: {
    neverBundle: [/^@kubb\//],
    alwaysBundle: [/@internals/],
  },
  fixedExtension: false,
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    entry,
    format: 'esm',
    dts: true,
    ...shared,
  },
  {
    entry: { index: 'src/index.ts' },
    format: 'cjs',
    dts: false,
    ...shared,
  },
])
