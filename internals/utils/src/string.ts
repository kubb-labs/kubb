
/**
 * Returns a masked version of a string, showing only the first and last few characters.
 * Useful for logging sensitive values (tokens, keys) without exposing the full value.
 *
 * @example
 * maskString('KUBB_STUDIO-abc123-xyz789') // 'KUBB_STUDIO-…789'
 */
export function maskString(value: string, start = 8, end = 4): string {
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

/**
 * Strips the file extension from a path or file name.
 * Only removes the last `.ext` segment when the dot is not part of a directory name.
 *
 * @example
 * trimExtName('petStore.ts')             // 'petStore'
 * trimExtName('/src/models/pet.ts')      // '/src/models/pet'
 * trimExtName('/project.v2/gen/pet.ts')  // '/project.v2/gen/pet'
 * trimExtName('noExtension')             // 'noExtension'
 */
export function trimExtName(text: string): string {
  const dotIndex = text.lastIndexOf('.')
  if (dotIndex > 0 && !text.includes('/', dotIndex)) {
    return text.slice(0, dotIndex)
  }
  return text
}
