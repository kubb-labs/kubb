export { clean } from './clean.ts'
export { getRelativePath, read, readSync } from './read.ts'
export { write } from './write.ts'

export function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

export * as KubbFile from './types.ts'
