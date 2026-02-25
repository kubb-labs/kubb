import { createRollupPlugin } from 'unplugin'

import { unpluginFactory } from './unpluginFactory.ts'

export default createRollupPlugin(unpluginFactory)
