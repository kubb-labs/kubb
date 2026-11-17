// TypeScript-facing side of the Rust core. Plugins, generators and config stay as they are:
// this only swaps the two stages that never call back into plugin code.
import { createRequire } from 'node:module'

const native = createRequire(import.meta.url)('./core_rs.node')

/** Reads and parses a YAML or JSON spec in Rust. Pass the result as `input`. */
export function loadSpec(path) {
  return JSON.parse(native.loadSpec(path))
}

const NATIVE_PARSERS = new Set(['typescript', 'tsx'])

function mergeFile(a, b) {
  return {
    ...a,
    banner: b.banner,
    footer: b.footer,
    copy: b.copy ?? a.copy,
    sources: [...a.sources, ...b.sources],
    imports: [...a.imports, ...b.imports],
    exports: [...a.exports, ...b.exports],
  }
}

/** The fields plugins read off a file, without the import pruning that Rust does at write time. */
function toFile(file) {
  if (file.kind === 'File') return file
  const dot = file.baseName.lastIndexOf('.')
  if (dot <= 0) throw new Error(`No extname found for ${file.baseName}`)
  return {
    ...file,
    kind: 'File',
    name: file.baseName.slice(0, dot),
    extname: file.baseName.slice(dot),
    sources: file.sources ?? [],
    imports: file.imports ?? [],
    exports: file.exports ?? [],
    meta: file.meta ?? {},
  }
}

const isIndexPath = (path) => path.endsWith('/index.ts') || path === 'index.ts'
const compareFiles = (a, b) => a.path.length - b.path.length || Number(isIndexPath(a.path)) - Number(isIndexPath(b.path))

/**
 * Drop-in for `driver.fileManager`. Files stay raw in JS, so plugins and hooks still read them;
 * deduping imports, printing and writing happen in one Rust call at the end of the build.
 *
 * shortcut: files in JS keep unpruned imports and no `id`; `kubb:file:processed`, per-file progress
 * and the output manifest are skipped on the Rust path. Move the store itself into Rust to close that.
 */
export class NativeFileManager {
  #cache = new Map()
  #sorted = null
  #fallback

  /** @param fallback the driver's own `FileManager`, used for files Rust does not print (copies, markdown, JSON). */
  constructor(fallback) {
    this.#fallback = fallback
  }

  #store(files, mergeExisting) {
    const batch = new Set()
    const resolved = files.map((file) => {
      const existing = this.#cache.get(file.path)
      const merged = toFile(existing && (mergeExisting || batch.has(file.path)) ? mergeFile(existing, file) : file)
      this.#cache.set(merged.path, merged)
      batch.add(merged.path)
      return merged
    })
    if (resolved.length) this.#sorted = null
    return resolved
  }

  add(...files) {
    return this.#store(files, false)
  }

  upsert(...files) {
    return this.#store(files, true)
  }

  async dispatch({ result, renderer, pointer }) {
    if (!result) return
    let files = result
    let instance
    if (!Array.isArray(result)) {
      if (!renderer) return
      instance = renderer()
      await instance.render(result)
      files = instance.files
    }
    try {
      for (const file of files) {
        if (pointer) for (const source of file.sources) source.pointer ??= pointer
        const existing = this.#cache.get(file.path)
        this.#cache.set(file.path, toFile(existing ? mergeFile(existing, file) : file))
      }
      if (files.length) this.#sorted = null
    } finally {
      instance?.[Symbol.dispose]?.()
    }
  }

  delete(...paths) {
    for (const path of paths) this.#cache.delete(path)
    if (paths.length) this.#sorted = null
  }

  dispose() {
    this.#cache.clear()
    this.#sorted = null
  }

  get files() {
    return (this.#sorted ??= [...this.#cache.values()].sort(compareFiles))
  }

  parse(file, options) {
    return this.#fallback.parse(this.#fallback.add(file)[0], options)
  }

  async write(files, options) {
    if (!files.length) return
    const { storage, parsers, hooks, cleaned } = options
    const forRust = []
    const forJs = []
    for (const file of files) (!file.copy && NATIVE_PARSERS.has(parsers?.get(file.extname)?.name) ? forRust : forJs).push(file)

    await hooks?.callHook('kubb:files:processing:start', { files })

    const extension = {}
    for (const [extname, parser] of parsers ?? []) {
      const target = parser.options?.extension?.[extname]
      if (target) extension[extname] = target
    }
    const toDisk = storage.name === 'fs'
    // One crossing for the whole build: the bridge costs more per call than most files cost to print.
    // Shallow copies drop `meta`, which is the plugin's own data; everything else stringifies without a replacer, which is twice as fast.
    const json = JSON.stringify(forRust.map(({ path, baseName, banner, footer, sources, imports, exports }) => ({ path, baseName, banner, footer, sources, imports, exports })))
    const result = native.emitFiles(json, { extension, write: toDisk, cleaned: cleaned ?? undefined })
    if (!toDisk) await Promise.all(result.paths.map((path, index) => storage.writeItem(path, result.sources[index])))

    // The fallback fires its own start/end pair; only ours should reach listeners.
    if (forJs.length) await this.#fallback.write(this.#fallback.add(...forJs), { ...options, hooks: undefined })

    await hooks?.callHook('kubb:files:processing:end', { files, unchanged: result.unchanged })
  }
}

/** Call after `kubb.setup()`: routes the build's output stage through Rust. */
export function useNativeOutput(kubb) {
  kubb.driver.fileManager = new NativeFileManager(kubb.driver.fileManager)
  return kubb
}
