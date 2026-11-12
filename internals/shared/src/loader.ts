import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, extname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { runtime } from '@internals/utils'
import type { Jiti, JitiOptions } from 'jiti'

/**
 * jiti options for loading Kubb config modules: the automatic JSX runtime pointed at
 * `@kubb/renderer-jsx`, and `moduleCache` off so a re-load re-evaluates the file.
 */
const JITI_OPTIONS = {
  jsx: { runtime: 'automatic', importSource: '@kubb/renderer-jsx' },
  moduleCache: false,
} satisfies JitiOptions

/**
 * Plain JavaScript files. jiti hands these to Node's native `import()`, whose module cache never
 * lets go of a file, so `moduleCache: false` alone would keep returning the first version of it.
 */
const JAVASCRIPT_EXTENSION = /\.[cm]?jsx?$/

/**
 * Extensions the runtime's own loader may load, with the module format the extension fixes. `.ts`
 * and `.js` take theirs from the nearest `package.json`. `.tsx` and `.jsx` always go through jiti.
 */
const NATIVE_EXTENSIONS: Record<string, { typescript: boolean; format?: 'esm' | 'commonjs' }> = {
  '.ts': { typescript: true },
  '.mts': { typescript: true, format: 'esm' },
  '.cts': { typescript: true, format: 'commonjs' },
  '.js': { typescript: false },
  '.mjs': { typescript: false, format: 'esm' },
  '.cjs': { typescript: false, format: 'commonjs' },
}

/**
 * CommonJS globals jiti provides in every file and Node leaves out of an ES module. An ES module
 * config that uses one goes straight to jiti.
 */
const COMMONJS_GLOBAL = /\b(?:__dirname|__filename|require\s*\(|module\.exports\b|exports\.)/

/**
 * A static `import` or `export` statement. jiti accepts one in a CommonJS file, Node does not.
 */
const ESM_SYNTAX = /^\s*(?:import\b(?!\s*[.(])|export\b)/m

/**
 * Node's messages for a file written in the other module format than Node reads it as: a CommonJS
 * global in an ES module, or an `import` or `export` statement in a CommonJS file. Both are for
 * a file the config imports, whose source is not checked up front.
 */
const MODULE_FORMAT_ERROR = /is not defined in ES module scope|^Cannot use import statement outside a module|^Unexpected token 'export'/

/**
 * Error codes Node sets when it cannot resolve or parse a module, as opposed to an error the
 * module's own code throws. jiti resolves and transpiles more than Node does, so these fall back.
 */
const LOAD_ERROR_CODES = new Set([
  'ERR_MODULE_NOT_FOUND',
  'MODULE_NOT_FOUND',
  'ERR_UNKNOWN_FILE_EXTENSION',
  'ERR_UNSUPPORTED_DIR_IMPORT',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
  'ERR_PACKAGE_IMPORT_NOT_DEFINED',
  'ERR_IMPORT_ATTRIBUTE_MISSING',
  'ERR_REQUIRE_ESM',
  'ERR_REQUIRE_ASYNC_MODULE',
  'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX',
  'ERR_INVALID_TYPESCRIPT_SYNTAX',
  'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING',
  'ERR_VM_MODULE_LINK_FAILURE',
])

/**
 * Global registry of the native loads whose module graph started evaluating. A global, because
 * the marker module that writes to it is a `data:` URL and shares no scope with this file.
 */
const EVALUATING = Symbol.for('kubb.loader.evaluating')

/**
 * Files this process loaded before. Node's `import()` caches a module, and every module it
 * imports, for the life of the process, so only the first load of a file may use it.
 */
const loadedFiles = new Set<string>()

/**
 * Per-call options for {@link loadModule}.
 */
type LoadModuleOptions = {
  /**
   * Return the module's default export instead of the full namespace.
   */
  default?: boolean
}

let jiti: Promise<Jiti> | undefined

// Loaded on first use: a config Node imports by itself never pays for jiti.
function getJiti(): Promise<Jiti> {
  jiti ??= import('jiti').then(({ createJiti }) => createJiti(import.meta.url, JITI_OPTIONS))
  return jiti
}

function evaluating(): Set<string> {
  const store = globalThis as { [EVALUATING]?: Set<string> }
  store[EVALUATING] ??= new Set()
  return store[EVALUATING]
}

/**
 * Whether the nearest `package.json` above `filePath` sets `"type": "module"`.
 */
async function isInEsmPackage(filePath: string): Promise<boolean> {
  for (let dir = dirname(filePath); ; dir = dirname(dir)) {
    const source = await readFile(join(dir, 'package.json'), 'utf8').catch(() => undefined)
    if (source !== undefined) {
      try {
        return (JSON.parse(source) as { type?: string } | null)?.type === 'module'
      } catch {
        return false
      }
    }
    if (dirname(dir) === dir) return false
  }
}

/**
 * How the runtime loads `filePath` by itself, or `undefined` to send the file to jiti.
 *
 * - Bun loads TypeScript, CommonJS, enums, extensionless imports and tsconfig `paths` itself.
 * - Under Node, the module format Node reads the file as, when the source matches it. An ES
 *   module must not use a CommonJS global. A CommonJS file must not use `import` or `export`
 *   statements: Node rejects them under `"type": "commonjs"`, and without a `type` it reparses
 *   the file as an ES module and prints a warning.
 */
async function nativeFormat(filePath: string): Promise<'bun' | 'esm' | 'commonjs' | undefined> {
  const extension = NATIVE_EXTENSIONS[extname(filePath)]
  if (!extension) return undefined
  if (runtime.isBun) return 'bun'
  if (runtime.name !== 'node') return undefined
  // Unset before Node strips types by default, and under `--no-strip-types`.
  if (extension.typescript && !process.features.typescript) return undefined

  const source = await readFile(filePath, 'utf8').catch(() => undefined)
  if (source === undefined) return undefined

  const format = extension.format ?? ((await isInEsmPackage(filePath)) ? 'esm' : 'commonjs')
  const matches = format === 'esm' ? !COMMONJS_GLOBAL.test(source) : !ESM_SYNTAX.test(source)
  return matches ? format : undefined
}

/**
 * Whether Node failed to load a module, so jiti should try: an error code Node sets for a module
 * it cannot resolve or parse, or a file written in the other module format.
 */
function isLoadError(error: unknown): boolean {
  if (LOAD_ERROR_CODES.has((error as { code?: string } | null)?.code ?? '')) return true
  return (error instanceof ReferenceError || error instanceof SyntaxError) && MODULE_FORMAT_ERROR.test(error.message)
}

/**
 * Imports the ES module `filePath` with Node's own `import()`. Returns `undefined` when Node
 * cannot load the file, so the caller falls back to jiti.
 *
 * Node resolves, parses and links a whole ES module graph before it evaluates any of it. The
 * import goes through a wrapper whose first dependency is a marker module, so a failure with the
 * marker unset happened before any code ran, and jiti takes over without running the config twice.
 * Once code ran, only a failure to load a module falls back, see {@link isLoadError}. Any other
 * error is the config's own and is rethrown as it is.
 */
async function importEsm(filePath: string): Promise<object | undefined> {
  const url = pathToFileURL(filePath).href
  const id = randomUUID()
  const marker = `data:text/javascript,${encodeURIComponent(`globalThis[Symbol.for(${JSON.stringify(EVALUATING.description)})].add(${JSON.stringify(id)})`)}`
  const wrapper = `data:text/javascript,${encodeURIComponent(`import ${JSON.stringify(marker)};import ${JSON.stringify(url)}`)}`
  const started = evaluating()

  try {
    await import(wrapper)
  } catch (error) {
    if (!started.has(id) || isLoadError(error)) return undefined
    throw error
  } finally {
    started.delete(id)
  }

  return (await import(url)) as object
}

/**
 * Loads the CommonJS file `filePath` with Node's own `require()`. `import()` of a CommonJS file
 * breaks on Node 22 when the file requires an ES module package (`ERR_VM_MODULE_LINK_FAILURE`),
 * which `@kubb/*` packages do.
 *
 * CommonJS resolves each `require()` while the file runs, so a failure to load a module is only
 * found after the config started. That one falls back to jiti, which runs the config again. Any
 * other error is the config's own and is rethrown as it is.
 */
function requireCommonJs(filePath: string): unknown {
  try {
    return createRequire(import.meta.url)(filePath)
  } catch (error) {
    if (isLoadError(error)) return undefined
    throw error
  }
}

/**
 * Loads `filePath` with the runtime's own loader. Returns `undefined` when it cannot, so the
 * caller falls back to jiti. Under Bun every error surfaces as it is: jiti tries Bun's own loader
 * first there too, and Bun already loads what jiti would transpile.
 */
async function importNative(filePath: string, format: 'bun' | 'esm' | 'commonjs'): Promise<unknown> {
  if (format === 'bun') return import(pathToFileURL(filePath).href)
  if (format === 'esm') return importEsm(filePath)
  return requireCommonJs(filePath)
}

async function importJiti(filePath: string, options?: LoadModuleOptions): Promise<unknown> {
  const jiti = await getJiti()

  if (!JAVASCRIPT_EXTENSION.test(filePath)) {
    return options?.default ? jiti.import(filePath, { default: true }) : jiti.import(filePath)
  }

  // Transpiled through jiti instead, so every load re-evaluates the file as it is on disk now.
  // A TypeScript file it imports reloads too. A plain JavaScript file it imports still goes
  // through Node's `import()` and stays cached until the process restarts.
  const mod = (await jiti.evalModule(await readFile(filePath, 'utf8'), { filename: filePath, async: true, forceTranspile: true })) as
    | { default?: unknown }
    | undefined
  return options?.default ? (mod?.default ?? mod) : mod
}

/**
 * Loads a Kubb TypeScript or JavaScript config module.
 *
 * The first load of a file in a process uses the runtime's own loader when it can read the file
 * by itself: under Node, `import()` for an ES module and `require()` for CommonJS, under Bun,
 * `import()`. The runtime caches what it loads for the
 * life of the process, so everything else goes through jiti, which transpiles TypeScript and the
 * `@kubb/renderer-jsx` JSX runtime on the fly: a file Node cannot load, and every later load of
 * the same file, so a config edited on disk, and a TypeScript file it imports, is picked up.
 *
 * @example
 * ```ts
 * const config = await loadModule('/abs/kubb.config.ts', { default: true })
 * ```
 */
export async function loadModule<T = unknown>(filePath: string, options?: LoadModuleOptions): Promise<T> {
  const isFirstLoad = !loadedFiles.has(filePath)
  loadedFiles.add(filePath)

  const format = isFirstLoad ? await nativeFormat(filePath) : undefined
  if (format) {
    const mod = (await importNative(filePath, format)) as { default?: unknown } | undefined
    if (mod !== undefined) return (options?.default ? (mod?.default ?? mod) : mod) as T
  }

  return (await importJiti(filePath, options)) as T
}
