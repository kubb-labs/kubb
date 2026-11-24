import { defineConfig } from 'tsdown'
import { packageBuilds } from '../../configs/tsdown.ts'

export default defineConfig(
  packageBuilds({
    entry: { index: 'src/index.ts', 'jsx-runtime': './src/jsx-runtime.ts', 'jsx-dev-runtime': './src/jsx-dev-runtime.ts' },
    deps: { onlyBundle: false },
  }),
)
