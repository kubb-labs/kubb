import { describe, expect, it } from 'vitest'
import { isExtensionManifest, isPackageName } from './manifest.ts'

const manifest = { kind: 'plugin', name: 'plugin-zod', export: 'pluginZod', displayName: 'Zod', description: 'Generates Zod schemas.' }

describe('isPackageName', () => {
  it.each(['@kubb/plugin-ts', 'kubb', '@acme/kubb-plugin-x', 'lodash.merge'])('accepts %s', (name) => {
    expect(isPackageName(name)).toBe(true)
  })

  it.each(['./plugin.ts', '/abs/plugin', 'https://example.com/x.js', 'node:fs', '--registry=evil', 'Upper', '@kubb/plugin-ts/sub', ''])(
    'rejects %s',
    (name) => {
      expect(isPackageName(name)).toBe(false)
    },
  )
})

describe('isExtensionManifest', () => {
  it('accepts a manifest with the required fields', () => {
    expect(isExtensionManifest({ ...manifest, compatibility: { kubb: '>=5.8.0', node: '>=22' }, options: [] })).toBe(true)
  })

  it.each([
    ['an unknown kind', { ...manifest, kind: 'theme' }],
    ['a missing export', { ...manifest, export: undefined }],
    ['an export that is not an identifier', { ...manifest, export: 'x } from "y"' }],
    ['an unknown compatibility key', { ...manifest, compatibility: { kubbb: '>=5' } }],
    ['options that are not a list', { ...manifest, options: {} }],
  ])('rejects %s', (_label, value) => {
    expect(isExtensionManifest(value)).toBe(false)
  })
})
