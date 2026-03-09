import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

export async function read(path: string): Promise<string> {
  if (typeof Bun !== 'undefined') {
    return Bun.file(path).text()
  }
  return readFile(path, { encoding: 'utf8' })
}

export function readSync(path: string): string {
  return readFileSync(path, { encoding: 'utf8' })
}
