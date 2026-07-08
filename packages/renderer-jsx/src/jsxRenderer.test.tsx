import { describe, expect, it } from 'vitest'
import { Const } from './components/js/Const.tsx'
import { File } from './components/File.tsx'
import { Function } from './components/js/Function.tsx'
import { Type } from './components/js/Type.tsx'
import { jsxRenderer } from './jsxRenderer.tsx'

describe('jsxRenderer', () => {
  it('should collect imports, exports, and typed source nodes from multiple files', async () => {
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

  it('should propagate render errors', async () => {
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

  it('should accumulate files across multiple render calls', async () => {
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

    expect(renderer.files.length).toBe(2)
    expect(renderer.files.find((f) => f.baseName === 'first.ts')).toBeDefined()
    expect(renderer.files.find((f) => f.baseName === 'second.ts')).toBeDefined()
  })

  it('ignores a foreign element whose $$typeof is not the Kubb brand', async () => {
    const renderer = jsxRenderer()
    // A React element carries `Symbol.for('react.element')`, not the Kubb brand, so the renderer
    // must skip it instead of mistaking it for a `<File>`.
    const reactElement = {
      $$typeof: Symbol.for('react.element'),
      type: 'kubb-file',
      props: { baseName: 'foreign.ts', path: 'src/foreign.ts', children: [] },
      key: null,
    }

    await renderer.render(reactElement)

    expect(renderer.files).toHaveLength(0)
  })

  it('skips a foreign child element inside a File', async () => {
    const renderer = jsxRenderer()
    // The same foreign brand nested as a child: the child walk must not collect it as an import.
    const foreignImport = {
      $$typeof: Symbol.for('react.element'),
      type: 'kubb-import',
      props: { name: ['z'], path: 'zod' },
      key: null,
    }

    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        {foreignImport}
      </File>,
    )

    const file = renderer.files.find((f) => f.baseName === 'models.ts')
    expect(file).toBeDefined()
    expect(file?.imports).toHaveLength(0)
  })
})
