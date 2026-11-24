import { defineConfig } from 'tsdown'
import { packageBuilds } from '../../configs/tsdown.ts'

export default defineConfig(
  packageBuilds({
    entry: { index: 'src/index.ts', studioWorker: 'src/runners/studio/worker.ts' },
    dtsEntry: { index: 'src/index.ts' },
  }),
)
