import { access, glob as globNode, mkdir, readFile, writeFile } from 'node:fs/promises'

import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { runtime } from './runtime.ts'

export { existsSync } from 'node:fs'
export { mkdir, mkdtemp, rm } from 'node:fs/promises'

/**
 * Resolves to `true` when the file or directory at `path` exists.
 * Uses `Bun.file().exists()` when running under Bun, `fs.access` otherwise.
 *
 * @example
 * ```ts
 * if (await exists('./kubb.config.ts')) {
 *   const content = await read('./kubb.config.ts')
 * }
 * ```
 */
export async function exists(path: string): Promise<boolean> {
  if (runtime.isBun) {
    return Bun.file(path).exists()
  }
  return access(path).then(
    () => true,
    () => false,
  )
}

/**
 * Reads the file at `path` as a UTF-8 string.
 * Uses `Bun.file().text()` when running under Bun, `fs.readFile` otherwise.
 *
 * @example
 * ```ts
 * const source = await read('./src/Pet.ts')
 * ```
 */
export async function read(path: string): Promise<string> {
  if (runtime.isBun) {
    return Bun.file(path).text()
  }
  return readFile(path, { encoding: 'utf8' })
}

type WriteOptions = {
  /**
   * Previously read content, or `null` when the file does not exist.
   * Omitting this value reads the file before writing.
   */
  stored?: string | null
  /**
   * When `true`, re-reads the file immediately after writing and throws if the
   * content does not match — useful for catching write failures on unreliable file systems.
   */
  sanity?: boolean
}

/**
 * Whether `stored` already holds `source`, comparing on the trimmed text rather than the exact
 * bytes. Surrounding whitespace is what a formatter adds and what editors strip, and neither is a
 * reason to rewrite the file.
 *
 * Both sides are trimmed, so a storage that keeps bytes verbatim settles on the same answer as one
 * that normalizes what it stores. Trimming only `stored` would leave a source with leading
 * whitespace rewritten on every build, since the stored copy keeps the whitespace the comparison
 * has already dropped.
 */
export function matchesStored({ stored, source }: { stored: string; source: string }): boolean {
  return stored.trim() === source.trim()
}

/**
 * Writes `data` to `path`, trimming surrounding whitespace and ending the file with a single newline
 * the way prettier, biome, and oxfmt all do.
 * Skips the write when the trimmed content is empty, or when the file already holds that content.
 * Creates any missing parent directories automatically.
 * When `sanity` is `true`, re-reads the file after writing and throws if the content does not match.
 *
 * @example
 * ```ts
 * await write('./src/Pet.ts', source)         // writes and returns the trimmed content plus a newline
 * await write('./src/Pet.ts', source)         // null — file unchanged
 * await write('./src/Pet.ts', '  ')           // null — empty content skipped
 * ```
 */
export async function write(path: string, data: string, options: WriteOptions = {}): Promise<string | null> {
  const trimmed = data.trim()
  if (trimmed === '') return null

  const content = `${trimmed}\n`
  const resolved = resolve(path)
  // A missing file reads as `null`.
  const stored = options.stored === undefined ? await read(resolved).catch(() => null) : options.stored
  if (matchesStored({ stored: stored ?? '', source: trimmed })) return null

  await writeRaw(resolved, content)

  if (options.sanity) {
    const savedData = await read(resolved)
    if (savedData !== content) {
      throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
    }
    return savedData
  }

  return content
}

/**
 * Writes UTF-8 content verbatim, including empty files and surrounding whitespace.
 * Uses Bun.write under Bun and creates missing parent directories under either runtime.
 *
 * @example
 * await writeRaw('./cache/output.ts', '  // keep these bytes\n\n')
 */
export async function writeRaw(path: string, content: string): Promise<void> {
  const resolved = resolve(path)
  if (runtime.isBun) {
    await Bun.write(resolved, content)
    return
  }
  try {
    await writeFile(resolved, content, { encoding: 'utf-8' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    await mkdir(dirname(resolved), { recursive: true })
    await writeFile(resolved, content, { encoding: 'utf-8' })
  }
}

/**
 * Lists non-hidden regular files below `directory` as relative POSIX paths, excluding directories and symlinks.
 * Uses Bun.Glob under Bun because its Node glob compatibility API lacks directory-entry support.
 *
 * @example
 * for await (const path of listFiles('./src')) console.log(path)
 */
export async function* listFiles(directory: string): AsyncGenerator<string> {
  const cwd = resolve(directory)
  if (runtime.isBun) {
    yield* new Bun.Glob('**/*').scan({ cwd, dot: false, onlyFiles: true, followSymlinks: false })
    return
  }
  for await (const entry of globNode('**/*', { cwd, withFileTypes: true })) {
    if (entry.isFile()) yield toPosixPath(relative(cwd, join(entry.parentPath, entry.name)))
  }
}

/**
 * Converts a filesystem path to use POSIX (`/`) separators.
 *
 * Most of the codebase compares and composes paths as strings (prefix matching, joining for
 * import specifiers, splitting on `/`). On POSIX `path.resolve` already returns `/`-separated
 * paths, but on Windows it returns `\`-separated paths, which breaks every such comparison.
 *
 * Routing every path that crosses a module boundary through `toPosixPath` keeps the rest of the
 * code platform-agnostic. The conversion runs unconditionally so Windows-specific behavior is
 * exercisable from POSIX CI.
 *
 * @example
 * toPosixPath('C:\\repo\\src\\pet.ts') // 'C:/repo/src/pet.ts'
 */
export function toPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

/**
 * Resolves to `true` when `path` is `parent` itself or nested inside it. Both sides are resolved
 * to absolute paths first, so relative and `..`-containing inputs compare correctly.
 *
 * Guards a destructive or an out-of-tree operation: before wiping an output directory, check that
 * it does not contain the project root, and before loading a path a caller supplied, check that it
 * did not escape the directory it is allowed to read from.
 *
 * @example
 * isPathInside('./src/gen', '.')   // true  — nested inside the root
 * isPathInside('.', '.')           // true  — the same directory counts as inside
 * isPathInside('.', './src/gen')   // false — the root is not inside its own output
 * isPathInside('../other', '.')    // false — escapes the root
 */
export function isPathInside(path: string, parent: string): boolean {
  const resolvedPath = resolve(path)
  const resolvedParent = resolve(parent)
  if (resolvedPath === resolvedParent) {
    return true
  }

  const rel = relative(resolvedParent, resolvedPath)

  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}
