import { describe, expect, it } from 'vitest'
import { deserializeArtifact, serializeArtifact } from './artifact.ts'

describe('artifact', () => {
  it('round-trips a snapshot back to identical files', () => {
    const snapshot = { files: { 'types/pet.ts': 'export type Pet = { id: number }', 'index.ts': "export * from './types/pet'" } }
    expect(deserializeArtifact(serializeArtifact(snapshot))).toStrictEqual(snapshot)
  })

  it('produces identical bytes for the same snapshot regardless of key order', () => {
    const a = serializeArtifact({ files: { a: '1', b: '2' } })
    const b = serializeArtifact({ files: { b: '2', a: '1' } })
    expect(Array.from(a)).toStrictEqual(Array.from(b))
  })

  it('returns null for a corrupt blob', () => {
    expect(deserializeArtifact(Buffer.from('not a gzip blob'))).toBeNull()
  })
})
