export function getUniqueName(originalName: string, data: Record<string, number>): string {
  let used = data[originalName] || 0
  if (used) {
    data[originalName] = ++used
    originalName += used
  }
  data[originalName] = 1
  return originalName
}

export function setUniqueName(originalName: string, data: Record<string, number>): string {
  let used = data[originalName] || 0
  if (used) {
    data[originalName] = ++used

    return originalName
  }
  data[originalName] = 1
  return originalName
}
