import { createEsbuildPlugin } from 'unplugin'

import { unpluginFactory } from './unpluginFactory.ts'

export default createEsbuildPlugin(unpluginFactory)
