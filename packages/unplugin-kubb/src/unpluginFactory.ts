import process from 'node:process'
import { AsyncEventEmitter } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { type Config, createKubb, type KubbHooks } from '@kubb/core'
import { middlewareBarrel, middlewareBarrelName } from '@kubb/middleware-barrel'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import type { UnpluginFactory } from 'unplugin'
import { version as unpluginVersion } from '../package.json'
import type { Options } from './types.ts'

type RollupContext = {
  info?: (message: string) => void
  warn?: (message: string) => void
  error?: (message: string) => void
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const hooks = new AsyncEventEmitter<KubbHooks>()
  const isVite = meta.framework === 'vite'

  hooks.on('kubb:lifecycle:start', ({ version }) => {
    console.log(`Kubb Unplugin ${version} 🧩`)
  })

  hooks.on('kubb:error', ({ error }) => {
    console.error(`✗ ${error?.message || 'failed'}`)
  })

  hooks.on('kubb:warn', ({ message }) => {
    console.warn(`⚠ ${message}`)
  })

  hooks.on('kubb:info', ({ message }) => {
    console.info(`ℹ ${message}`)
  })

  hooks.on('kubb:success', ({ message }) => {
    console.log(`✓ ${message}`)
  })

  hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
    const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

    console.log(`✓ ${plugin.name} completed in ${durationStr}`)
  })

  hooks.on('kubb:files:processing:end', () => {
    const text = '✓ Files written successfully'

    console.log(text)
  })

  hooks.on('kubb:generation:end', ({ config }) => {
    console.log(config.name ? `✓ Generation completed for ${config.name}` : '✓ Generation completed')
  })

  hooks.on('kubb:generation:summary', ({ config, status, failedPlugins }) => {
    const pluginsCount = config.plugins.length
    const successCount = pluginsCount - failedPlugins.size

    console.log(
      status === 'success'
        ? `Kubb Summary: ✓ ${`${successCount} successful`}, ${pluginsCount} total`
        : `Kubb Summary: ✓ ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total`,
    )
  })

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      if (ctx.error) {
        ctx.error?.(`[${name}] Config is not set`)
      } else {
        console.error(`[${name}] Config is not set`)
      }
      return
    }

    const middleware = options.config.middleware?.length ? options.config.middleware : [middlewareBarrel()]
    const hasBarrelMiddleware = middleware.some((m) => m.name === middlewareBarrelName)
    const output = { ...options.config.output }
    if (hasBarrelMiddleware && output.barrel === undefined) {
      output.barrel = { type: 'named' }
    }
    if (output.format === undefined) {
      output.format = false
    }
    if (output.lint === undefined) {
      output.lint = false
    }

    const config = {
      ...options.config,
      adapter: options.config.adapter ?? adapterOas(),
      parsers: options.config.parsers?.length ? options.config.parsers : [parserTs, parserTsx],
      middleware,
      output,
    }
    const hrStart = process.hrtime()

    await hooks.emit('kubb:lifecycle:start', { version: unpluginVersion })

    const userConfig = config as Config

    const kubb = createKubb(
      userConfig,
      { hooks },
    )
    await kubb.setup()

    const resolvedConfig = kubb.config ?? userConfig

    await hooks.emit('kubb:generation:start', { config: resolvedConfig })

    const { error, failedPlugins, pluginTimings, files, sources } = await kubb.safeBuild()

    const hasFailures = failedPlugins.size > 0 || error
    if (hasFailures) {
      // Collect all errors from failed plugins and general error
      const allErrors: Error[] = [
        error,
        ...Array.from(failedPlugins)
          .filter((it) => it.error)
          .map((it) => it.error),
      ].filter(Boolean)

      allErrors.forEach((err) => {
        hooks.emit('kubb:error', { error: err })
      })
    }

    await hooks.emit('kubb:generation:end', { config: resolvedConfig, files, sources })
    await hooks.emit('kubb:generation:summary', {
      config: resolvedConfig,
      failedPlugins,
      filesCreated: files.length,
      status: failedPlugins.size > 0 || error ? 'failed' : 'success',
      hrStart,
      pluginTimings,
    })

    await hooks.emit('kubb:lifecycle:end')

    if (hasFailures) {
      const message = error?.message ?? `Build Error with ${failedPlugins.size} failed plugins`
      if (ctx.error) {
        ctx.error(`[${name}] ${message}`)
        return
      }

      throw new Error(`[${name}] ${message}`, { cause: error })
    }
  }

  return {
    name,
    enforce: 'pre',
    apply: isVite ? 'build' : undefined,
    async buildStart() {
      await runBuild(this as unknown as RollupContext)
    },
    vite: {},
  }
}
