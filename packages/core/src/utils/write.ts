/* eslint-disable consistent-return */
import { promises as fs } from 'fs'
import pathParser from 'path'

import rimraf from 'rimraf'

const safeWriteFileToPath = async (path: string, data: any) => {
  // resolve the full path and get just the directory, ignoring the file and extension
  const passedPath = pathParser.dirname(pathParser.resolve(path))
  // make the directory, recursively. Theoretically, if every directory in the path exists, this won't do anything.
  await fs.mkdir(passedPath, { recursive: true })
  // write the file to the newly created directory
  return fs.writeFile(pathParser.resolve(path), data, { encoding: 'utf-8' })
}

export const write = async (data: string, path: string) => {
  try {
    await fs.stat(path)
    const oldContent = await fs.readFile(path, { encoding: 'utf-8' })
    if (oldContent?.toString() === data) {
      return
    }
  } catch (_err) {
    return safeWriteFileToPath(path, data)
  }

  return safeWriteFileToPath(path, data)
}

export const clean = async (path: string) => {
  return new Promise((resolve, reject) => {
    rimraf(path, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}
