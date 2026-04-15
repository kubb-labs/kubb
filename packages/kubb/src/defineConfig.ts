import { isPromise, type PossiblePromise } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import type { Adapter, Config, HookStylePlugin, InputData, InputPath, Parser, PluginFactoryOptions, UserPlugin } from '@kubb/core'
import { parserTs, parserTsx } from '@kubb/parser-ts'

type Input = InputPath | InputData
type UnknownUserPlugin = UserPlugin<PluginFactoryOptions<string, object, object, unknown, object>>

/**
 * Partial version of {@link Config} intended for use in `kubb.config.ts`.
 *
 * Fields that have sensible defaults (`root`, `plugins`, `parsers`, `adapter`) are optional.
 */
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter'> & {
  /**
   * The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.
   * @default process.cwd()
   */
  root?: string
  /**
   * An array of parsers used to convert generated files to strings.
   * Each parser handles specific file extensions (e.g. `.ts`, `.tsx`).
   *
   * A catch-all fallback parser is always appended last for any unhandled extension.
   *
   * When omitted, `parserTsx` from `@kubb/parser-ts` is used automatically as the
   * default (requires `@kubb/parser-ts` to be installed as an optional dependency).
   * @default [parserTsx] — from `@kubb/parser-ts`
   */
  parsers?: Array<Parser>
  /**
   * Adapter that converts the input file into a `@kubb/ast` `InputNode` — the universal
   * intermediate representation consumed by all Kubb plugins.
   *
   * When omitted, `adapterOas()` from `@kubb/adapter-oas` is used automatically as the
   * default (requires `@kubb/adapter-oas` to be installed as an optional dependency).
   *
   * @default adapterOas() — from `@kubb/adapter-oas`
   */
  adapter?: Adapter
  /**
   * An array of Kubb plugins used for code generation.
   * Each plugin may declare additional configurable options.
   * If a plugin depends on another, an error is thrown when the dependency is missing.
   * Use `dependencies` on the plugin to declare execution order.
   */
  // inject needs to be omitted because else we have a clash with the PluginDriver instance
  plugins?: Array<Omit<UnknownUserPlugin, 'inject'> | HookStylePlugin>
}

/**
 * CLI options derived from command-line flags.
 */
export type CLIOptions = {
  /**
   * Path to `kubb.config.js`.
   */
  config?: string
  /**
   * Enable watch mode for input files.
   */
  watch?: boolean
  /**
   * Logging verbosity for CLI usage.
   *
   * - `silent`: hide non-essential logs
   * - `info`: show general logs (non-plugin-related)
   * - `debug`: include detailed plugin lifecycle logs
   * @default 'silent'
   */
  logLevel?: 'silent' | 'info' | 'debug'
}

/**
 * All accepted forms of a Kubb configuration.
 */
export type ConfigInput = PossiblePromise<UserConfig | UserConfig[]> | ((cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>)

/**
 * Applies default adapter and parsers to a single user config when not set.
 *
 * - `adapter` defaults to `adapterOas()`
 * - `parsers` defaults to `[parserTs, parserTsx]`
 */
function applyDefaults(config: UserConfig): UserConfig {
  return {
    ...config,
    adapter: config.adapter ?? adapterOas(),
    parsers: config.parsers?.length ? config.parsers : [parserTs, parserTsx],
  }
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
export function defineConfig(config: (cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>): (cli: CLIOptions) => Promise<UserConfig | UserConfig[]>
export function defineConfig(config: Promise<UserConfig | UserConfig[]>): Promise<UserConfig | UserConfig[]>
export function defineConfig(config: UserConfig | UserConfig[]): UserConfig | UserConfig[]
export function defineConfig(config: ConfigInput): ConfigInput {
  if (typeof config === 'function') {
    return async (cli: CLIOptions) => {
      const resolved = await config(cli)
      const configs = Array.isArray(resolved) ? resolved : [resolved]
      const result = configs.map(applyDefaults)

      return result.length === 1 ? result[0]! : result
    }
  }

  if (isPromise(config)) {
    return config.then((resolved) => {
      const configs = Array.isArray(resolved) ? resolved : [resolved]
      const result = configs.map(applyDefaults)

      return result.length === 1 ? result[0]! : result
    })
  }

  const configs = Array.isArray(config) ? config : [config]
  const result = configs.map(applyDefaults)

  return result.length === 1 ? result[0]! : result
}
