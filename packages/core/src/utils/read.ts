import pathParser from 'path'
import { promises as fs } from 'fs'

// TODO check for a better way or resolving the relative path
export const getRelativePath = (root?: string | null, file?: string | null) => {
  if (!root || !file) {
    throw new Error('Root and file should be filled in when retrieving the relativePath')
  }
  const newPath = pathParser.relative(root, file).replace('../', '').replace('.ts', '').trimEnd()

  return `./${newPath}`
}

export type PathMode = 'file' | 'directory'

export const getPathMode = (path: string | undefined | null): PathMode => {
  if (!path) {
    return 'directory'
  }
  return pathParser.extname(path) ? 'file' : 'directory'
}

export const read = async (path: string) => {
  try {
    return fs.readFile(path, { encoding: 'utf8' })
  } catch (err) {
    console.error(err)
    throw err
  }
}
