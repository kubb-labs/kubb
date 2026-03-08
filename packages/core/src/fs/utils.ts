import { normalize, relative } from 'node:path'

function slash(path: string) {
  const isWindowsPath = /^\\\\\?\\/.test(path)
  const normalizedPath = normalize(path)

  if (isWindowsPath) {
    return normalizedPath
  }

  return normalizedPath.replaceAll(/\\/g, '/')
}

export function getRelativePath(rootDir?: string | null, filePath?: string | null, _platform: 'windows' | 'mac' | 'linux' = 'linux'): string {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir || ''} ${filePath || ''}`)
  }

  const relativePath = relative(rootDir, filePath)

  // On Windows, paths are separated with a "\"
  // However, web browsers use "/" no matter the platform
  const slashedPath = slash(relativePath)

  if (slashedPath.startsWith('../')) {
    return slashedPath
  }

  return `./${slashedPath}`
}
