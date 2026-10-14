import type { PossiblePromise } from '@internals/utils'
import type { CLIOptions, UserConfig } from '@kubb/core'
import { applyDefaults } from 'unplugin-kubb'

type AnyConfigResult = UserConfig<unknown> | Array<UserConfig<unknown>>
type ConfigInput = AnyConfigResult | Promise<AnyConfigResult> | ((cli: CLIOptions) => PossiblePromise<AnyConfigResult>)
type NormalizeConfig<TConfig> =
  TConfig extends Array<UserConfig<infer TInput>> ? Array<UserConfig<TInput>> : TConfig extends UserConfig<infer TInput> ? UserConfig<TInput> : never
type DefinedConfig<TConfig extends ConfigInput> = TConfig extends (cli: CLIOptions) => PossiblePromise<infer TResult>
  ? (cli: CLIOptions) => Promise<NormalizeConfig<TResult>>
  : TConfig extends Promise<infer TResult>
    ? Promise<NormalizeConfig<TResult>>
    : NormalizeConfig<TConfig>

function normalizeConfig<TInput>(config: UserConfig<TInput> | Array<UserConfig<TInput>>): UserConfig<TInput> | Array<UserConfig<TInput>> {
  if (Array.isArray(config)) {
    return config.map(applyDefaults)
  }

  return applyDefaults(config)
}

/**
 * Defines a Kubb build configuration and fills in defaults for any omitted fields.
 *
 * Defaults applied when omitted:
 * - `adapter` → `adapterOas()` (OpenAPI 2.0/3.0/3.1).
 * - `parsers` → `[parserTs(), parserTsx(), parserMd()]`.
 * - `reporters` → `[cliReporter, jsonReporter, fileReporter, htmlReporter]`.
 * - `plugins` → `pluginBarrel()` is appended when not already present.
 * - `output.barrel` → `false` when not set.
 * - `output.format` and `output.lint` → `false`.
 *
 * Accepts a config object, an array of configs, a Promise resolving to one,
 * or a function that receives the parsed CLI options and returns any of the
 * above. The return type is preserved so async/array variants stay typed.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [pluginTs()],
 * })
 * ```
 *
 * @example Function form with CLI options
 * ```ts
 * import { defineConfig } from 'kubb'
 *
 * export default defineConfig(({ input }) => ({
 *   input: input ?? './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [],
 * }))
 * ```
 */
export function defineConfig<TConfig extends ConfigInput>(config: TConfig): DefinedConfig<TConfig> {
  if (typeof config === 'function') {
    return (async (cli: CLIOptions) => {
      return normalizeConfig(await config(cli))
    }) as DefinedConfig<TConfig>
  }

  if (config instanceof Promise) {
    return config.then(normalizeConfig) as DefinedConfig<TConfig>
  }

  return normalizeConfig(config) as DefinedConfig<TConfig>
}
