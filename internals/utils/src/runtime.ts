// Bun polyfills `process.versions.node`, so detection keys off the globals instead.
const isBun = typeof Bun !== 'undefined'
const isDeno = 'Deno' in globalThis

/**
 * The JavaScript runtime executing the current process: its name, version and whether it is Bun.
 *
 * @example
 * ```ts
 * runtime.name // 'bun' when run with `bun kubb`, 'node' otherwise
 * ```
 */
export const runtime = {
  isBun,
  name: isBun ? 'bun' : isDeno ? 'deno' : 'node',
  version: isBun
    ? (process.versions.bun ?? '')
    : isDeno
      ? ((globalThis as { Deno?: { version?: { deno?: string } } }).Deno?.version?.deno ?? '')
      : (process.versions?.node ?? ''),
} as const
