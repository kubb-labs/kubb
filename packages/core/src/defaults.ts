import type { Adapter, Parser } from './types.ts'

// Use globalThis as the backing store so that all instances of @kubb/core
// (e.g. the one loaded by jiti inside config files AND the one used by the
// CLI at runtime) share a single registry, even across module cache boundaries.
const g = globalThis as typeof globalThis & {
  __kubbDefaultAdapter?: Adapter
  __kubbDefaultParsers?: Parser[]
}

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
  g.__kubbDefaultAdapter = adapter
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
  g.__kubbDefaultParsers = parsers
}

/** Returns the registered default adapter, or `undefined` if none registered. */
export function getDefaultAdapter(): Adapter | undefined {
  return g.__kubbDefaultAdapter
}

/** Returns the registered default parsers, or `undefined` if none registered. */
export function getDefaultParsers(): Parser[] | undefined {
  return g.__kubbDefaultParsers
}
