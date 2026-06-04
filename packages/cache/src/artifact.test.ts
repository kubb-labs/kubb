import { describe, expect, it } from 'vitest'
import { Artifact } from './artifact.ts'

describe('Artifact', () => {
  it('round-trips a snapshot back to identical files', () => {
    const snapshot = { files: { 'types/pet.ts': 'export type Pet = { id: number }', 'index.ts': "export * from './types/pet'" } }
    expect(Artifact.deserialize(Artifact.serialize(snapshot))).toStrictEqual(snapshot)
  })

  it('produces identical bytes for the same snapshot regardless of key order', () => {
    const a = Artifact.serialize({ files: { a: '1', b: '2' } })
    const b = Artifact.serialize({ files: { b: '2', a: '1' } })
    expect(Array.from(a)).toStrictEqual(Array.from(b))
  })

  it('returns null for a corrupt blob', () => {
    expect(Artifact.deserialize(Buffer.from('not a gzip blob'))).toBeNull()
  })
})
