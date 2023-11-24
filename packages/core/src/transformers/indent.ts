export function createIndent(size: number): string {
  return Array.from({ length: size + 1 }).join(' ')
}
