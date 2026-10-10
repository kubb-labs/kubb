import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../jsxRenderer.tsx'
import { File } from './File.tsx'

describe('File.Source', () => {
  it('returns a Source node with the block attributes and text children', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        <File.Source name="Pet" isExportable isIndexable isTypeOnly>
          {'export type Pet = { id: number }'}
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]).toStrictEqual({
      kind: 'Source',
      name: 'Pet',
      isTypeOnly: true,
      isExportable: true,
      isIndexable: true,
      nodes: [{ kind: 'Text', value: 'export type Pet = { id: number }' }],
    })
  })
})

describe('File copy', () => {
  it('returns a file node carrying the copy path when copy is set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(<File baseName="client.ts" path="src/gen/.kubb/client.ts" copy="/abs/templates/client.ts" />)

    expect(renderer.files[0]).toStrictEqual({
      baseName: 'client.ts',
      path: 'src/gen/.kubb/client.ts',
      meta: {},
      banner: undefined,
      footer: undefined,
      copy: '/abs/templates/client.ts',
      sources: [],
      exports: [],
      imports: [],
    })
  })
})

describe('File.Import', () => {
  it('returns an Import node with the import attributes', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import name={['Pet']} path="./models/pet" isTypeOnly root="/src" />
        <File.Source>{'const p: Pet = {}'}</File.Source>
      </File>,
    )

    expect(renderer.files[0]?.imports[0]).toStrictEqual({
      kind: 'Import',
      name: ['Pet'],
      path: './models/pet',
      root: '/src',
      isTypeOnly: true,
      isNameSpace: false,
    })
  })
})

describe('File.Export', () => {
  it('returns an Export node with the export attributes', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export name={['Pet']} path="./models/pet" isTypeOnly asAlias />
        <File.Source>{'// barrel'}</File.Source>
      </File>,
    )

    expect(renderer.files[0]?.exports[0]).toStrictEqual({
      kind: 'Export',
      name: ['Pet'],
      path: './models/pet',
      isTypeOnly: true,
      asAlias: true,
    })
  })
})
