import { adapterOas } from '@kubb/adapter-oas'
import { applyConfigDefaults, type Config, createKubb, Diagnostics, type KubbHooks, Hookable } from '@kubb/core'
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
  const hooks = new Hookable<KubbHooks>()
  const isVite = meta.framework === 'vite'

  hooks.hook('kubb:lifecycle:start', ({ version }) => {
    console.log(`Kubb Unplugin ${version} 🧩`)
  })

  hooks.hook('kubb:error', ({ error }) => {
    console.error(`✗ ${error?.message || 'failed'}`)
  })

  hooks.hook('kubb:warn', ({ message }) => {
    console.warn(`⚠ ${message}`)
  })

  hooks.hook('kubb:info', ({ message }) => {
    console.info(`ℹ ${message}`)
  })

  // Unplugin has no diagnostic renderer, so route each problem by severity to a channel it logs on.
  hooks.hook('kubb:diagnostic', ({ diagnostic }) => {
    if (diagnostic.severity === 'error') return hooks.callHook('kubb:error', { error: diagnostic.cause ?? new Error(diagnostic.message) })
    if (diagnostic.severity === 'warning') return hooks.callHook('kubb:warn', { message: diagnostic.message })
    return hooks.callHook('kubb:info', { message: diagnostic.message })
  })

  hooks.hook('kubb:success', ({ message }) => {
    console.log(`✓ ${message}`)
  })

  hooks.hook('kubb:plugin:end', ({ plugin, duration }) => {
    const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

    console.log(`✓ ${plugin.name} completed in ${durationStr}`)
  })

  hooks.hook('kubb:files:processing:end', () => {
    const text = '✓ Files written successfully'

    console.log(text)
  })

  hooks.hook('kubb:generation:end', ({ config, status, diagnostics }) => {
    console.log(config.name ? `✓ Generation completed for ${config.name}` : '✓ Generation completed')

    if (!diagnostics || !status) return

    const failedCount = Diagnostics.failedPlugins(diagnostics).length
    const pluginsCount = config.plugins.length
    const successCount = pluginsCount - failedCount

    console.log(
      status === 'success'
        ? `Kubb Summary: ✓ ${successCount} successful, ${pluginsCount} total`
        : `Kubb Summary: ✓ ${successCount} successful, ✗ ${failedCount} failed, ${pluginsCount} total`,
    )
  })

  async function runBuild(ctx: RollupContext) {
    if (!options?.config) {
      ;(ctx.error ?? console.error)(`[${name}] Config is not set`)
      return
    }

    const { adapter, output, plugins } = applyConfigDefaults(options.config, {
      defaultAdapter: adapterOas(),
      barrelPlugin: pluginBarrel(),
      barrelPluginName: pluginBarrelName,
      defaultOutput: { barrel: false, format: false, lint: false },
    })

    const config = {
      ...options.config,
      adapter,
      parsers: options.config.parsers?.length ? options.config.parsers : [parserTs(), parserTsx()],
      plugins,
      output,
    }
    const userConfig = config as Config

    await hooks.callHook('kubb:lifecycle:start', { version: unpluginVersion })

    const kubb = createKubb(userConfig, { hooks })
    const result = await kubb.generate()

    await hooks.callHook('kubb:lifecycle:end')

    if (!result.success) {
      const failedCount = Diagnostics.failedPlugins(result.diagnostics).length
      const firstError = result.diagnostics.filter(Diagnostics.isProblem).find((diagnostic) => diagnostic.severity === 'error')
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
