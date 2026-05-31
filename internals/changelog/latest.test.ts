import { describe, expect, it } from 'vitest'

import { getLatestSection } from './latest.mjs'

const changelog = `# Changelog

## v5.0.0-beta.35 — May 30, 2026

### @kubb/core

#### Bug Fixes

- Tighten internal type safety.

### Contributors

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.34 — May 29, 2026

### @kubb/ast

#### Features

- Export the type guards.
`

describe('getLatestSection', () => {
  it('returns the most recent block without its version heading', () => {
    expect(getLatestSection(changelog)).toBe(
      `### @kubb/core

#### Bug Fixes

- Tighten internal type safety.

### Contributors

[@stijnvanhulle](https://github.com/stijnvanhulle)`,
    )
  })

  it('returns an empty string when there is no version block', () => {
    expect(getLatestSection('# Changelog\n')).toBe('')
  })
})
