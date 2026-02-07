import process from 'node:process'
import { type Config, type KubbEvents, safeBuild } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import { version as unpluginVersion } from '../package.json'
import type { Options } from './types.ts'

type RollupContext = {
  info?: (message: string) => void
  warn?: (message: string) => void
  error?: (message: string) => void
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const events = new AsyncEventEmitter<KubbEvents>()
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

    events.on('lifecycle:start', (version) => {
      console.log(`Kubb Unplugin ${version} 🧩`)
    })

    events.on('error', (error) => {
      console.error(`✗ ${error?.message || 'failed'}`)
    })

    events.on('warn', (message) => {
      console.warn(`⚠ ${message}`)
    })

    events.on('info', (message) => {
      console.info(`ℹ ${message}`)
    })

    events.on('success', (message) => {
      console.log(`✓ ${message}`)
    })

    events.on('plugin:end', (plugin, { duration }) => {
      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

      console.log(`✓ ${plugin.name} completed in ${durationStr}`)
    })

    events.on('files:processing:end', () => {
      const text = '✓ Files written successfully'

      console.log(text)
    })

    events.on('generation:end', (config) => {
      console.log(config.name ? `✓ Generation completed for ${config.name}` : '✓ Generation completed')
    })

    events.on('generation:summary', (config, { status, failedPlugins }) => {
      const pluginsCount = config.plugins?.length || 0
      const successCount = pluginsCount - failedPlugins.size

      console.log(
        status === 'success'
          ? `Kubb Summary: ✓ ${`${successCount} successful`}, ${pluginsCount} total`
          : `Kubb Summary: ✓ ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total`,
      )
    })

    await events.emit('lifecycle:start', unpluginVersion)

    const { root: _root, ...userConfig } = options.config as Config

    await events.emit('generation:start', options.config as Config)

    const { error, failedPlugins, pluginTimings, files, sources } = await safeBuild({
      config: {
        root: process.cwd(),
        ...userConfig,
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      events,
    })

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
        events.emit('error', err)
      })
    }

    await events.emit('generation:end', options.config as Config, files, sources)
    await events.emit('generation:summary', options.config as Config, {
      failedPlugins,
      filesCreated: files.length,
      status: failedPlugins.size > 0 || error ? 'failed' : 'success',
      hrStart,
      pluginTimings,
    })

    await events.emit('lifecycle:end')
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

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
