import { promises as fs } from 'node:fs'
import pathParser from 'node:path'

function slash(path: string, platform: 'windows' | 'mac' | 'linux' = 'linux') {
  const isWindowsPath = /^\\\\\?\\/.test(path)

  if (['linux', 'mac'].includes(platform) && !isWindowsPath) {
    // linux and mac
    return path.replace('../', '').trimEnd()
  }

  // windows
  return path.replace(/\\/g, '/').replace('../', '').trimEnd()
}

export function getRelativePath(rootDir?: string | null, filePath?: string | null, platform: 'windows' | 'mac' | 'linux' = 'linux') {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir || ''} ${filePath || ''}`)
  }

  const relativePath = pathParser.relative(rootDir, filePath)

  // On Windows, paths are separated with a "\"
  // However, web browsers use "/" no matter the platform
  const path = slash(relativePath, platform)

  if (path.startsWith('../')) {
    return path.replace(pathParser.basename(path), pathParser.basename(path, pathParser.extname(filePath)))
  }

  return `./${path.replace(pathParser.basename(path), pathParser.basename(path, pathParser.extname(filePath)))}`
}

export type PathMode = 'file' | 'directory'

export function getPathMode(path: string | undefined | null): PathMode {
  if (!path) {
    return 'directory'
  }
  return pathParser.extname(path) ? 'file' : 'directory'
}

export async function read(path: string) {
  return fs.readFile(path, { encoding: 'utf8' })
}
