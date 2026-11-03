import { describe, expect, it } from 'vitest'
import { Const } from './components/js/Const.tsx'
import { File } from './components/File.tsx'
import { Function } from './components/js/Function.tsx'
import { Type } from './components/js/Type.tsx'
import { jsxRenderer } from './jsxRenderer.ts'

describe('jsxRenderer', () => {
  it('collects imports, exports, and typed source nodes from multiple files', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <>
        <File baseName="models.ts" path="src/models.ts">
          <File.Import name={['z']} path="zod" />
          <File.Export name={['Pet']} path="./models" isTypeOnly />
          <File.Source name="Pet" isExportable isIndexable isTypeOnly>
            <Type export name="Pet">
              {'{ id: number; name: string }'}
            </Type>
          </File.Source>
        </File>
        <File baseName="client.ts" path="src/client.ts">
          <File.Source name="BASE_URL" isExportable>
            <Const export name="BASE_URL">
              {'"https://api.example.com"'}
            </Const>
          </File.Source>
          <File.Source name="getPet" isExportable>
            <Function export name="getPet" params="id: number" returnType="string">
              {'return String(id)'}
            </Function>
          </File.Source>
        </File>
      </>,
    )

    expect(renderer.files.length).toBe(2)

    const models = renderer.files.find((f) => f.baseName === 'models.ts')
    expect(models?.imports[0]?.path).toBe('zod')
    expect(models?.exports[0]?.isTypeOnly).toBe(true)
    expect(models?.sources[0]?.nodes?.[0]?.kind).toBe('Type')

    const client = renderer.files.find((f) => f.baseName === 'client.ts')
    expect(client?.sources[0]?.nodes?.[0]?.kind).toBe('Const')
    expect(client?.sources[1]?.nodes?.[0]?.kind).toBe('Function')
  })

  it('maps Function, Function.Arrow, and Const props onto code nodes', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Source name="getPet" isExportable>
          <Function
            export
            default={false}
            async
            name="getPet"
            generics={['T', 'U']}
            params="id: T"
            returnType="Promise<U>"
            JSDoc={{ comments: ['@description Fetch a pet'] }}
          >
            {'return fetch(id)'}
          </Function>
          <Function.Arrow export={false} default={false} async={false} name="double" generics="T" params="n: T" returnType="T" singleLine JSDoc={null}>
            {'n * 2'}
          </Function.Arrow>
          <Const export name="BASE_URL" type="string" asConst JSDoc={null}>
            {'"https://api.example.com"'}
          </Const>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes).toStrictEqual([
      {
        kind: 'Function',
        name: 'getPet',
        params: 'id: T',
        export: true,
        default: false,
        async: true,
        generics: ['T', 'U'],
        returnType: 'Promise<U>',
        JSDoc: { comments: ['@description Fetch a pet'] },
        nodes: [{ kind: 'Text', value: 'return fetch(id)' }],
      },
      {
        kind: 'ArrowFunction',
        name: 'double',
        params: 'n: T',
        export: false,
        default: false,
        async: false,
        generics: 'T',
        returnType: 'T',
        singleLine: true,
        JSDoc: null,
        nodes: [{ kind: 'Text', value: 'n * 2' }],
      },
      {
        kind: 'Const',
        name: 'BASE_URL',
        type: 'string',
        export: true,
        asConst: true,
        JSDoc: null,
        nodes: [{ kind: 'Text', value: '"https://api.example.com"' }],
      },
    ])
  })

  it('emits a Break node when a br element appears inside File.Source', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="a.ts" path="src/a.ts">
        <File.Source>
          {'const a = 1'}
          <br />
          {'const b = 2'}
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes).toStrictEqual([
      { kind: 'Text', value: 'const a = 1' },
      { kind: 'Break' },
      { kind: 'Text', value: 'const b = 2' },
    ])
  })

  it('keeps the pointer a File.Source carries back to the input', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="pet.ts" path="src/pet.ts">
        <File.Source name="Pet" pointer="#/components/schemas/Pet" isExportable>
          {'export type Pet = { id: number }'}
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]).toMatchObject({ name: 'Pet', pointer: '#/components/schemas/Pet' })
  })

  it('throws when text appears outside File.Source', async () => {
    const renderer = jsxRenderer()

    await expect(
      renderer.render(
        <File baseName="bad.ts" path="src/bad.ts">
          {'stray text'}
        </File>,
      ),
    ).rejects.toThrow("[jsx] 'stray text' should be part of <File.Source> component when using the <File/> component")
  })

  it('renders nested files inline when File has no baseName', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File>
        <File baseName="inner.ts" path="src/inner.ts" />
      </File>,
    )

    expect(renderer.files.map((file) => file.baseName)).toStrictEqual(['inner.ts'])
  })

  it('renders every file in a nested children array', async () => {
    const renderer = jsxRenderer()
    const files = [
      <File key="a" baseName="a.ts" path="src/a.ts" />,
      [<File key="b" baseName="b.ts" path="src/b.ts" />, [<File key="c" baseName="c.ts" path="src/c.ts" />]],
    ]
    await renderer.render(<>{files}</>)

    expect(renderer.files.map((file) => file.baseName)).toStrictEqual(['a.ts', 'b.ts', 'c.ts'])
  })
})

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
