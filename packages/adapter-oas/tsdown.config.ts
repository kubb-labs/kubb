import { defineConfig } from 'tsdown'
import { packageBuilds } from '../../configs/tsdown.ts'

export default defineConfig(
  packageBuilds({
    entry: { index: 'src/index.ts', validateWorker: 'src/load/validateWorker.ts' },
    dtsEntry: { index: 'src/index.ts' },
    deps: { neverBundle: [/^@kubb\//], alwaysBundle: [/@internals/], onlyBundle: false },
  }),
)
