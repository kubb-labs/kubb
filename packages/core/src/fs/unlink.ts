import fs from 'fs-extra'

export async function unlink(path: string): Promise<void> {
  return fs.unlink(path)
}
