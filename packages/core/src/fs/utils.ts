import { posix } from 'node:path'

/**
 * Converts all backslashes to forward slashes.
 * Extended-length Windows paths (\\?\...) are left unchanged.
 */
function toSlash(p: string): string {
  if (p.startsWith('\\\\?\\')) {
    return p
  }
  return p.replaceAll('\\', '/')
}

export function getRelativePath(rootDir?: string | null, filePath?: string | null): string {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir || ''} ${filePath || ''}`)
  }

  // Normalise separators before computing the relative path so that this
  // function produces consistent forward-slash output on every platform,
  // including Windows where path.relative returns backslash-separated paths.
  const relativePath = posix.relative(toSlash(rootDir), toSlash(filePath))

  if (relativePath.startsWith('../')) {
    return relativePath
  }

  return `./${relativePath}`
}
