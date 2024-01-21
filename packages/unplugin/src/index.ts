import { build } from '@kubb/core'
import { createLogger, LogLevel } from '@kubb/core/logger'

import { createUnplugin } from 'unplugin'

import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types.ts'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const name = 'unplugin-kubb' as const
  const logger = createLogger({ logLevel: LogLevel.silent, name })

  return {
    name,
    async buildEnd() {
      if (!options?.config) {
        throw new Error('Options are not set')
      }
      await build({
        config: options.config,
        logger,
      })
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
