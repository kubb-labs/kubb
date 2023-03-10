/* eslint-disable no-param-reassign */
export function getUniqueName(originalName: string, data: Record<string, number>) {
  let used = data[originalName] || 0
  if (used) {
    data[originalName] = ++used
    originalName += used
  }
  data[originalName] = 1
  return originalName
}
