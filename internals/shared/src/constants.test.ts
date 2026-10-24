import { describe, expect, it } from 'vitest'
import { dependencies } from '../../../packages/kubb/package.json'
import { BUNDLED_PACKAGES } from './constants.ts'

describe('BUNDLED_PACKAGES', () => {
  it('lists the extensions the kubb package depends on', () => {
    const extensions = Object.keys(dependencies).filter((name) => /^@kubb\/(adapter|parser|plugin)-/.test(name))

    expect([...BUNDLED_PACKAGES].sort()).toStrictEqual(extensions.sort())
  })
})
