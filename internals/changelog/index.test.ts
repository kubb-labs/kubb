import { describe, expect, it } from 'vitest'

import { getPrimaryPackage } from './index.mjs'

describe('getPrimaryPackage', () => {
  it('keeps only the first package for a multi-package changeset', () => {
    expect(
      getPrimaryPackage({
        '@kubb/plugin-barrel': 'patch',
        'unplugin-kubb': 'patch',
      }),
    ).toStrictEqual(['@kubb/plugin-barrel', 'patch'])
  })

  it('returns undefined when the changeset has no packages', () => {
    expect(getPrimaryPackage({})).toBeUndefined()
  })
})
