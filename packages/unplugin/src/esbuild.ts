import { createEsbuildPlugin } from 'unplugin'

import { unpluginFactory } from './index.ts'

export default createEsbuildPlugin(unpluginFactory)
