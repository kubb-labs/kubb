import fs from 'fs-extra'

export async function clean(path: string): Promise<void> {
  return fs.remove(path)
}
