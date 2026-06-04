/**
 * Name of the JavaScript runtime executing the current process.
 */
export type RuntimeName = 'bun' | 'deno' | 'node'

/**
 * Returns `true` when the current process is running under Bun.
 *
 * Detection keys off the global `Bun` object rather than `process.versions`,
 * because Bun polyfills `process.versions.node` for Node compatibility and would
 * otherwise look like Node.
 *
 * @example
 * ```ts
 * if (isBun()) {
 *   await Bun.write(path, data)
 * }
 * ```
 */
export function isBun(): boolean {
  return typeof Bun !== 'undefined'
}

/**
 * Returns `true` when the current process is running under Deno.
 */
export function isDeno(): boolean {
  return typeof (globalThis as { Deno?: unknown }).Deno !== 'undefined'
}

/**
 * Returns `true` when the current process is running under Node.
 *
 * Bun and Deno are excluded first so a polyfilled `process` does not register as Node.
 */
export function isNode(): boolean {
  return !isBun() && !isDeno() && typeof process !== 'undefined' && process.versions?.node != null
}

/**
 * Returns the name of the runtime executing the current process.
 *
 * @example
 * ```ts
 * getRuntimeName() // 'bun' when run with `bun kubb`, 'node' otherwise
 * ```
 */
export function getRuntimeName(): RuntimeName {
  if (isBun()) return 'bun'
  if (isDeno()) return 'deno'
  return 'node'
}

/**
 * Returns the version of the active runtime, or an empty string when it cannot be read.
 *
 * @example
 * ```ts
 * getRuntimeVersion() // '1.3.11' under Bun, '22.22.2' under Node
 * ```
 */
export function getRuntimeVersion(): string {
  if (isBun()) return process.versions.bun ?? ''
  if (isDeno()) return (globalThis as { Deno?: { version?: { deno?: string } } }).Deno?.version?.deno ?? ''
  return process.versions?.node ?? ''
}
