import { describe, expect, it } from 'vitest'
import { Const } from './components/Const.tsx'
import { File } from './components/File.tsx'
import { Function } from './components/Function.tsx'
import { Jsx } from './components/Jsx.tsx'
import { Type } from './components/Type.tsx'
import { createRenderer } from './createRenderer.tsx'

describe('createRenderer', () => {
  it('should render and collect files', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="pet.ts" path="src/models/pet.ts">
        <File.Source name="Pet" isExportable isIndexable>
          {'export type Pet = { id: number; name: string }'}
        </File.Source>
      </File>,
    )

    expect(renderer.files.length).toBe(1)
    expect(renderer.files[0]?.baseName).toBe('pet.ts')
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

describe('File component', () => {
  it('should render children inline when baseName is missing', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File path="src/models/pet.ts">
        <File.Source name="Inline" isExportable isIndexable>
          {'export type Inline = string'}
        </File.Source>
      </File>,
    )

    expect(renderer.files.length).toBe(0)
    renderer.unmount()
  })
})

describe('File.Source component', () => {
  it('should register source block attributes', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        <File.Source name="Pet" isExportable isIndexable isTypeOnly>
          {'export type Pet = { id: number }'}
        </File.Source>
      </File>,
    )

    const source = renderer.files[0]?.sources[0]
    expect(source?.name).toBe('Pet')
    expect(source?.isExportable).toBe(true)
    expect(source?.isIndexable).toBe(true)
    expect(source?.isTypeOnly).toBe(true)
    renderer.unmount()
  })
})

describe('File.Import component', () => {
  it('should register import attributes', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import name={['Pet']} path="./models/pet" isTypeOnly root="/src" />
        <File.Source>{'const p: Pet = {}'}</File.Source>
      </File>,
    )

    const imp = renderer.files[0]?.imports[0]
    expect(imp?.path).toBe('./models/pet')
    expect(imp?.isTypeOnly).toBe(true)
    expect(imp?.root).toBe('/src')
    renderer.unmount()
  })
})

describe('File.Export component', () => {
  it('should register export attributes', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export name={['Pet']} path="./models/pet" isTypeOnly asAlias />
        <File.Source>{'// barrel'}</File.Source>
      </File>,
    )

    const exp = renderer.files[0]?.exports[0]
    expect(exp?.path).toBe('./models/pet')
    expect(exp?.isTypeOnly).toBe(true)
    expect(exp?.asAlias).toBe(true)
    renderer.unmount()
  })
})

describe('Function component', () => {
  it('should emit a Function node inside a source block', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="api.ts" path="src/api.ts">
        <File.Source name="getPet" isExportable>
          <Function export name="getPet" params="petId: string" returnType="string">
            {'return petId'}
          </Function>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('Function')
    renderer.unmount()
  })
})

describe('Function.Arrow component', () => {
  it('should emit an ArrowFunction node inside a source block', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="utils.ts" path="src/utils.ts">
        <File.Source name="double" isExportable>
          <Function.Arrow export name="double" params="n: number" returnType="number" singleLine>
            {'n * 2'}
          </Function.Arrow>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('ArrowFunction')
    renderer.unmount()
  })
})

describe('Const component', () => {
  it('should emit a Const node inside a source block', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="config.ts" path="src/config.ts">
        <File.Source name="BASE_URL" isExportable>
          <Const export name="BASE_URL">
            {'"https://api.example.com"'}
          </Const>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('Const')
    renderer.unmount()
  })
})

describe('Type component', () => {
  it('should emit a Type node inside a source block', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="PetId" isExportable>
          <Type export name="PetId">
            {'string | number'}
          </Type>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('Type')
    renderer.unmount()
  })

  it('should throw when name does not start with an uppercase letter', () => {
    const renderer = createRenderer()
    const renderPromise = renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="petId" isExportable>
          <Type export name="petId">
            {'string'}
          </Type>
        </File.Source>
      </File>,
    )
    renderer.unmount()
    return expect(renderPromise).rejects.toThrow('Name should start with a capital letter')
  })
})

describe('Jsx component', () => {
  it('should emit a Jsx node inside a function body', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="Component.tsx" path="src/Component.tsx">
        <File.Source name="MyComponent" isExportable>
          <Function export name="MyComponent">
            <Jsx>{'return (<div>Hello</div>)'}</Jsx>
          </Function>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('Function')
    renderer.unmount()
  })
})
