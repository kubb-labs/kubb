import type { Refs } from '../types.ts'

type Generated = { import: { refs: Refs; name: string } }

export function refsSorter<T extends Generated>(a: T, b: T): number {
  if (Object.keys(a.import.refs)?.length < Object.keys(b.import.refs)?.length) {
    return -1
  }
  if (Object.keys(a.import.refs)?.length > Object.keys(b.import.refs)?.length) {
    return 1
  }
  return 0
}
