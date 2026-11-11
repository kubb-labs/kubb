import { describe, expect, it } from 'vitest'
import type { AuthScheme } from '../nodes/input.ts'
import { resolve } from './index.ts'

const schemes: Array<AuthScheme> = [
  { name: 'bearer', credential: { type: 'http', scheme: 'bearer' } },
  { name: 'key', credential: { type: 'apiKey', in: 'header', name: 'X-Key' } },
]

describe('auth.resolve', () => {
  it('joins requirements with their schemes', () => {
    expect(resolve([[{ scheme: 'bearer', scopes: ['read'] }, { scheme: 'key' }]], schemes)).toEqual([
      [
        { name: 'bearer', credential: { type: 'http', scheme: 'bearer' }, scopes: ['read'] },
        { name: 'key', credential: { type: 'apiKey', in: 'header', name: 'X-Key' }, scopes: [] },
      ],
    ])
  })

  it('drops undeclared and repeated requirements, keeps an empty one', () => {
    const resolved = resolve([[{ scheme: 'bearer' }], [{ scheme: 'missing' }], [{ scheme: 'bearer' }], []], schemes)
    expect(resolved.map((requirement) => requirement.map(({ name }) => name))).toEqual([['bearer'], []])
  })

  it('returns an empty list without auth', () => {
    expect(resolve(undefined, schemes)).toEqual([])
  })
})
