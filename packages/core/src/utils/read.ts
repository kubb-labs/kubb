import pathParser from 'path'

import fse from 'fs-extra'

// TODO check for a better way or resolving the relative path
export const getRelativePath = (root?: string | null, file?: string | null) => {
  if (!root || !file) {
    throw new Error('Root and file should be filled in when retrieving the relativePath')
  }
  const newPath = pathParser.relative(root, file).replace('../', '').replace('.ts', '').trimEnd()

  return `./${newPath}`
}

export type PathMode = 'file' | 'directory'

export const getPathMode = (path: string | undefined | null): PathMode | undefined => {
  if (!path) {
    return undefined
  }
  return pathParser.extname(path) ? 'file' : 'directory'
}

export const read = async (path: string, encoding = 'utf8') => {
  try {
    return fse.readFile(path, encoding)
  } catch (err) {
    console.error(err)
    throw err
  }
}
