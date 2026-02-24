import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { switcher } from 'js-runtime'

type Options = { sanity?: boolean }

const writer = switcher(
  {
    node: async (path: string, data: string, { sanity }: Options) => {
      try {
        const oldContent = await readFile(resolve(path), {
          encoding: 'utf-8',
        })
        if (oldContent?.toString() === data?.toString()) {
          return
        }
      } catch (_err) {
        /* empty */
      }

      await mkdir(dirname(resolve(path)), { recursive: true })
      await writeFile(resolve(path), data, { encoding: 'utf-8' })

      if (sanity) {
        const savedData = await readFile(resolve(path), {
          encoding: 'utf-8',
        })

        if (savedData?.toString() !== data?.toString()) {
          throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
        }

        return savedData
      }

      return data
    },
    bun: async (path: string, data: string, { sanity }: Options) => {
      await Bun.write(resolve(path), data)

      if (sanity) {
        const file = Bun.file(resolve(path))
        const savedData = await file.text()

        if (savedData?.toString() !== data?.toString()) {
          throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
        }

        return savedData
      }

      return data
    },
  },
  'node',
)

export async function write(path: string, data: string, options: Options = {}): Promise<string | undefined> {
  if (data.trim() === '') {
    return undefined
  }
  return writer(path, data.trim(), options)
}
