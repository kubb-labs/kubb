import { dirname, resolve, extname } from 'node:path'

import fs from 'fs-extra'
import { switcher } from 'js-runtime'

async function saveCreateDirectory(path: string): Promise<void> {
  // resolve the full path and get just the directory, ignoring the file and extension
  const passedPath = dirname(resolve(path))
  // make the directory, recursively. Theoretically, if every directory in the path exists, this won't do anything.
  await fs.mkdir(passedPath, { recursive: true })
}

const writer = switcher(
  {
    node: async (path: string, data: string) => {
      try {
        await fs.stat(resolve(path))
        const oldContent = await fs.readFile(resolve(path), { encoding: 'utf-8' })
        if (oldContent?.toString() === data?.toString()) {
          return
        }
      } catch (_err) {
        /* empty */
      }

      await saveCreateDirectory(path)
      await fs.writeFile(resolve(path), data, { encoding: 'utf-8' })

      const savedData = await fs.readFile(resolve(path), { encoding: 'utf-8' })

      if (savedData?.toString() !== data?.toString()) {
        throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
      }

      return savedData
    },
    bun: async (path: string, data: string) => {
      try {
        await saveCreateDirectory(path)
        await Bun.write(resolve(path), data)

        const file = Bun.file(resolve(path))
        const savedData = await file.text()

        if (savedData?.toString() !== data?.toString()) {
          throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
        }

        return savedData
      } catch (e) {
        console.log(e, resolve(path))
      }
    },
  },
  'node',
)

export async function write(data: string, path: string): Promise<string | undefined> {
  if (data.trim() === '') {
    return undefined
  }
  return writer(path, data.trim())
}
