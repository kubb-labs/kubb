import { defineConfig } from 'tsdown'
import { packageBuilds } from '../../configs/tsdown.ts'

export default defineConfig(packageBuilds({ entry: { index: 'src/index.ts', protocol: 'src/protocol.ts' } }))
