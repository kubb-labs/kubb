import { readFileSync } from 'node:fs'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, posix, resolve } from 'node:path'

/**
 * Converts all backslashes to forward slashes.
 * Extended-length Windows paths (`\\?\...`) are left unchanged.
 */
function toSlash(p: string): string {
  if (p.startsWith('\\\\?\\')) return p
  return p.replaceAll('\\', '/')
}

/**
 * Returns the relative path from `rootDir` to `filePath`, always using forward slashes
 * and prefixed with `./` when not already traversing upward.
 *
 * @example
 * ```ts
 * getRelativePath('/src/components', '/src/components/Button.tsx') // './Button.tsx'
 * getRelativePath('/src/components', '/src/utils/helpers.ts')      // '../utils/helpers.ts'
 * ```
 */
export function getRelativePath(rootDir?: string | null, filePath?: string | null): string {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir || ''} ${filePath || ''}`)
  }

  const relativePath = posix.relative(toSlash(rootDir), toSlash(filePath))

  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

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
  if (typeof Bun !== 'undefined') {
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
  if (typeof Bun !== 'undefined') {
    return Bun.file(path).text()
  }
  return readFile(path, { encoding: 'utf8' })
}

/**
 * Synchronous counterpart of `read`.
 *
 * @example
 * ```ts
 * const source = readSync('./src/Pet.ts')
 * ```
 */
export function readSync(path: string): string {
  return readFileSync(path, { encoding: 'utf8' })
}

type WriteOptions = {
  /**
   * When `true`, re-reads the file immediately after writing and throws if the
   * content does not match — useful for catching write failures on unreliable file systems.
   */
  sanity?: boolean
}

/**
 * Writes `data` to `path`, trimming leading/trailing whitespace before saving.
 * Skips the write when the trimmed content is empty or identical to what is already on disk.
 * Creates any missing parent directories automatically.
 * When `sanity` is `true`, re-reads the file after writing and throws if the content does not match.
 *
 * @example
 * ```ts
 * await write('./src/Pet.ts', source)         // writes and returns trimmed content
 * await write('./src/Pet.ts', source)         // undefined — file unchanged
 * await write('./src/Pet.ts', '  ')           // undefined — empty content skipped
 * ```
 */
export async function write(path: string, data: string, options: WriteOptions = {}): Promise<string | undefined> {
  const trimmed = data.trim()
  if (trimmed === '') return undefined

  const resolved = resolve(path)

  if (typeof Bun !== 'undefined') {
    const file = Bun.file(resolved)
    const oldContent = (await file.exists()) ? await file.text() : null
    if (oldContent === trimmed) return undefined
    await Bun.write(resolved, trimmed)
    return trimmed
  }

  try {
    const oldContent = await readFile(resolved, { encoding: 'utf-8' })
    if (oldContent === trimmed) return undefined
  } catch {
    /* file doesn't exist yet */
  }

  await mkdir(dirname(resolved), { recursive: true })
  await writeFile(resolved, trimmed, { encoding: 'utf-8' })

  if (options.sanity) {
    const savedData = await readFile(resolved, { encoding: 'utf-8' })
    if (savedData !== trimmed) {
      throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
    }
    return savedData
  }

  return trimmed
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
