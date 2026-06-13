import { pathToFileURL } from 'node:url'
import { runtime } from '@internals/utils'
import { createJiti } from 'jiti'

/**
 * jiti options for loading Kubb config modules: the automatic JSX runtime pointed at
 * `@kubb/renderer-jsx`, and `moduleCache` off so a re-load re-evaluates the file.
 */
const JITI_OPTIONS = {
  jsx: { runtime: 'automatic', importSource: '@kubb/renderer-jsx' },
  moduleCache: false,
} satisfies Parameters<typeof createJiti>[1]

/**
 * Per-call options for {@link ModuleLoader.load}.
 */
export type LoadModuleOptions = {
  /**
   * Return the module's default export instead of the full namespace.
   */
  default?: boolean
  /**
   * Cache-bust token appended to the import URL on the native path so a repeated load re-evaluates
   * the file instead of returning the URL-cached module. Use a file's mtime in watch mode. Ignored
   * on the jiti path, which already re-evaluates because `moduleCache` is off.
   */
  bust?: string | number
}

/**
 * Loads `.ts`/`.js` modules with a runtime-aware strategy.
 */
export type ModuleLoader = {
  load<T = unknown>(filePath: string, options?: LoadModuleOptions): Promise<T>
}

/**
 * Creates a runtime-aware loader for Kubb's TypeScript and JavaScript config modules.
 *
 * On Bun and Deno it imports the file natively, skipping jiti's transform step, and falls back to
 * jiti only when the native import throws. On Node it always uses jiti, which transpiles TypeScript
 * and the `@kubb/renderer-jsx` JSX runtime on the fly. The jiti instance is created lazily, so the
 * Bun/Deno happy path never pays for it.
 *
 * @example
 * ```ts
 * const config = await createModuleLoader().load('/abs/kubb.config.ts', { default: true })
 * ```
 */
export function createModuleLoader(): ModuleLoader {
  let jiti: ReturnType<typeof createJiti> | undefined
  const getJiti = () => (jiti ??= createJiti(import.meta.url, JITI_OPTIONS))

  const viaJiti = <T>(filePath: string, options?: LoadModuleOptions) =>
    (options?.default ? getJiti().import(filePath, { default: true }) : getJiti().import(filePath)) as Promise<T>

  const viaNative = async <T>(filePath: string, options?: LoadModuleOptions): Promise<T> => {
    const href = pathToFileURL(filePath).href
    const url = options?.bust != null ? `${href}?t=${options.bust}` : href
    const mod = (await import(url)) as Record<string, unknown>
    return (options?.default ? (mod.default ?? mod) : mod) as T
  }

  return {
    async load(filePath, options) {
      if (runtime.isBun || runtime.isDeno) {
        try {
          return await viaNative(filePath, options)
        } catch {
          // A native import can trip over config-specific transforms (e.g. the @kubb/renderer-jsx
          // JSX runtime). Retry through jiti, which applies them and surfaces the real error if the
          // config itself is broken.
          return viaJiti(filePath, options)
        }
      }
      return viaJiti(filePath, options)
    },
  }
}
