import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { definePlugin } from './definePlugin.ts'
import type { KubbManifest } from './manifest.ts'
import { getExtensionManifest, readExtensionManifest, toExtensionManifest, toOptionsDocument } from './manifest.ts'
import type { StandardJSONSchemaV1, StandardSchemaV1 } from './standardSchema.ts'

function createSchema(jsonSchema?: Record<string, unknown>): StandardSchemaV1<object> {
  const props: StandardSchemaV1.Props<object> & Partial<Pick<StandardJSONSchemaV1.Props, 'jsonSchema'>> = {
    version: 1,
    vendor: 'test',
    validate: (value) => ({ value: value as object }),
    ...(jsonSchema && { jsonSchema: { input: () => jsonSchema, output: () => jsonSchema } }),
  }
  return { '~standard': props }
}

const optionsJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: { tag: { type: 'string', default: 'pets' } },
}

describe('toOptionsDocument', () => {
  it('converts a schema with a Standard JSON Schema converter, without $schema', () => {
    expect(toOptionsDocument(createSchema(optionsJsonSchema))).toStrictEqual({ type: 'object', properties: { tag: { type: 'string', default: 'pets' } } })
  })

  it('returns {} without a schema or a converter', () => {
    expect(toOptionsDocument(undefined)).toStrictEqual({})
    expect(toOptionsDocument(createSchema())).toStrictEqual({})
  })
})

describe('toExtensionManifest', () => {
  it('builds an entry from meta and the schema, converting contributed schemas', () => {
    const manifest = toExtensionManifest({
      kind: 'plugin',
      meta: { name: 'plugin-a', tags: ['a'], contributes: { output: createSchema({ type: 'object' }) } },
      schema: createSchema(optionsJsonSchema),
      exportName: 'pluginA',
    })

    expect(manifest).toStrictEqual({
      kind: 'plugin',
      export: 'pluginA',
      meta: { name: 'plugin-a', tags: ['a'], contributes: { output: { type: 'object' } } },
      options: { type: 'object', properties: { tag: { type: 'string', default: 'pets' } } },
    })
  })
})

describe('readExtensionManifest and getExtensionManifest', () => {
  let cwd: string
  const shipped: KubbManifest = {
    name: 'kubb-plugin-a',
    version: '1.0.0',
    extensions: [{ kind: 'plugin', meta: { name: 'plugin-a', description: 'Shipped.' }, options: { type: 'object' } }],
  }

  async function installPackage(name: string, packageJson: Record<string, unknown>, manifest?: KubbManifest) {
    const directory = path.join(cwd, 'node_modules', name)
    await mkdir(path.join(directory, 'dist'), { recursive: true })
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({ name, version: '1.0.0', ...packageJson }))
    if (manifest) await writeFile(path.join(directory, 'dist', 'kubb.json'), JSON.stringify(manifest))
  }

  beforeEach(async () => {
    cwd = await mkdtemp(path.join(os.tmpdir(), 'kubb-manifest-'))
  })

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  it('reads the manifest package.json#kubb points to', async () => {
    await installPackage('kubb-plugin-a', { kubb: './dist/kubb.json' }, shipped)

    expect(await readExtensionManifest('kubb-plugin-a', { cwd })).toStrictEqual(shipped)
  })

  it('returns undefined for a missing package, field or file', async () => {
    await installPackage('kubb-plugin-b', {})
    await installPackage('kubb-plugin-c', { kubb: './dist/kubb.json' })

    expect(await readExtensionManifest('kubb-plugin-missing', { cwd })).toBeUndefined()
    expect(await readExtensionManifest('kubb-plugin-b', { cwd })).toBeUndefined()
    expect(await readExtensionManifest('kubb-plugin-c', { cwd })).toBeUndefined()
  })

  it('prefers the shipped manifest entry', async () => {
    await installPackage('kubb-plugin-a', { kubb: './dist/kubb.json' }, shipped)
    const pluginA = definePlugin({ meta: { name: 'plugin-a' }, schema: createSchema(optionsJsonSchema) })

    expect(await getExtensionManifest(pluginA, { cwd, packageName: 'kubb-plugin-a' })).toStrictEqual(shipped.extensions[0])
    expect(await getExtensionManifest(pluginA(), { cwd, packageName: 'kubb-plugin-a' })).toStrictEqual(shipped.extensions[0])
  })

  it('builds the entry from meta and the schema without a shipped manifest', async () => {
    const pluginA = definePlugin({ meta: { name: 'plugin-a' }, schema: createSchema(optionsJsonSchema) })

    expect(await getExtensionManifest(pluginA(), { cwd, packageName: 'kubb-plugin-missing' })).toStrictEqual({
      kind: 'plugin',
      meta: { name: 'plugin-a' },
      options: { type: 'object', properties: { tag: { type: 'string', default: 'pets' } } },
    })
  })

  it('returns {} options for an extension without a schema', async () => {
    expect(await getExtensionManifest({ name: 'plugin-legacy', hooks: {} } as never, { cwd })).toStrictEqual({
      kind: 'plugin',
      meta: { name: 'plugin-legacy' },
      options: {},
    })
  })
})
