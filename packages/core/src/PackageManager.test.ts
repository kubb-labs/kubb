import { describe, expect, test } from 'vitest'
import { satisfiesDependency } from './utils/packageJSON.ts'

describe('satisfiesDependency', () => {
  test('returns true when dependency satisfies the version range', () => {
    expect(satisfiesDependency('typescript', '>=5')).toBeTruthy()
  })

  test('returns false for an unknown dependency', () => {
    expect(satisfiesDependency('non-existent-package-xyz', '>=1')).toBeFalsy()
  })
})
