import { readFile } from 'node:fs/promises'
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
 * Plain JavaScript files. jiti hands these to Node's native `import()`, whose module cache never
 * lets go of a file, so `moduleCache: false` alone would keep returning the first version of it.
 */
const JAVASCRIPT_EXTENSION = /\.[cm]?jsx?$/

/**
 * Per-call options for {@link ModuleLoader.load}.
 */
type LoadModuleOptions = {
  /**
   * Return the module's default export instead of the full namespace.
   */
  default?: boolean
}

/**
 * Loads `.ts`/`.js` modules via jiti.
 */
type ModuleLoader = {
  load<T = unknown>(filePath: string, options?: LoadModuleOptions): Promise<T>
}

/**
 * Creates a jiti-based loader for Kubb's TypeScript and JavaScript config modules.
 *
 * jiti transpiles TypeScript and the `@kubb/renderer-jsx` JSX runtime on the fly. Every load
 * re-evaluates the file, so a config edited on disk is picked up by the next load.
 *
 * @example
 * ```ts
 * const config = await createModuleLoader().load('/abs/kubb.config.ts', { default: true })
 * ```
 */
export function createModuleLoader(): ModuleLoader {
  const jiti = createJiti(import.meta.url, JITI_OPTIONS)

  return {
    async load<T>(filePath: string, options?: LoadModuleOptions) {
      if (!JAVASCRIPT_EXTENSION.test(filePath)) {
        return (options?.default ? jiti.import(filePath, { default: true }) : jiti.import(filePath)) as Promise<T>
      }

      // Transpiled through jiti instead, so every load re-evaluates the file as it is on disk now.
      // A TypeScript file it imports reloads too. A plain JavaScript file it imports still goes
      // through Node's `import()` and stays cached until the process restarts.
      const mod = (await jiti.evalModule(await readFile(filePath, 'utf8'), { filename: filePath, async: true, forceTranspile: true })) as
        | { default?: unknown }
        | undefined
      return (options?.default ? (mod?.default ?? mod) : mod) as T
    },
  }
}
