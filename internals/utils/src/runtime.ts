/**
 * Name of the JavaScript runtime executing the current process.
 */
export type RuntimeName = 'bun' | 'deno' | 'node'

/**
 * Detects the JavaScript runtime executing the current process and exposes its name and version.
 *
 * Prefer the shared {@link runtime} instance over constructing your own.
 */
class Runtime {
  /**
   * `true` when the current process is running under Bun.
   *
   * Detection keys off the global `Bun` object rather than `process.versions`,
   * because Bun polyfills `process.versions.node` for Node compatibility and would
   * otherwise look like Node.
   *
   * @example
   * ```ts
   * if (runtime.isBun) {
   *   await Bun.write(path, data)
   * }
   * ```
   */
  get isBun(): boolean {
    return typeof Bun !== 'undefined'
  }

  /**
   * `true` when the current process is running under Deno.
   */
  get isDeno(): boolean {
    return typeof (globalThis as { Deno?: unknown }).Deno !== 'undefined'
  }

  /**
   * `true` when the current process is running under Node.
   *
   * Bun and Deno are excluded first so a polyfilled `process` does not register as Node.
   */
  get isNode(): boolean {
    return !this.isBun && !this.isDeno && typeof process !== 'undefined' && process.versions?.node != null
  }

  /**
   * Name of the runtime executing the current process.
   *
   * @example
   * ```ts
   * runtime.name // 'bun' when run with `bun kubb`, 'node' otherwise
   * ```
   */
  get name(): RuntimeName {
    if (this.isBun) return 'bun'
    if (this.isDeno) return 'deno'
    return 'node'
  }

  /**
   * Version of the active runtime, or an empty string when it cannot be read.
   *
   * @example
   * ```ts
   * runtime.version // '1.3.11' under Bun, '22.22.2' under Node
   * ```
   */
  get version(): string {
    if (this.isBun) return process.versions.bun ?? ''
    if (this.isDeno) return (globalThis as { Deno?: { version?: { deno?: string } } }).Deno?.version?.deno ?? ''
    return process.versions?.node ?? ''
  }
}

/**
 * Shared {@link Runtime} instance describing the JavaScript runtime executing the current process.
 */
export const runtime = new Runtime()
