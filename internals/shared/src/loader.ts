import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
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
 * Per-call options for {@link loadModule}.
 */
type LoadModuleOptions = {
  /**
   * Return the module's default export instead of the full namespace.
   */
  default?: boolean
}

const jiti = createJiti(import.meta.url, JITI_OPTIONS)

// Tries the runtime's own `import()` before transpiling. Node caches what it loads for the life
// of the process, so only the first load of a file uses it.
const nativeFirstJiti = createJiti(import.meta.url, { ...JITI_OPTIONS, tryNative: true })

const loadedFiles = new Set<string>()

async function isInEsmPackage(filePath: string): Promise<boolean> {
  for (let dir = dirname(filePath); ; dir = dirname(dir)) {
    const source = await readFile(join(dir, 'package.json'), 'utf8').catch(() => undefined)
    if (source !== undefined) return /"type"\s*:\s*"module"/.test(source)
    if (dirname(dir) === dir) return false
  }
}

// CommonJS stays on plain jiti: Node 22's `import()` of a CommonJS file that requires an ES module
// package fails, and jiti then transpiles the whole graph, which made `.cts` configs four times slower.
async function isEsModule(filePath: string): Promise<boolean> {
  if (/\.m[jt]s$/.test(filePath)) return true
  return /\.[jt]s$/.test(filePath) && isInEsmPackage(filePath)
}

/**
 * Loads a Kubb TypeScript or JavaScript config module via jiti.
 *
 * The first load of an ES module tries the runtime's own `import()`, and jiti transpiles TypeScript
 * and the `@kubb/renderer-jsx` JSX runtime only when that fails. Every later load re-evaluates the file
 * through jiti, so a config edited on disk is picked up by the next load.
 *
 * @example
 * ```ts
 * const config = await loadModule('/abs/kubb.config.ts', { default: true })
 * ```
 */
export async function loadModule<T = unknown>(filePath: string, options?: LoadModuleOptions): Promise<T> {
  const isFirstLoad = !loadedFiles.has(filePath)
  loadedFiles.add(filePath)

  if (isFirstLoad && (await isEsModule(filePath))) {
    return (options?.default ? nativeFirstJiti.import(filePath, { default: true }) : nativeFirstJiti.import(filePath)) as Promise<T>
  }

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
}
