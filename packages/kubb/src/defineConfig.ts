import type { PossiblePromise } from '@internals/utils'
import type { CLIOptions, UserConfig } from '@kubb/core'
import { applyDefaults } from 'unplugin-kubb'

type ConfigResult<TInput> = UserConfig<TInput> | Array<UserConfig<TInput>>
type ConfigFunction<TInput, TResult extends ConfigResult<TInput>> = (cli: CLIOptions) => PossiblePromise<TResult>

function normalizeConfig<TInput>(config: ConfigResult<TInput>): ConfigResult<TInput> {
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
 * Each shape has its own overload so TypeScript checks the config against
 * `UserConfig` directly and reports unknown keys such as a misspelled `output.clean`.
 * The function overloads come first: TypeScript caches the callback's return type after
 * the first overload it tries, so an object overload before them would widen literals
 * such as `barrel: { type: 'named' }` to `string`.
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
export function defineConfig<TInput>(config: ConfigFunction<TInput, UserConfig<TInput>>): (cli: CLIOptions) => Promise<UserConfig<TInput>>
export function defineConfig<TInput>(config: ConfigFunction<TInput, Array<UserConfig<TInput>>>): (cli: CLIOptions) => Promise<Array<UserConfig<TInput>>>
export function defineConfig<TInput>(config: Promise<UserConfig<TInput>>): Promise<UserConfig<TInput>>
export function defineConfig<TInput>(config: Promise<Array<UserConfig<TInput>>>): Promise<Array<UserConfig<TInput>>>
export function defineConfig<TInput>(config: Array<UserConfig<TInput>>): Array<UserConfig<TInput>>
export function defineConfig<TInput>(config: UserConfig<TInput>): UserConfig<TInput>
export function defineConfig<TInput>(
  config: ConfigResult<TInput> | Promise<ConfigResult<TInput>> | ConfigFunction<TInput, ConfigResult<TInput>>,
): ConfigResult<TInput> | Promise<ConfigResult<TInput>> | ((cli: CLIOptions) => Promise<ConfigResult<TInput>>) {
  if (typeof config === 'function') {
    return async (cli: CLIOptions) => normalizeConfig(await config(cli))
  }

  if (config instanceof Promise) {
    return config.then(normalizeConfig)
  }

  return normalizeConfig(config)
}
