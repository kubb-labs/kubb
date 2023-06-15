export function nameSorter<T extends { name: string }>(a: T, b: T): 0 | 1 | -1 {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}
