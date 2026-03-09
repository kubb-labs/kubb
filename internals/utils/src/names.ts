/**
 * Returns a unique name by appending an incrementing suffix when the name
 * has already been used. Mutates `data` as a usage counter.
 */
export function getUniqueName(originalName: string, data: Record<string, number>): string {
  let used = data[originalName] || 0
  if (used) {
    data[originalName] = ++used
    originalName += used
  }
  data[originalName] = 1
  return originalName
}

/**
 * Registers `originalName` in `data` without modifying the name itself.
 * When the name is already registered, increments its counter and returns it unchanged.
 */
export function setUniqueName(originalName: string, data: Record<string, number>): string {
  let used = data[originalName] || 0
  if (used) {
    data[originalName] = ++used
    return originalName
  }
  data[originalName] = 1
  return originalName
}
