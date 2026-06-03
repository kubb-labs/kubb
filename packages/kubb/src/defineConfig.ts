import { isPromise, type PossiblePromise } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import type { CLIOptions, UserConfig } from '@kubb/core'
import { middlewareBarrel, middlewareBarrelName } from '@kubb/middleware-barrel'
import { middlewareLogger } from '@kubb/middleware-logger'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { parserMd } from '@kubb/parser-md'

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
 * Applies default `root`, adapter, parsers, middleware, logger, `output.barrel`, `output.format`, and `output.lint` to a single user config when not set.
 *
 * - `root` defaults to `process.cwd()`
 * - `adapter` defaults to `adapterOas()`
 * - `parsers` defaults to `[parserTs, parserTsx, parserMd]`
 * - `middleware` defaults to `[middlewareBarrel()]`
 * - `logger` defaults to `middlewareLogger`
 * - `output.barrel` defaults to `{ type: 'named' }` **only when `middlewareBarrel` is part of `middleware`**.
 *   When the user provides a custom middleware list without `middlewareBarrel`, `barrel` is left untouched.
 * - `output.format` defaults to `false`
 * - `output.lint` defaults to `false`
 */
function applyDefaults<TInput>(config: UserConfig<TInput>): UserConfig<TInput> {
  const middleware = config.middleware?.length ? config.middleware : [middlewareBarrel()]
  const hasBarrelMiddleware = middleware.some((m) => m.name === middlewareBarrelName)

  const output = { ...config.output }
  if (hasBarrelMiddleware && output.barrel === undefined) {
    output.barrel = { type: 'named' }
  }
  if (output.format === undefined) {
    output.format = false
  }
  if (output.lint === undefined) {
    output.lint = false
  }

  return {
    ...config,
    root: config.root || process.cwd(),
    adapter: config.adapter ?? adapterOas(),
    parsers: config.parsers?.length ? config.parsers : [parserTs, parserTsx, parserMd],
    middleware,
    logger: config.logger ?? middlewareLogger,
    output,
  }
}

function normalizeConfig<TInput>(config: UserConfig<TInput> | Array<UserConfig<TInput>>): UserConfig<TInput> | Array<UserConfig<TInput>> {
  if (Array.isArray(config)) {
    return config.map(applyDefaults)
  }

  return applyDefaults(config)
}

/**
 * Defines a Kubb build configuration and applies sensible defaults so the
 * minimal config stays small.
 *
 * Defaults applied when omitted:
 * - `adapter` → `adapterOas()` (OpenAPI 2.0/3.0/3.1).
 * - `parsers` → `[parserTs, parserTsx, parserMd]`.
 * - `middleware` → `[middlewareBarrel()]`.
 * - `output.barrel` → `{ type: 'named' }` only when `middlewareBarrel` is
 *   in the middleware list.
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
 *   input: { path: './petStore.yaml' },
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
 *   input: { path: input ?? './petStore.yaml' },
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

  if (isPromise(config)) {
    return config.then((resolved) => normalizeConfig(resolved)) as DefinedConfig<TConfig>
  }

  return normalizeConfig(config) as DefinedConfig<TConfig>
}
