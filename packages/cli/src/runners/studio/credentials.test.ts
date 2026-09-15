import { describe, expect, it } from 'vitest'
import { getProjectKubbHome } from './credentials.ts'

describe('getProjectKubbHome', () => {
  it('uses a different persistence directory for each project', () => {
    expect(getProjectKubbHome('/projects/one')).not.toBe(getProjectKubbHome('/projects/two'))
  })

  it('returns the same persistence directory for the same project', () => {
    expect(getProjectKubbHome('/projects/one')).toBe(getProjectKubbHome('/projects/one'))
  })
})
