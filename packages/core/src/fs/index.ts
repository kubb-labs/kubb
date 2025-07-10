export { clean } from './clean.ts'
export { read, readSync } from './read.ts'
export { write } from './write.ts'
export { exists } from './exists.ts'
export { getRelativePath } from './utils.ts'

export function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

export * as KubbFile from './types.ts'
