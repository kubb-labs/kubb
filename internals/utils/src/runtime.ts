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
export const runtime = { isBun, ...detect() } as const

function detect(): { name: 'bun' | 'deno' | 'node'; version: string } {
  if (isBun) return { name: 'bun', version: process.versions.bun ?? '' }
  if (isDeno) return { name: 'deno', version: (globalThis as { Deno?: { version?: { deno?: string } } }).Deno?.version?.deno ?? '' }
  return { name: 'node', version: process.versions?.node ?? '' }
}
