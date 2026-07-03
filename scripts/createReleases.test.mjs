import { describe, expect, it } from 'vitest'
import { extractPackageNotes } from './createReleases.mjs'

const changelog = `# Changelog

## v5.0.0-beta.80 — Jul 2, 2026

### @kubb/ast

#### Features

- Let a printer node override reuse the handler it replaces.

### @kubb/parser-md

#### Bug Fixes

- Correct the \`parserMd\` JSDoc.

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.79 — Jun 30, 2026

### @kubb/cli

#### Bug Fixes

- Cleanup defineLogger
`

describe('extractPackageNotes', () => {
  it('extracts a package section from its version block', () => {
    expect(extractPackageNotes({ changelog, name: '@kubb/ast', version: '5.0.0-beta.80' })).toBe(
      '#### Features\n\n- Let a printer node override reuse the handler it replaces.',
    )
  })

  it('stops at the next package heading in the same version block', () => {
    expect(extractPackageNotes({ changelog, name: '@kubb/parser-md', version: '5.0.0-beta.80' })).toBe('#### Bug Fixes\n\n- Correct the `parserMd` JSDoc.')
  })

  it('does not reach into an older version block for the same package', () => {
    expect(extractPackageNotes({ changelog, name: '@kubb/cli', version: '5.0.0-beta.80' })).toBeNull()
  })

  it('finds a package in an older version block by its own version', () => {
    expect(extractPackageNotes({ changelog, name: '@kubb/cli', version: '5.0.0-beta.79' })).toBe('#### Bug Fixes\n\n- Cleanup defineLogger')
  })

  it('returns null when the version heading does not exist', () => {
    expect(extractPackageNotes({ changelog, name: '@kubb/ast', version: '9.9.9' })).toBeNull()
  })

  it('returns null when the package has no section in that version', () => {
    expect(extractPackageNotes({ changelog, name: '@kubb/core', version: '5.0.0-beta.80' })).toBeNull()
  })
})
