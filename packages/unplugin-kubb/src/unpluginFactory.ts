import path from 'node:path'
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
import ts from '@typescript/typescript6'
import type { UnpluginFactory } from 'unplugin'
import { generateModule } from './generateModule.ts'

export type Options = {
  /**
   * Kubb config passed to the unplugin entry point.
   */
  config?: UserConfig
}

/**
 * Applies the defaults `defineConfig` and the unplugin share to a single user config when not set.
 *
 * - `root` defaults to `process.cwd()`
 * - `adapter` defaults to `adapterOas()`
 * - `parsers` defaults to `[parserTs(), parserTsx(), parserMd()]`
 * - `reporters` defaults to `[cliReporter, jsonReporter, fileReporter, htmlReporter]`
 * - `plugins` gets `pluginBarrel()` appended when none is already present
 * - `output.barrel` defaults to `false` when not set (`pluginBarrel` is always present after the step above, but generates nothing until configured)
 * - `output.format` and `output.lint` default to `false`
 */
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
 * Spec files an `import` loads as a module of the generated code, such as `petStore.openapi.yaml`.
 * The same extensions the `openapi-import` TypeScript content mapper registers.
 */
export const specFilePattern = /\.openapi\.ya?ml$/

/**
 * Builds the Kubb unplugin for any unplugin-supported bundler (Vite, Rollup, Webpack, esbuild).
 *
 * Returns two plugins:
 * - `unplugin-kubb` runs the Kubb build during the first `buildStart` with {@link applyDefaults}
 *   applied to the config and prints the same summary `kubb generate` does. Under Vite it only
 *   applies during `build`. A config without `input` skips this build.
 * - `unplugin-kubb:import` loads an imported {@link specFilePattern} file as one JavaScript module
 *   holding the output of every plugin in the config, also in the Vite dev server.
 *
 * A missing config or a failed generation fails the host build.
 */
export const unpluginFactory: UnpluginFactory<Options | undefined, true> = (options, meta) => {
  const name = 'unplugin-kubb' as const
  const hooks = new Hookable<KubbHooks>()
  const reporter = createCliReporter()

  hooks.hook('kubb:generation:end', ({ config, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) =>
    reporter.report({ config, diagnostics, filesCreated, status, hrStart }, { logLevel: logLevel.info }),
  )

  // Throw: webpack, Rspack, esbuild, and Farm contexts have no `this.error`.
  function requireConfig(): UserConfig {
    if (!options?.config) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.inputRequired,
        severity: 'error',
        message: `[${name}] Config is not set`,
        help: 'Pass your Kubb config as the `config` option of the plugin.',
        location: { kind: 'config' },
      })
    }
    return options.config
  }

  async function runBuild() {
    const config = requireConfig()
    if (!config.input) return

    const kubb = createKubb(applyDefaults(config) as Config, { hooks })
    const result = await kubb.generate()

    if (!result.success) {
      const failedCount = Diagnostics.failedPlugins(result.diagnostics).length
      const firstError = result.diagnostics.filter(Diagnostics.isProblem).find((diagnostic) => diagnostic.severity === 'error')
      const message = failedCount > 0 ? `Build Error with ${failedCount} failed plugins` : (firstError?.message ?? 'Build failed')

      // Keep the first error's code, help, and location, so the bundler shows the same diagnostic.
      throw new Diagnostics.Error({
        ...(firstError ?? { code: Diagnostics.code.unknown, severity: 'error' }),
        message: `[${name}] ${message}`,
      })
    }
  }

  // A rerun with `output.clean` loops webpack and Rspack watchers, so generate once per instance.
  let generation: Promise<void> | undefined

  return [
    {
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
    },
    {
      name: `${name}:import`,
      enforce: 'pre',
      loadInclude: (id) => specFilePattern.test(id),
      async load(id) {
        const { text, errors } = await generateModule({ root: path.dirname(id), input: id, config: requireConfig() })
        if (text === null) {
          const [error] = errors
          throw new Diagnostics.Error({
            ...(error ?? { code: Diagnostics.code.unknown, severity: 'error' }),
            message: `[${name}] ${id}: ${error?.message ?? 'Build failed'}`,
          })
        }

        // Bundlers do not strip types from a `.yaml` module, so hand them JavaScript.
        return ts.transpileModule(text, { fileName: `${id}.ts`, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext } }).outputText
      },
    },
  ]
}
