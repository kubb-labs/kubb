export { clean } from './clean.ts'
export { exists } from './exists.ts'
export { read, readSync } from './read.ts'
export { unlink } from './unlink.ts'
export { getRelativePath } from './utils.ts'
export { write } from './write.ts'

export function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

export * as KubbFile from './types.ts'
