import type { Config } from '@kubb/core'
import { safeBuild } from '@kubb/core'
import { createLogger } from '@kubb/core/logger'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { Options } from './types.ts'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const name = 'unplugin-kubb' as const
  const logger = createLogger({
    name,
  })

  return {
    name,
    enforce: 'pre',
    vite: {
      configResolved(config) {
        logger.on('start', (message: string) => {
          config.logger.info(`${name}: ${message}`)
        })

        logger.on('success', (message: string) => {
          config.logger.info(`${name}: ${message}`)
        })

        logger.on('warning', (message: string) => {
          config.logger.info(`${name}: ${message}`)
        })

        logger.on('error', (message: string) => {
          config.logger.info(`${name}: ${message}`)
        })
      },
    },

    async install() {
      if (!options?.config) {
        throw new Error('Config is not set')
      }

      const { root: _root, ...userConfig } = options.config as Config

      logger.emit('start', 'Building')

      const { error } = await safeBuild({
        config: {
          root: process.cwd(),
          ...userConfig,
          output: {
            write: true,
            ...userConfig.output,
          },
        },
        logger,
      })

      if (error) {
        throw error
      }
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
