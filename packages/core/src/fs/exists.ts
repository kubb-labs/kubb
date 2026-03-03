import fs from 'node:fs'
import { access } from 'node:fs/promises'

export async function exists(path: string): Promise<boolean> {
  if (typeof Bun !== 'undefined') {
    return Bun.file(path).exists()
  }
  return access(path).then(
    () => true,
    () => false,
  )
}

export function existsSync(path: string): boolean {
  return fs.existsSync(path)
}
