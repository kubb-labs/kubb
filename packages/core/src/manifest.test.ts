import { describe, expect, it } from 'vitest'
import { isExtensionManifest, isPackageName, isRegistryEntry, manifestProblems } from './manifest.ts'
import type { ExtensionManifest } from './manifest.ts'

const manifest = { kind: 'plugin', name: 'plugin-zod', export: 'pluginZod', displayName: 'Zod', description: 'Generates Zod schemas.' }
const select = {
  key: 'mode',
  path: ['output', 'mode'],
  label: 'Mode',
  type: 'select',
  default: { type: 'named', casing: null },
  choices: [{ value: null }, { value: { casing: null, type: 'named' } }],
}

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

  it('accepts maintainers and dependencies', () => {
    expect(
      isExtensionManifest({
        ...manifest,
        maintainers: [{ name: 'Stijn Van Hulle', github: 'stijnvanhulle' }, { name: 'Acme' }],
        dependencies: ['plugin-ts'],
        optionalDependencies: ['plugin-zod'],
      }),
    ).toBe(true)
  })

  it.each([
    ['an unknown kind', { ...manifest, kind: 'theme' }],
    ['a missing export', { ...manifest, export: undefined }],
    ['an export that is not an identifier', { ...manifest, export: 'x } from "y"' }],
    ['an unknown compatibility key', { ...manifest, compatibility: { kubbb: '>=5' } }],
    ['a maintainer without a name', { ...manifest, maintainers: [{ github: 'stijnvanhulle' }] }],
    ['a maintainer with an empty GitHub name', { ...manifest, maintainers: [{ name: 'Acme', github: '' }] }],
    ['a maintainer with an unknown property', { ...manifest, maintainers: [{ name: 'Acme', githubUrl: 'https://github.com/acme' }] }],
    ['a dependency that is not an extension name', { ...manifest, dependencies: ['../plugin-ts'] }],
    ['an optional dependency that is not an extension name', { ...manifest, optionalDependencies: ['../plugin-faker'] }],
    ['options that are not a list', { ...manifest, options: {} }],
    ['an option without a label', { ...manifest, options: [{ ...select, label: '' }] }],
    ['an option of an unknown type', { ...manifest, options: [{ ...select, type: 'color' }] }],
    ['an option path that reaches a prototype', { ...manifest, options: [{ ...select, path: ['__proto__', 'polluted'] }] }],
    ['a choice without a value', { ...manifest, options: [{ ...select, choices: [{ label: 'Named' }] }] }],
    ['an option that fails manifestProblems', { ...manifest, options: [select, select] }],
  ])('rejects %s', (_label, value) => {
    expect(isExtensionManifest(value)).toBe(false)
  })

  it('accepts a select whose object default equals a choice in another key order', () => {
    expect(isExtensionManifest({ ...manifest, options: [select] })).toBe(true)
  })
})

describe('manifestProblems', () => {
  const problems = (options: Array<unknown>) => manifestProblems({ ...manifest, options } as ExtensionManifest)

  it('reports duplicate keys, a select without choices, and a default that is no choice', () => {
    expect(problems([select, { ...select, choices: [] }, { ...select, key: 'other', default: 'auto' }])).toStrictEqual([
      'option "mode" is declared more than once',
      'option "mode" is a select without choices',
      'option "other" has a default that is not one of its choices',
    ])
  })

  it('passes options without problems', () => {
    expect(problems([select, { key: 'path', path: ['output', 'path'], label: 'Path', type: 'text' }])).toStrictEqual([])
  })
})

describe('isRegistryEntry', () => {
  const entry = {
    id: 'kubb-labs/plugin-zod',
    kind: 'plugin',
    type: 'official',
    artifact: { kind: 'npm', package: '@kubb/plugin-zod', version: '5.4.4' },
    manifest,
    submittedAt: '2026-10-12T20:00:00Z',
    publishedAt: '2026-10-12T20:00:00Z',
    reviewedAt: '2026-10-12T20:00:00Z',
  }

  const github = {
    kind: 'github',
    package: '@acme/kubb-plugin-x',
    version: '1.2.0',
    owner: 'Acme',
    repo: 'kubb-plugin-x',
    tag: 'v1.2.0',
    commit: '0123456789abcdef0123456789abcdef01234567',
  }

  it('accepts a pinned entry with a valid manifest of its kind', () => {
    expect(isRegistryEntry(entry)).toBe(true)
  })

  it.each([
    ['a tag with a leading v', github],
    ['a tag equal to the version', { ...github, tag: '1.2.0' }],
  ])('accepts a GitHub artifact with %s', (_label, artifact) => {
    expect(isRegistryEntry({ ...entry, artifact })).toBe(true)
  })

  it.each([
    ['a bare slug as id', { ...entry, id: 'plugin-zod' }],
    ['an unknown type', { ...entry, type: 'verified' }],
    ['a package name that is a flag', { ...entry, artifact: { ...entry.artifact, package: '--registry=https://evil.test' } }],
    ['a version that is not semver', { ...entry, artifact: { ...entry.artifact, version: 'latest' } }],
    ['an unknown artifact kind', { ...entry, artifact: { ...entry.artifact, kind: 'git' } }],
    ['a GitHub owner that starts with a dash', { ...entry, artifact: { ...github, owner: '-acme' } }],
    ['a GitHub repo of ..', { ...entry, artifact: { ...github, repo: '..' } }],
    ['a short commit', { ...entry, artifact: { ...github, commit: '0123456' } }],
    ['an upper-case commit', { ...entry, artifact: { ...github, commit: github.commit.toUpperCase() } }],
    ['a tag that names another version', { ...entry, artifact: { ...github, tag: 'v1.3.0' } }],
    ['a manifest of another kind', { ...entry, kind: 'adapter' }],
    ['an invalid manifest', { ...entry, manifest: { ...manifest, export: '' } }],
  ])('rejects %s', (_label, value) => {
    expect(isRegistryEntry(value)).toBe(false)
  })
})
