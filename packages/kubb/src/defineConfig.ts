import * as nodeModule from 'node:module'
import { isPromise, type PossiblePromise } from '@internals/utils'
import type { CLIOptions, UserConfig } from '@kubb/core'
import { middlewareBarrel, middlewareBarrelName } from '@kubb/middleware-barrel'
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
type AdapterOasModule = typeof import('@kubb/adapter-oas')

function createPackageRequire() {
  return nodeModule.createRequire(new URL('../package.json', import.meta.url))
}

function resolveDefaultAdapter(require: NodeJS.Require = createPackageRequire()) {
  try {
    require.resolve('@kubb/adapter-oas')
  } catch {
    return undefined
  }

  const { adapterOas } = require('@kubb/adapter-oas') as AdapterOasModule

  return adapterOas()
}

/**
 * Applies default adapter, parsers, middleware, `output.barrel`, `output.format`, and `output.lint` to a single user config when not set.
 *
 * - `adapter` defaults to `adapterOas()` when `@kubb/adapter-oas` is installed
 * - `parsers` defaults to `[parserTs, parserTsx]`
 * - `middleware` defaults to `[middlewareBarrel()]`
 * - `output.barrel` defaults to `{ type: 'named' }` **only when `middlewareBarrel` is part of `middleware`**.
 *   When the user provides a custom middleware list without `middlewareBarrel`, `barrel` is left untouched.
 * - `output.format` defaults to `'auto'`
 * - `output.lint` defaults to `'auto'`
 */
export function applyDefaults<TInput>(config: UserConfig<TInput>, require: NodeJS.Require = createPackageRequire()): UserConfig<TInput> {
  const middleware = config.middleware?.length ? config.middleware : [middlewareBarrel()]
  const hasBarrelMiddleware = middleware.some((m) => m.name === middlewareBarrelName)
  const adapter = config.adapter ?? resolveDefaultAdapter(require)

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
  if (config.input && !adapter) {
    throw new Error('The @kubb/adapter-oas package is not installed. Install it to use the default adapter or set `adapter` explicitly.')
  }

  return {
    ...config,
    adapter,
    parsers: config.parsers?.length ? config.parsers : [parserTs, parserTsx],
    middleware,
    output,
  }
}

function normalizeConfig<TInput>(config: UserConfig<TInput> | Array<UserConfig<TInput>>): UserConfig<TInput> | Array<UserConfig<TInput>> {
  if (Array.isArray(config)) {
    return config.map((item) => applyDefaults(item))
  }

  return applyDefaults(config)
}

/**
 * Helper for defining a Kubb configuration with built-in defaults.
 *
 * When no `adapter` is provided, `adapterOas()` is used automatically when `@kubb/adapter-oas` is installed.
 * When no `parsers` are provided, `[parserTs, parserTsx]` is used automatically.
 *
 * Accepts either:
 * - A config object or array of configs
 * - A function returning the config(s), optionally async,
 *   receiving the CLI options as argument
 *
 * @example
 * ```ts
 * export default defineConfig(({ logLevel }) => ({
 *   root: 'src',
 *   plugins: [myPlugin()],
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
