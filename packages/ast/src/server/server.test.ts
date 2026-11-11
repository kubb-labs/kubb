import { describe, expect, it } from 'vitest'
import { byName, select } from './index.ts'

const servers = [
  { url: 'https://a.example.com', name: 'a' },
  { url: 'https://b.example.com', name: 'b' },
  { url: 'https://c.example.com', name: 'a' },
  { url: '/v2' },
]

describe('server', () => {
  it('selects by index and falls back to the first', () => {
    expect(select({ servers, index: 1 })?.url).toBe('https://b.example.com')
    expect(select({ servers, index: 9 })?.url).toBe('https://a.example.com')
    expect(select({ servers: undefined })).toBeUndefined()
  })

  it('maps named servers, first name wins', () => {
    const named = byName(servers)
    expect([...named.keys()]).toEqual(['a', 'b'])
    expect(named.get('a')?.url).toBe('https://a.example.com')
  })
})
