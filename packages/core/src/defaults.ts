import type { Adapter, Parser } from './types.ts'

let _defaultAdapter: Adapter | undefined
let _defaultParsers: Parser[] | undefined

/**
 * Register the default adapter used when no adapter is provided in the user
 * config. Called by higher-level packages (e.g. `kubb`) so that `@kubb/core`
 * itself does not need a (circular) build dependency on `@kubb/adapter-oas`.
 *
 * @example
 * ```ts
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { setDefaultAdapter } from '@kubb/core'
 * setDefaultAdapter(adapterOas())
 * ```
 */
export function setDefaultAdapter(adapter: Adapter): void {
  _defaultAdapter = adapter
}

/**
 * Register the default parsers used when no parsers are provided in the user
 * config. Called by higher-level packages (e.g. `kubb`) so that `@kubb/core`
 * itself does not need a (circular) build dependency on `@kubb/parser-ts`.
 *
 * @example
 * ```ts
 * import { parserTs } from '@kubb/parser-ts'
 * import { setDefaultParsers } from '@kubb/core'
 * setDefaultParsers([parserTs])
 * ```
 */
export function setDefaultParsers(parsers: Parser[]): void {
  _defaultParsers = parsers
}

/** Returns the registered default adapter, or `undefined` if none registered. */
export function getDefaultAdapter(): Adapter | undefined {
  return _defaultAdapter
}

/** Returns the registered default parsers, or `undefined` if none registered. */
export function getDefaultParsers(): Parser[] | undefined {
  return _defaultParsers
}
