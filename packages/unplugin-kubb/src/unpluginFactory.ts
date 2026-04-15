import process from 'node:process'
import { AsyncEventEmitter } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { type Config, createKubb, type KubbHooks } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
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
  const hrStart = process.hrtime()

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      if (ctx.error) {
        ctx.error?.(`[${name}] Config is not set`)
      } else {
        console.error(`[${name}] Config is not set`)
      }
      return
    }

    const config = {
      ...options.config,
      adapter: options.config.adapter ?? adapterOas(),
      parsers: options.config.parsers?.length ? options.config.parsers : [parserTs],
    }

    hooks.on('kubb:lifecycle:start', (version) => {
      console.log(`Kubb Unplugin ${version} 🧩`)
    })

    hooks.on('kubb:error', (error) => {
      console.error(`✗ ${error?.message || 'failed'}`)
    })

    hooks.on('kubb:warn', (message) => {
      console.warn(`⚠ ${message}`)
    })

    hooks.on('kubb:info', (message) => {
      console.info(`ℹ ${message}`)
    })

    hooks.on('kubb:success', (message) => {
      console.log(`✓ ${message}`)
    })

    hooks.on('kubb:plugin:end', (plugin, { duration }) => {
      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

      console.log(`✓ ${plugin.name} completed in ${durationStr}`)
    })

    hooks.on('kubb:files:processing:end', () => {
      const text = '✓ Files written successfully'

      console.log(text)
    })

    hooks.on('kubb:generation:end', (config) => {
      console.log(config.name ? `✓ Generation completed for ${config.name}` : '✓ Generation completed')
    })

    hooks.on('kubb:generation:summary', (config, { status, failedPlugins }) => {
      const pluginsCount = config.plugins.length
      const successCount = pluginsCount - failedPlugins.size

      console.log(
        status === 'success'
          ? `Kubb Summary: ✓ ${`${successCount} successful`}, ${pluginsCount} total`
          : `Kubb Summary: ✓ ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total`,
      )
    })

    await hooks.emit('kubb:lifecycle:start', unpluginVersion)

    const { root: _root, ...userConfig } = config as Config

    await hooks.emit('kubb:generation:start', config as Config)

    const { error, failedPlugins, pluginTimings, files, sources } = await createKubb({
      config: {
        root: process.cwd(),
        ...userConfig,
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      hooks,
    }).safeBuild()

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
        hooks.emit('kubb:error', err)
      })
    }

    await hooks.emit('kubb:generation:end', config as Config, files, sources)
    await hooks.emit('kubb:generation:summary', config as Config, {
      failedPlugins,
      filesCreated: files.length,
      status: failedPlugins.size > 0 || error ? 'failed' : 'success',
      hrStart,
      pluginTimings,
    })

    await hooks.emit('kubb:lifecycle:end')
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
