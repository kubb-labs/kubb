import { describe, expect, it } from 'vitest'
import { Const } from './components/Const.tsx'
import { File } from './components/File.tsx'
import { Function } from './components/Function.tsx'
import { Type } from './components/Type.tsx'
import { createRenderer } from './createRenderer.tsx'

describe('createRenderer', () => {
  it('should collect imports, exports, and typed source nodes from multiple files', async () => {
    const renderer = createRenderer()
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

    renderer.unmount()
  })

  it('should propagate render errors', async () => {
    const renderer = createRenderer()
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
    renderer.unmount()
  })
})
