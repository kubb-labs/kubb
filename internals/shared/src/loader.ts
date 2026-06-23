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
}

/**
 * Loads `.ts`/`.js` modules via jiti.
 */
export type ModuleLoader = {
  load<T = unknown>(filePath: string, options?: LoadModuleOptions): Promise<T>
}

/**
 * Creates a jiti-based loader for Kubb's TypeScript and JavaScript config modules.
 *
 * jiti transpiles TypeScript and the `@kubb/renderer-jsx` JSX runtime on the fly.
 *
 * @example
 * ```ts
 * const config = await createModuleLoader().load('/abs/kubb.config.ts', { default: true })
 * ```
 */
export function createModuleLoader(): ModuleLoader {
  const jiti= createJiti(import.meta.url, JITI_OPTIONS)

  return {
    load<T>(filePath: string, options?: LoadModuleOptions) {
      return (options?.default ? jiti.import(filePath, { default: true }) : jiti.import(filePath)) as Promise<T>
    },
  }
}
