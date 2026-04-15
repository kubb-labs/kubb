import type { PossiblePromise } from '@internals/utils'
import type { Adapter, CLIOptions, Config, HookStylePlugin, InputData, InputPath, Parser, PluginFactoryOptions, UserPlugin } from '@kubb/core'

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
 * All accepted forms of a Kubb configuration.
 */
export type ConfigInput = PossiblePromise<UserConfig | UserConfig[]> | ((cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>)
