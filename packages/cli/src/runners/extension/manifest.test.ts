import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { annotateOptions, buildManifest, collectExtensions, readPackageFields, resolveBuiltEntry } from './manifest.ts'

const fixtures = path.join(import.meta.dirname, '__fixtures__')

describe('buildManifest', () => {
  it('merges a union of option objects, such as OutputOptions, into one object', async () => {
    const manifest = await buildManifest({ cwd: path.join(fixtures, 'output-options'), entry: 'src/index.ts' })
    const { properties } = manifest.extensions[0]!.options

    expect(Object.keys(properties!)).toStrictEqual(['output', 'group', 'casing'])
    expect(properties!.output!.required).toStrictEqual(['path'])
    expect(properties!.output!.properties!.mode).toMatchObject({ type: 'string', enum: ['directory', 'file'], 'x-kubb-type': "'directory' | 'file'" })
    expect(properties!.casing).toMatchObject({ enum: ['camel', 'snake'], default: 'camel', description: 'Casing of names.' })
  })
})

describe('annotateOptions', () => {
  it('annotates options inside anyOf branches and $ref targets, and keeps a schema default', () => {
    const document = annotateOptions(
      {
        type: 'object',
        properties: {
          dateType: { anyOf: [{ type: 'string' }, { type: 'object', properties: { date: { type: 'string' } } }] },
          tree: { $ref: '#/$defs/tree' },
          tag: { type: 'string', default: 'pets' },
        },
        $defs: { tree: { type: 'object', properties: { depth: { type: 'number' } } } },
      },
      [
        { path: ['dateType', 'date'], annotation: { type: 'DateType', description: 'Date format.' } },
        { path: ['tree', 'depth'], annotation: { type: 'number', default: { value: 3 } } },
        { path: ['tag'], annotation: { type: 'string', default: { value: 'users' } } },
        { path: ['tag'], annotation: { type: 'never', description: 'Ignored, the first annotation of a path wins.' } },
      ],
    )

    expect(document.properties!.dateType!.anyOf![1]!.properties!.date).toStrictEqual({ type: 'string', description: 'Date format.', 'x-kubb-type': 'DateType' })
    expect(document.$defs!.tree!.properties!.depth).toStrictEqual({ type: 'number', default: 3, 'x-kubb-type': 'number' })
    expect(document.properties!.tag).toStrictEqual({ type: 'string', default: 'pets', 'x-kubb-type': 'string' })
  })
})

describe('collectExtensions', () => {
  it('returns each factory once and skips other exports', () => {
    const pluginA = Object.assign(() => ({}), { kind: 'plugin', meta: { name: 'plugin-a' } })
    const helper = Object.assign(() => ({}), { kind: 'helper', meta: { name: 'helper' } })

    expect(collectExtensions({ default: pluginA, pluginA, helper, version: '1.0.0' })).toStrictEqual([
      { exportName: 'default', kind: 'plugin', meta: { name: 'plugin-a' } },
    ])
  })
})

describe('resolveBuiltEntry', () => {
  it('prefers the import condition of exports["."], then module, then main', () => {
    expect(resolveBuiltEntry({ exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js', require: './dist/index.cjs' } } }, '/pkg')).toBe(
      path.resolve('/pkg', 'dist/index.js'),
    )
    expect(resolveBuiltEntry({ exports: './dist/main.js' }, '/pkg')).toBe(path.resolve('/pkg', 'dist/main.js'))
    expect(resolveBuiltEntry({ module: './dist/index.mjs', main: './dist/index.cjs' }, '/pkg')).toBe(path.resolve('/pkg', 'dist/index.mjs'))
  })

  it('throws without an entry', () => {
    expect(() => resolveBuiltEntry({}, '/pkg')).toThrow('package.json has no `exports`, `module` or `main` entry')
  })
})

describe('readPackageFields', () => {
  it('normalizes the repository, bugs and people', () => {
    expect(
      readPackageFields({
        name: '@kubb/adapter-oas',
        version: '5.8.0',
        repository: { url: 'git+https://github.com/kubb-labs/kubb.git', directory: 'packages/adapter-oas' },
        bugs: { url: 'https://github.com/kubb-labs/kubb/issues' },
        author: 'stijnvanhulle',
        engines: { node: '>=22' },
      }),
    ).toStrictEqual({
      $schema: 'https://kubb.dev/schemas/kubb.json',
      name: '@kubb/adapter-oas',
      version: '5.8.0',
      repository: { url: 'https://github.com/kubb-labs/kubb', directory: 'packages/adapter-oas' },
      bugs: 'https://github.com/kubb-labs/kubb/issues',
      contributors: [{ name: 'stijnvanhulle' }],
      engines: { node: '>=22' },
    })
  })

  it('throws without a name or version', () => {
    expect(() => readPackageFields({ name: 'kubb-plugin-a' })).toThrow('package.json needs a `name` and a `version`')
  })
})
