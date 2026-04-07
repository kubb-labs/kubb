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
    expect(renderer.files[0]?.path).toBe('src/models/pet.ts')
    renderer.unmount()
  })

  it('should render multiple files', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <>
        <File baseName="pet.ts" path="src/models/pet.ts">
          <File.Source name="Pet" isExportable isIndexable>
            {'export type Pet = { id: number }'}
          </File.Source>
        </File>
        <File baseName="store.ts" path="src/models/store.ts">
          <File.Source name="Store" isExportable isIndexable>
            {'export type Store = { pets: Pet[] }'}
          </File.Source>
        </File>
      </>,
    )

    expect(renderer.files.length).toBe(2)
    renderer.unmount()
  })

  it('should unmount cleanly', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Source>{'export * from "./pet"'}</File.Source>
      </File>,
    )
    expect(() => renderer.unmount()).not.toThrow()
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
  it('should render a file with baseName and path', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="pet.ts" path="src/models/pet.ts">
        <File.Source name="Pet" isExportable isIndexable>
          {'export type Pet = { id: number; name: string }'}
        </File.Source>
      </File>,
    )

    const file = renderer.files[0]
    expect(file?.baseName).toBe('pet.ts')
    expect(file?.path).toBe('src/models/pet.ts')
    renderer.unmount()
  })

  it('should render children inline when baseName is missing', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File path="src/models/pet.ts">
        <File.Source name="Inline" isExportable isIndexable>
          {'export type Inline = string'}
        </File.Source>
      </File>,
    )

    // No file registered, inline render
    expect(renderer.files.length).toBe(0)
    renderer.unmount()
  })

  it('should collect meta, banner, and footer', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="pet.ts" path="src/models/pet.ts" meta={{ tag: 'pet' }} banner="// banner" footer="// footer">
        <File.Source>{'export type Pet = unknown'}</File.Source>
      </File>,
    )

    const file = renderer.files[0]
    expect(file?.meta).toEqual({ tag: 'pet' })
    expect(file?.banner).toBe('// banner')
    expect(file?.footer).toBe('// footer')
    renderer.unmount()
  })
})

describe('File.Source component', () => {
  it('should register a named exportable source block', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        <File.Source name="Pet" isExportable isIndexable>
          {'export type Pet = { id: number }'}
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    expect(sources.length).toBe(1)
    expect(sources[0]?.name).toBe('Pet')
    expect(sources[0]?.isExportable).toBe(true)
    expect(sources[0]?.isIndexable).toBe(true)
    renderer.unmount()
  })

  it('should register a type-only source block', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="PetId" isTypeOnly isExportable>
          {'export type PetId = string'}
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    expect(sources[0]?.isTypeOnly).toBe(true)
    renderer.unmount()
  })

  it('should register multiple source blocks', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        <File.Source name="Pet" isExportable>
          {'export type Pet = { id: number }'}
        </File.Source>
        <File.Source name="Store" isExportable>
          {'export type Store = { pets: Pet[] }'}
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    expect(sources.length).toBe(2)
    renderer.unmount()
  })
})

describe('File.Import component', () => {
  it('should register a named import', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import name={['useState']} path="react" />
        <File.Source>{'const x = useState(0)'}</File.Source>
      </File>,
    )

    const imports = renderer.files[0]?.imports ?? []
    expect(imports.length).toBe(1)
    expect(imports[0]?.path).toBe('react')
    renderer.unmount()
  })

  it('should register a type-only import', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import name={['Pet']} path="./models/pet" isTypeOnly />
        <File.Source>{'export type Client = { pet: Pet }'}</File.Source>
      </File>,
    )

    const imports = renderer.files[0]?.imports ?? []
    expect(imports[0]?.isTypeOnly).toBe(true)
    renderer.unmount()
  })

  it('should register a namespace import', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="schema.ts" path="src/schema.ts">
        <File.Import name="z" path="zod" isNameSpace />
        <File.Source>{'export const schema = z.string()'}</File.Source>
      </File>,
    )

    const imports = renderer.files[0]?.imports ?? []
    expect(imports[0]?.isNameSpace).toBe(true)
    renderer.unmount()
  })

  it('should register an import with root', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import name={['Pet']} path="./models/pet" root="/src" />
        <File.Source>{'const p: Pet = {}'}</File.Source>
      </File>,
    )

    const imports = renderer.files[0]?.imports ?? []
    expect(imports[0]?.root).toBe('/src')
    renderer.unmount()
  })
})

describe('File.Export component', () => {
  it('should register a named export', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export name={['Pet']} path="./models/pet" />
        <File.Source>{'// barrel'}</File.Source>
      </File>,
    )

    const exports = renderer.files[0]?.exports ?? []
    expect(exports.length).toBe(1)
    expect(exports[0]?.path).toBe('./models/pet')
    renderer.unmount()
  })

  it('should register a type-only wildcard export', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export path="./models/pet" isTypeOnly />
        <File.Source>{'// barrel'}</File.Source>
      </File>,
    )

    const exports = renderer.files[0]?.exports ?? []
    expect(exports[0]?.isTypeOnly).toBe(true)
    renderer.unmount()
  })

  it('should register an alias export', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export name={['Pet']} path="./models/pet" asAlias />
        <File.Source>{'// barrel'}</File.Source>
      </File>,
    )

    const exports = renderer.files[0]?.exports ?? []
    expect(exports[0]?.asAlias).toBe(true)
    renderer.unmount()
  })
})

describe('Function component', () => {
  it('should render a basic function inside a source block', async () => {
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

    const sources = renderer.files[0]?.sources ?? []
    expect(sources.length).toBe(1)
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Function')
    renderer.unmount()
  })

  it('should render an async function', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="api.ts" path="src/api.ts">
        <File.Source name="fetchPet" isExportable>
          <Function export async name="fetchPet" params="id: string" returnType="Pet">
            {'return fetch(`/pets/${id}`)'}
          </Function>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Function')
    renderer.unmount()
  })

  it('should render a function with generics array', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="api.ts" path="src/api.ts">
        <File.Source name="identity" isExportable>
          <Function export name="identity" generics={['T']} params="value: T" returnType="T">
            {'return value'}
          </Function>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Function')
    renderer.unmount()
  })

  it('should render a function with JSDoc', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="api.ts" path="src/api.ts">
        <File.Source name="greet" isExportable>
          <Function export name="greet" params="name: string" JSDoc={{ comments: ['@param name The name to greet'] }}>
            {'return `Hello, ${name}`'}
          </Function>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Function')
    renderer.unmount()
  })

  it('should render a default exported function', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="main.ts" path="src/main.ts">
        <File.Source name="main" isExportable>
          <Function export default name="main">{'// main'}</Function>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Function')
    renderer.unmount()
  })
})

describe('Function.Arrow component', () => {
  it('should render an arrow function', async () => {
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

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('ArrowFunction')
    renderer.unmount()
  })

  it('should render an async arrow function', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="utils.ts" path="src/utils.ts">
        <File.Source name="fetchData" isExportable>
          <Function.Arrow export async name="fetchData" params="url: string">
            {'return fetch(url)'}
          </Function.Arrow>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('ArrowFunction')
    renderer.unmount()
  })

  it('should render an arrow function with generics string', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="utils.ts" path="src/utils.ts">
        <File.Source name="wrap" isExportable>
          <Function.Arrow export name="wrap" generics="T" params="val: T" returnType="T" singleLine>
            {'val'}
          </Function.Arrow>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('ArrowFunction')
    renderer.unmount()
  })

  it('should render an arrow function with JSDoc', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="utils.ts" path="src/utils.ts">
        <File.Source name="noop" isExportable>
          <Function.Arrow export name="noop" JSDoc={{ comments: ['@description Does nothing'] }}>
            {'// noop'}
          </Function.Arrow>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('ArrowFunction')
    renderer.unmount()
  })
})

describe('Const component', () => {
  it('should render a basic const declaration', async () => {
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

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Const')
    renderer.unmount()
  })

  it('should render a const with type annotation', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="config.ts" path="src/config.ts">
        <File.Source name="petSchema" isExportable>
          <Const export name="petSchema" type="z.ZodType<Pet>">
            {'z.object({ id: z.number() })'}
          </Const>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Const')
    renderer.unmount()
  })

  it('should render a const with asConst', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="config.ts" path="src/config.ts">
        <File.Source name="METHODS" isExportable>
          <Const export name="METHODS" asConst>
            {"['GET', 'POST']"}
          </Const>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Const')
    renderer.unmount()
  })

  it('should render a const with JSDoc', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="config.ts" path="src/config.ts">
        <File.Source name="MAX_RETRIES" isExportable>
          <Const export name="MAX_RETRIES" JSDoc={{ comments: ['@description Maximum retry count'] }}>
            {'3'}
          </Const>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Const')
    renderer.unmount()
  })
})

describe('Type component', () => {
  it('should render a basic type alias', async () => {
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

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Type')
    renderer.unmount()
  })

  it('should render a type alias with JSDoc', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="Pet" isExportable>
          <Type export name="Pet" JSDoc={{ comments: ['@description A pet in the store.'] }}>
            {'{ id: number; name: string }'}
          </Type>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    const node = sources[0]?.nodes[0]
    expect(node?.kind).toBe('Type')
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
  it('should render a JSX string inside a function body', async () => {
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

    const sources = renderer.files[0]?.sources ?? []
    expect(sources.length).toBe(1)
    const funcNode = sources[0]?.nodes[0]
    expect(funcNode?.kind).toBe('Function')
    renderer.unmount()
  })

  it('should render a JSX fragment string', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="Fragment.tsx" path="src/Fragment.tsx">
        <File.Source name="FragmentComponent" isExportable>
          <Function export name="FragmentComponent">
            <Jsx>{'return (<><div>A</div><div>B</div></>)'}</Jsx>
          </Function>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    expect(sources.length).toBe(1)
    renderer.unmount()
  })

  it('should render without children', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="empty.tsx" path="src/empty.tsx">
        <File.Source name="Empty" isExportable>
          <Function export name="Empty">
            <Jsx />
          </Function>
        </File.Source>
      </File>,
    )

    const sources = renderer.files[0]?.sources ?? []
    expect(sources.length).toBe(1)
    renderer.unmount()
  })
})
