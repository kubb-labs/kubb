import fs from 'fs-extra'
import { switcher } from 'js-runtime'

const reader = switcher(
  {
    node: async (path: string) => {
      return fs.readFile(path, { encoding: 'utf8' })
    },
    bun: async (path: string) => {
      const file = Bun.file(path)

      return file.text()
    },
  },
  'node',
)

const syncReader = switcher(
  {
    node: (path: string) => {
      return fs.readFileSync(path, { encoding: 'utf8' })
    },
    bun: () => {
      throw new Error('Bun cannot read sync')
    },
  },
  'node',
)

export async function read(path: string): Promise<string> {
  return reader(path)
}

export function readSync(path: string): string {
  return syncReader(path)
}
