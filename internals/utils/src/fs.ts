import { posix } from 'node:path'

/**
 * Converts all backslashes to forward slashes.
 * Extended-length Windows paths (`\\?\...`) are left unchanged.
 */
function toSlash(p: string): string {
  if (p.startsWith('\\\\?\\')) return p
  return p.replaceAll('\\', '/')
}

/**
 * Returns the relative path from `rootDir` to `filePath`, always using
 * forward slashes and prefixed with `./` when not already traversing upward.
 */
export function getRelativePath(rootDir?: string | null, filePath?: string | null): string {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir || ''} ${filePath || ''}`)
  }

  const relativePath = posix.relative(toSlash(rootDir), toSlash(filePath))

  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}
