import { describe, expect, it } from 'vitest'
import { getProjectKubbHome } from './credentials.ts'

describe('getProjectKubbHome', () => {
  it('returns a persistence directory keyed by project path', () => {
    expect(getProjectKubbHome('/projects/one')).toBe(getProjectKubbHome('/projects/one'))
    expect(getProjectKubbHome('/projects/one')).not.toBe(getProjectKubbHome('/projects/two'))
  })
})
