import { isPromise, type PossiblePromise } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import type { CLIOptions, UserConfig } from '@kubb/core'
import { parserTs, parserTsx } from '@kubb/parser-ts'

type AnyConfigResult = UserConfig<any> | Array<UserConfig<any>>
type ConfigInput = AnyConfigResult | Promise<AnyConfigResult> | ((cli: CLIOptions) => PossiblePromise<AnyConfigResult>)
type NormalizeConfig<TConfig> =
  TConfig extends Array<UserConfig<infer TInput>> ? Array<UserConfig<TInput>> : TConfig extends UserConfig<infer TInput> ? UserConfig<TInput> : never
type DefinedConfig<TConfig extends ConfigInput> = TConfig extends (cli: CLIOptions) => PossiblePromise<infer TResult>
  ? (cli: CLIOptions) => Promise<NormalizeConfig<TResult>>
  : TConfig extends Promise<infer TResult>
    ? Promise<NormalizeConfig<TResult>>
    : NormalizeConfig<TConfig>

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
export function defineConfig<TConfig extends ConfigInput>(config: TConfig): DefinedConfig<TConfig> {
  if (typeof config === 'function') {
    return (async (cli: CLIOptions) => {
      return normalizeConfig(await config(cli))
    }) as DefinedConfig<TConfig>
  }

  if (isPromise(config)) {
    return config.then((resolved) => normalizeConfig(resolved)) as DefinedConfig<TConfig>
  }

  return normalizeConfig(config) as DefinedConfig<TConfig>
}
