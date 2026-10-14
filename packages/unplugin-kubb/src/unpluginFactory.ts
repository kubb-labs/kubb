import { adapterOas } from '@kubb/adapter-oas'
import {
  cliReporter,
  type Config,
  createCliReporter,
  createKubb,
  Diagnostics,
  fileReporter,
  Hookable,
  htmlReporter,
  jsonReporter,
  type KubbHooks,
  logLevel,
  type UserConfig,
} from '@kubb/core'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginBarrel, pluginBarrelName } from '@kubb/plugin-barrel'
import type { UnpluginFactory } from 'unplugin'

export type Options = {
  /** Kubb config passed to the unplugin entry point. */
  config?: UserConfig
}

/** Applies the `defineConfig` defaults (`root`, `adapterOas`, the ts/tsx/md parsers, the built-in reporters, `pluginBarrel`, `output.barrel/format/lint: false`) when not set. */
export function applyDefaults<TInput>(config: UserConfig<TInput>): UserConfig<TInput> {
  const plugins = config.plugins ?? []

  return {
    ...config,
    root: config.root || process.cwd(),
    adapter: config.adapter ?? adapterOas(),
    parsers: config.parsers?.length ? config.parsers : [parserTs(), parserTsx(), parserMd()],
    reporters: config.reporters?.length ? config.reporters : [cliReporter, jsonReporter, fileReporter, htmlReporter],
    plugins: plugins.some((plugin) => plugin.name === pluginBarrelName) ? plugins : [...plugins, pluginBarrel()],
    output: { barrel: false, format: false, lint: false, ...config.output },
  }
}

/**
 * Builds the Kubb unplugin for any unplugin-supported bundler (Vite, Rollup, Webpack, esbuild).
 *
 * Runs the Kubb build during the first `buildStart` with {@link applyDefaults} applied to the
 * config and prints the same summary `kubb generate` does. Under Vite it only applies during
 * `build`. A missing config or a failed generation fails the host build.
 */
export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const hooks = new Hookable<KubbHooks>()
  const reporter = createCliReporter()

  hooks.hook('kubb:generation:end', ({ config, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) =>
    reporter.report({ config, diagnostics, filesCreated, status, hrStart }, { logLevel: logLevel.info }),
  )

  // Throw: webpack, Rspack, esbuild, and Farm contexts have no `this.error`.
  async function runBuild() {
    if (!options?.config) {
      throw new Error(`[${name}] Config is not set`)
    }

    const kubb = createKubb(applyDefaults(options.config) as Config, { hooks })
    const result = await kubb.generate()

    if (!result.success) {
      const failedCount = Diagnostics.failedPlugins(result.diagnostics).length
      const firstError = result.diagnostics.filter(Diagnostics.isProblem).find((diagnostic) => diagnostic.severity === 'error')
      const message = failedCount > 0 ? `Build Error with ${failedCount} failed plugins` : (firstError?.message ?? 'Build failed')

      throw new Error(`[${name}] ${message}`, { cause: firstError?.cause })
    }
  }

  // A rerun with `output.clean` loops webpack and Rspack watchers, so generate once per instance.
  let generation: Promise<void> | undefined

  return {
    name,
    enforce: 'pre',
    apply: meta.framework === 'vite' ? 'build' : undefined,
    async buildStart() {
      generation ??= runBuild().catch((error: unknown) => {
        generation = undefined
        throw error
      })
      await generation
    },
  }
}
