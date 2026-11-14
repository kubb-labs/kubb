import { describe, expect, it } from 'vitest'
import type { TagObject } from '../types.ts'
import { toInputTags } from './tag.ts'

describe('toInputTags', () => {
  it('keeps the 3.2 tag fields and drops malformed ones', () => {
    const tags = [
      { name: 'pets', summary: 'Pets', description: 'All pets', parent: 'animals', kind: 'nav', externalDocs: { url: 'https://example.com/pets' } },
      { name: 'store', summary: 1, parent: null, externalDocs: { description: 'no url' } },
      { description: 'no name' },
    ] as unknown as Array<TagObject>

    expect(toInputTags(tags)).toStrictEqual([
      { name: 'pets', summary: 'Pets', description: 'All pets', parent: 'animals', kind: 'nav', externalDocs: { url: 'https://example.com/pets' } },
      { name: 'store' },
    ])
  })
})
