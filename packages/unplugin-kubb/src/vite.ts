import { createVitePlugin } from 'unplugin'

import { unpluginFactory } from './unpluginFactory.ts'

export default createVitePlugin(unpluginFactory)
