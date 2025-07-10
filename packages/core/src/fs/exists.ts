import fs from 'fs-extra'
import { switcher } from 'js-runtime'

const reader = switcher(
  {
    node: async (path: string) => {
      return fs.pathExists(path)
    },
    bun: async (path: string) => {
      const file = Bun.file(path)

      return file.exists()
    },
  },
  'node',
)

const syncReader = switcher(
  {
    node: (path: string) => {
      return fs.pathExistsSync(path)
    },
    bun: () => {
      throw new Error('Bun cannot read sync')
    },
  },
  'node',
)

export async function exists(path: string): Promise<boolean> {
  return reader(path)
}

export function existsSync(path: string): boolean {
  return syncReader(path)
}
