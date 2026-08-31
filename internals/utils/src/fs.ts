import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { runtime } from './runtime.ts'

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
  let stored = options.stored

  if (stored === undefined) {
    if (runtime.isBun) {
      const file = Bun.file(resolved)
      stored = (await file.exists()) ? await file.text() : null
    } else {
      try {
        stored = await readFile(resolved, { encoding: 'utf-8' })
      } catch {
        /* file doesn't exist yet */
        stored = null
      }
    }
  }
  if (matchesStored({ stored: stored ?? '', source: trimmed })) return null

  if (runtime.isBun) {
    await Bun.write(resolved, content)
    return content
  }

  // Creating the directory up front costs a syscall per file, and every file after the first in a
  // directory pays it for nothing. Write first and only fall back when the directory is missing,
  // which also stays correct when something removed it mid-run.
  try {
    await writeFile(resolved, content, { encoding: 'utf-8' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error

    await mkdir(dirname(resolved), { recursive: true })
    await writeFile(resolved, content, { encoding: 'utf-8' })
  }

  if (options.sanity) {
    const savedData = await readFile(resolved, { encoding: 'utf-8' })
    if (savedData !== content) {
      throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
    }
    return savedData
  }

  return content
}

/**
 * Recursively removes `path`. Silently succeeds when `path` does not exist.
 *
 * @example
 * ```ts
 * await clean('./dist')
 * ```
 */
export async function clean(path: string): Promise<void> {
  return rm(path, { recursive: true, force: true })
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
 * Strips the file extension from a path or file name.
 * Only removes the last `.ext` segment when the dot is not part of a directory name.
 *
 * @example
 * trimExtName('petStore.ts')             // 'petStore'
 * trimExtName('/src/models/pet.ts')      // '/src/models/pet'
 * trimExtName('/project.v2/gen/pet.ts')  // '/project.v2/gen/pet'
 * trimExtName('noExtension')             // 'noExtension'
 */
export function trimExtName(text: string): string {
  const dotIndex = text.lastIndexOf('.')
  if (dotIndex > 0 && !text.includes('/', dotIndex)) {
    return text.slice(0, dotIndex)
  }
  return text
}
