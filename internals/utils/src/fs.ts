import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { camelCase } from './casing.ts'
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
 * await write('./src/Pet.ts', source)         // null — file unchanged
 * await write('./src/Pet.ts', '  ')           // null — empty content skipped
 * ```
 */
export async function write(path: string, data: string, options: WriteOptions = {}): Promise<string | null> {
  const trimmed = data.trim()
  if (trimmed === '') return null

  const resolved = resolve(path)

  if (runtime.isBun) {
    const file = Bun.file(resolved)
    const oldContent = (await file.exists()) ? await file.text() : null
    if (oldContent === trimmed) return null
    await Bun.write(resolved, trimmed)
    return trimmed
  }

  try {
    const oldContent = await readFile(resolved, { encoding: 'utf-8' })
    if (oldContent === trimmed) return null
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

/**
 * Resolves to `true` when `path` is `parent` itself or nested inside it. Both sides are resolved
 * to absolute paths first, so relative and `..`-containing inputs compare correctly.
 *
 * Guards destructive operations: before wiping an output directory, check that it does not contain
 * the project root, otherwise a `clean` would delete `kubb.config` and every source file.
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
  if (resolvedPath === resolvedParent) return true

  const rel = relative(resolvedParent, resolvedPath)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
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

/**
 * Builds a nested file path from a dotted name. Splits on dots that precede a letter
 * (so version numbers embedded in operationIds like `v2025.0` stay intact), camelCases
 * every earlier segment, applies `caseLast` to the final segment, and joins with `/`.
 *
 * Empty segments are dropped before joining. They arise when the name starts with a dot
 * followed by a letter (e.g. `..Schema` splits into `['..', 'Schema']` and `'..'` cases to
 * an empty string). Without this a leading `/` would form, which `path.resolve` reads as an
 * absolute path, letting generated files escape the configured output directory.
 *
 * @example Nested path from a dotted name
 * `toFilePath('pet.petId') // 'pet/petId'`
 *
 * @example PascalCase the final segment
 * `toFilePath('pet.Pet', pascalCase) // 'pet/Pet'`
 *
 * @example Suffix applied to the final segment only
 * `toFilePath('tag.tag', (part) => camelCase(part, { suffix: 'schema' })) // 'tag/tagSchema'`
 */
export function toFilePath(name: string, caseLast: (part: string) => string = camelCase): string {
  const parts = name.split(/\.(?=[a-zA-Z])/)
  return parts
    .map((part, i) => (i === parts.length - 1 ? caseLast(part) : camelCase(part)))
    .filter(Boolean)
    .join('/')
}
