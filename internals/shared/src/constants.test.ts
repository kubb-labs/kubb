import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BUNDLED_PACKAGES } from './constants.ts'

const kubbPackage = JSON.parse(readFileSync(new URL('../../../packages/kubb/package.json', import.meta.url), 'utf8')) as {
  dependencies: Record<string, string>
}

describe('BUNDLED_PACKAGES', () => {
  it('lists every adapter, parser and plugin the kubb package depends on', () => {
    const extensions = Object.keys(kubbPackage.dependencies).filter((name) => /^@kubb\/(adapter|parser|plugin)-/.test(name))

    expect([...BUNDLED_PACKAGES].sort()).toStrictEqual(extensions.sort())
  })
})
