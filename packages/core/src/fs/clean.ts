import { remove } from 'fs-extra'

export async function clean(path: string): Promise<void> {
  return remove(path)
}
