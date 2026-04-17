import { isPromise, type PossiblePromise } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import type { CLIOptions, UserConfig } from '@kubb/core'
import { parserTs, parserTsx } from '@kubb/parser-ts'

type ConfigValue<TInput> = UserConfig<TInput>
type ConfigArray<TInput> = Array<ConfigValue<TInput>>
type ConfigResult<TInput> = ConfigValue<TInput> | ConfigArray<TInput>
type ConfigPromise<TInput> = Promise<ConfigResult<TInput>>
type ConfigFactory<TInput> = (cli: CLIOptions) => PossiblePromise<ConfigResult<TInput>>
type DefinedConfig<TInput> = ConfigResult<TInput> | ConfigPromise<TInput> | ((cli: CLIOptions) => Promise<ConfigResult<TInput>>)

/**
 * Applies default adapter and parsers to a single user config when not set.
 *
 * - `adapter` defaults to `adapterOas()`
 * - `parsers` defaults to `[parserTs, parserTsx]`
 */
function applyDefaults<TInput>(config: UserConfig<TInput>): UserConfig<TInput> {
  return {
    ...config,
    adapter: config.adapter ?? adapterOas(),
    parsers: config.parsers?.length ? config.parsers : [parserTs, parserTsx],
  }
}

function normalizeConfig<TInput>(config: UserConfig<TInput> | Array<UserConfig<TInput>>): UserConfig<TInput> | Array<UserConfig<TInput>> {
  if (Array.isArray(config)) {
    return config.map(applyDefaults)
  }

  return applyDefaults(config)
}

/**
 * Helper for defining a Kubb configuration with built-in defaults.
 *
 * When no `adapter` is provided, `adapterOas()` is used automatically.
 * When no `parsers` are provided, `[parserTsx]` is used automatically.
 *
 * Accepts either:
 * - A config object or array of configs
 * - A function returning the config(s), optionally async,
 *   receiving the CLI options as argument
 *
 * @example
 * export default defineConfig(({ logLevel }) => ({
 *   root: 'src',
 *   plugins: [myPlugin()],
 * }))
 */
export function defineConfig<TInput>(config: (cli: CLIOptions) => PossiblePromise<UserConfig<TInput>>): (cli: CLIOptions) => Promise<UserConfig<TInput>>
export function defineConfig<TInput>(
  config: (cli: CLIOptions) => PossiblePromise<Array<UserConfig<TInput>>>,
): (cli: CLIOptions) => Promise<Array<UserConfig<TInput>>>
export function defineConfig<TInput>(config: Promise<UserConfig<TInput>>): Promise<UserConfig<TInput>>
export function defineConfig<TInput>(config: Promise<Array<UserConfig<TInput>>>): Promise<Array<UserConfig<TInput>>>
export function defineConfig<TInput>(config: UserConfig<TInput>): UserConfig<TInput>
export function defineConfig<TInput>(config: Array<UserConfig<TInput>>): Array<UserConfig<TInput>>
export function defineConfig<TInput>(config: ConfigFactory<TInput>): (cli: CLIOptions) => Promise<ConfigResult<TInput>>
export function defineConfig<TInput>(config: ConfigResult<TInput> | ConfigPromise<TInput> | ConfigFactory<TInput>): DefinedConfig<TInput> {
  if (typeof config === 'function') {
    return async (cli: CLIOptions) => {
      return normalizeConfig(await config(cli))
    }
  }

  if (isPromise(config)) {
    return config.then((resolved) => normalizeConfig(resolved))
  }

  return normalizeConfig(config)
}
