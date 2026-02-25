import { rm } from 'node:fs/promises'

export async function clean(path: string): Promise<void> {
  return rm(path, { recursive: true, force: true })
}
