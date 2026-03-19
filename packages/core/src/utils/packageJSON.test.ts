import { describe, expect, test } from 'vitest'
import { satisfiesDependency } from './packageJSON.ts'

describe('satisfiesDependency', () => {
  test('returns true when dependency satisfies the version range', () => {
    expect(satisfiesDependency('semver', '>=7')).toBeTruthy()
  })

  test('returns false for an unknown dependency', () => {
    expect(satisfiesDependency('non-existent-package-xyz', '>=1')).toBeFalsy()
  })
})
