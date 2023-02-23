export const nameSorter = <T extends { name: string }>(a: T, b: T) => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}
