import fs from 'fs-extra'
import pathParser from 'node:path'
import { switcher } from 'js-runtime'

async function saveCreateDirectory(path: string): Promise<void> {
  // resolve the full path and get just the directory, ignoring the file and extension
  const passedPath = pathParser.dirname(pathParser.resolve(path))
  // make the directory, recursively. Theoretically, if every directory in the path exists, this won't do anything.
  await fs.mkdir(passedPath, { recursive: true })
}

const writer = switcher(
  {
    node: async (path: string, data: string) => {
      try {
        await fs.stat(path)
        const oldContent = await fs.readFile(path, { encoding: 'utf-8' })
        if (oldContent?.toString() === data) {
          return
        }
      } catch (_err) {
        /* empty */
      }

      await saveCreateDirectory(path)
      return fs.writeFile(pathParser.resolve(path), data, { encoding: 'utf-8' })
    },
    bun: async (path: string, data: string) => {
      try {
        await saveCreateDirectory(path)

        await Bun.write(pathParser.resolve(path), data)
      } catch (e) {
        console.log(e, pathParser.resolve(path))
      }
    },
  },
  'node',
)

export async function write(data: string, path: string): Promise<void> {
  return writer(path, data)
}
