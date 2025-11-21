import process from 'node:process'
import type { Config } from '@kubb/core'
import { safeBuild } from '@kubb/core'
import { createLogger } from '@kubb/core/logger'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { Logger } from 'vite'
import type { Options } from './types.ts'

type RollupContext = {
  warn?: (message: string) => void
  error?: (message: string | Error) => void
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const logger = createLogger({ name })
  const isVite = meta.framework === 'vite'

  function setupLogger(viteLogger?: Logger, rollupCtx?: RollupContext) {
    if (viteLogger) {
      // Vite integration
      logger.on('start', (message: string) => viteLogger.info(`${name}: ${message}`))
      logger.on('success', (message: string) => viteLogger.info(`${name}: ${message}`))
      logger.on('warning', (message: string) => viteLogger.warn(`${name}: ${message}`))
      logger.on('error', (message: string) => viteLogger.error(`${name}: ${message}`))
    } else if (rollupCtx) {
      // Rollup-like bundlers (Rollup, Webpack, Rspack, esbuild, etc.)
      logger.on('start', (message: string) => rollupCtx.warn?.(`${name}: ${message}`))
      logger.on('success', (message: string) => rollupCtx.warn?.(`${name}: ${message}`))
      logger.on('warning', (message: string) => rollupCtx.warn?.(`${name}: ${message}`))
      logger.on('error', (message: string) => {
        rollupCtx.error?.(`${name}: ${message}`) || console.error(`${name}: ${message}`)
      })
    }
  }

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      ctx.error?.(`[${name}] Config is not set`)
      return
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
      ctx.error?.(error)
    } else {
      logger.emit('success', 'Build finished')
    }
  }

  return {
    name,
    enforce: 'pre',
    apply: isVite ? 'build' : undefined,

    async buildStart() {
      if (!isVite) {
        setupLogger(undefined, this as unknown as RollupContext)
      }
      await runBuild(this as unknown as RollupContext)
    },

    vite: {
      configResolved(config) {
        setupLogger(config.logger)
      },
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
