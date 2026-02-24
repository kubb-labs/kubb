import fs from 'node:fs'
import { access } from 'node:fs/promises'
import { switcher } from 'js-runtime'

const reader = switcher(
  {
    node: async (path: string) => {
      return access(path).then(
        () => true,
        () => false,
      )
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
      return fs.existsSync(path)
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
