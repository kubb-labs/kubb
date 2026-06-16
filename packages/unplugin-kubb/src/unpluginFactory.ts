import process from 'node:process'
import { AsyncEventEmitter } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { type Config, createKubb, Diagnostics, type KubbHooks } from '@kubb/core'
import { pluginBarrel, pluginBarrelName } from '@kubb/plugin-barrel'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import type { UnpluginFactory } from 'unplugin'
import { version as unpluginVersion } from '../package.json'
import type { Options } from './types.ts'

type RollupContext = {
  info?: (message: string) => void
  warn?: (message: string) => void
  error?: (message: string) => void
}

/**
 * Builds the Kubb unplugin for any unplugin-supported bundler (Vite, Rollup, Webpack, esbuild).
 *
 * Registers hook handlers that log lifecycle, diagnostics, and a per-plugin summary, then runs
 * the Kubb build during `buildStart`. When the config omits them, it fills in defaults: the OAS
 * adapter, the TS and TSX parsers, and a barrel plugin. Under Vite it only applies during `build`.
 */
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

  hooks.on('kubb:generation:end', ({ config, status, diagnostics }) => {
    console.log(config.name ? `✓ Generation completed for ${config.name}` : '✓ Generation completed')

    if (!diagnostics || !status) return

    const failedCount = Diagnostics.failedPlugins(diagnostics).length
    const pluginsCount = config.plugins.length
    const successCount = pluginsCount - failedCount

    console.log(
      status === 'success'
        ? `Kubb Summary: ✓ ${`${successCount} successful`}, ${pluginsCount} total`
        : `Kubb Summary: ✓ ${`${successCount} successful`}, ✗ ${`${failedCount} failed`}, ${pluginsCount} total`,
    )
  })

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      ;(ctx.error ?? console.error)(`[${name}] Config is not set`)
      return
    }

    const alreadyHasBarrel = options.config.plugins?.some((p) => p.name === pluginBarrelName)
    const plugins = alreadyHasBarrel ? (options.config.plugins ?? []) : [...(options.config.plugins ?? []), pluginBarrel()]
    const hasBarrelPlugin = plugins.some((p) => p.name === pluginBarrelName)
    const output = { ...options.config.output }
    if (hasBarrelPlugin && output.barrel === undefined) {
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
      plugins,
      output,
    }
    const hrStart = process.hrtime()

    await hooks.emit('kubb:lifecycle:start', { version: unpluginVersion })

    const userConfig = config as Config

    const kubb = createKubb(userConfig, { hooks })
    await kubb.setup()

    await hooks.emit('kubb:generation:start', { config: kubb.config })

    const { diagnostics, files, storage } = await kubb.safeBuild()

    const hasFailures = Diagnostics.hasError(diagnostics)

    // Surface every problem by severity. Unplugin has no diagnostic renderer, so route
    // errors/warnings/info to the channels it does listen on. Non-problem diagnostics are skipped.
    for (const diagnostic of diagnostics) {
      if (!Diagnostics.isProblem(diagnostic)) {
        continue
      }
      if (diagnostic.severity === 'error') {
        hooks.emit('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
      } else if (diagnostic.severity === 'warning') {
        hooks.emit('kubb:warn', { message: diagnostic.message })
      } else {
        hooks.emit('kubb:info', { message: diagnostic.message })
      }
    }

    await hooks.emit('kubb:generation:end', {
      config: kubb.config,
      storage,
      diagnostics,
      filesCreated: files.length,
      status: hasFailures ? 'failed' : 'success',
      hrStart,
    })

    await hooks.emit('kubb:lifecycle:end')

    if (hasFailures) {
      const failedCount = Diagnostics.failedPlugins(diagnostics).length
      const firstError = diagnostics.filter(Diagnostics.isProblem).find((diagnostic) => diagnostic.severity === 'error')
      const message = failedCount > 0 ? `Build Error with ${failedCount} failed plugins` : (firstError?.message ?? 'Build failed')
      if (ctx.error) {
        ctx.error(`[${name}] ${message}`)
        return
      }

      throw new Error(`[${name}] ${message}`, { cause: firstError?.cause })
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
