/* eslint-disable consistent-return */
import { promises as fs } from 'fs'
import pathParser from 'path'

async function safeWriteFileToPath(path: string, data: string) {
  // resolve the full path and get just the directory, ignoring the file and extension
  const passedPath = pathParser.dirname(pathParser.resolve(path))
  // make the directory, recursively. Theoretically, if every directory in the path exists, this won't do anything.
  await fs.mkdir(passedPath, { recursive: true })
  // write the file to the newly created directory
  return fs.writeFile(pathParser.resolve(path), data, { encoding: 'utf-8' })
}

export async function write(data: string, path: string) {
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
