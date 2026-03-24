import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { satisfiesDependency } from './packageJSON.ts'

const cwd = dirname(fileURLToPath(import.meta.url))

describe('satisfiesDependency', () => {
  test('returns true when dependency satisfies the version range', () => {
    expect(satisfiesDependency('semver', '>=7', cwd)).toBeTruthy()
  })

  test('returns false for an unknown dependency', () => {
    expect(satisfiesDependency('non-existent-package-xyz', '>=1', cwd)).toBeFalsy()
  })
})
