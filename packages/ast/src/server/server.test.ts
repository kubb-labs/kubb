import { describe, expect, it } from 'vitest'
import { get, groupByName } from './index.ts'

const servers = [
  { url: 'https://a.example.com', name: 'a' },
  { url: 'https://b.example.com', name: 'b' },
  { url: 'https://c.example.com', name: 'a' },
  { url: '/v2' },
]

describe('server', () => {
  it('selects by index and falls back to the first', () => {
    expect(get({ servers, index: 1 })?.url).toBe('https://b.example.com')
    expect(get({ servers, index: 9 })?.url).toBe('https://a.example.com')
    expect(get({ servers: undefined })).toBeUndefined()
  })

  it('maps named servers, first name wins', () => {
    const named = groupByName(servers)
    expect([...named.keys()]).toEqual(['a', 'b'])
    expect(named.get('a')?.url).toBe('https://a.example.com')
  })
})
