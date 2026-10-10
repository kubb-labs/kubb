import { describe, expect, it } from 'vitest'
import { Const } from './components/js/Const.tsx'
import { File } from './components/File.tsx'
import { Function } from './components/js/Function.tsx'
import { Type } from './components/js/Type.tsx'
import { jsxRenderer } from './jsxRenderer.tsx'

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
        generics: 'T, U',
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

  it('propagates render errors', async () => {
    const renderer = jsxRenderer()
    function BadComponent(): never {
      throw new Error('render error')
    }
    await expect(
      renderer.render(
        <File baseName="bad.ts" path="src/bad.ts">
          <BadComponent />
        </File>,
      ),
    ).rejects.toThrow('render error')
  })

  it('accumulates files across multiple render calls', async () => {
    const renderer = jsxRenderer()

    await renderer.render(
      <File baseName="first.ts" path="src/first.ts">
        <File.Source name="A" isExportable>
          <Const export name="A">
            {'"first"'}
          </Const>
        </File.Source>
      </File>,
    )

    await renderer.render(
      <File baseName="second.ts" path="src/second.ts">
        <File.Source name="B" isExportable>
          <Const export name="B">
            {'"second"'}
          </Const>
        </File.Source>
      </File>,
    )

    expect(renderer.files.map((file) => file.baseName)).toStrictEqual(['first.ts', 'second.ts'])
  })
})
