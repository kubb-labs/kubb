import { describe, expect, it } from 'vitest'
import { appendChildNode, createNode, createTextNode, setAttribute } from './dom.ts'
import { processFiles, squashExportNodes, squashImportNodes, squashSourceNodes } from './utils.ts'

describe('squashSourceNodes', () => {
  it('should return empty set when no source nodes exist', () => {
    const root = createNode('kubb-root')
    const result = squashSourceNodes(root, [])
    expect(result.size).toBe(0)
  })

  it('should collect a basic source node', () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'MyType')
    setAttribute(source, 'isExportable', true)
    setAttribute(source, 'isIndexable', true)
    setAttribute(source, 'isTypeOnly', false)

    appendChildNode(root, file)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.name).toBe('MyType')
    expect(node.isExportable).toBe(true)
    expect(node.isIndexable).toBe(true)
    expect(node.isTypeOnly).toBe(false)
  })

  it('should include text children in source nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Foo')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const text = createTextNode('export type Foo = string')
    appendChildNode(source, text)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.nodes.length).toBeGreaterThan(0)
  })

  it('should ignore br children by adding break nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Foo')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const br = createNode('br')
    appendChildNode(source, br)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.nodes.length).toBe(1)
    expect(node.nodes[0]?.kind).toBe('Break')
  })

  it('should collect kubb-function children in source nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Api')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const func = createNode('kubb-function')
    setAttribute(func, 'name', 'getFoo')
    setAttribute(func, 'export', true)
    appendChildNode(source, func)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.nodes.length).toBe(1)
    expect(node.nodes[0]?.kind).toBe('Function')
  })

  it('should collect kubb-arrow-function children in source nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Api')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const arrowFunc = createNode('kubb-arrow-function')
    setAttribute(arrowFunc, 'name', 'getBar')
    setAttribute(arrowFunc, 'export', true)
    appendChildNode(source, arrowFunc)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.nodes[0]?.kind).toBe('ArrowFunction')
  })

  it('should collect kubb-const children in source nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Config')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const constNode = createNode('kubb-const')
    setAttribute(constNode, 'name', 'myConst')
    appendChildNode(source, constNode)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    const [node] = [...result]
    expect(node.nodes[0]?.kind).toBe('Const')
  })

  it('should collect kubb-type children in source nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Types')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const typeNode = createNode('kubb-type')
    setAttribute(typeNode, 'name', 'MyType')
    appendChildNode(source, typeNode)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    const [node] = [...result]
    expect(node.nodes[0]?.kind).toBe('Type')
  })

  it('should collect kubb-jsx children in source nodes', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Component')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const jsxNode = createNode('kubb-jsx')
    const jsxText = createTextNode('<div>Hello</div>')
    appendChildNode(jsxNode, jsxText)
    appendChildNode(source, jsxNode)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    const [node] = [...result]
    expect(node.nodes[0]?.kind).toBe('Jsx')
  })

  it('should ignore kubb-jsx children with empty text', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Empty')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const jsxNode = createNode('kubb-jsx')
    // no text child
    appendChildNode(source, jsxNode)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    const [node] = [...result]
    expect(node.nodes.length).toBe(0)
  })

  it('should ignore nodes in the ignores list', () => {
    const file = createNode('kubb-file')
    const exportNode = createNode('kubb-export')
    setAttribute(exportNode, 'path', './foo')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Baz')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    appendChildNode(exportNode, source)
    appendChildNode(file, exportNode)

    // ignoring kubb-export means its subtree is skipped
    const result = squashSourceNodes(file, ['kubb-export'])
    expect(result.size).toBe(0)
  })

  it('should collect multiple source nodes', () => {
    const file = createNode('kubb-file')
    for (let i = 0; i < 3; i++) {
      const source = createNode('kubb-source')
      setAttribute(source, 'name', `Source${i}`)
      setAttribute(source, 'isExportable', false)
      setAttribute(source, 'isIndexable', false)
      setAttribute(source, 'isTypeOnly', false)
      appendChildNode(file, source)
    }

    const result = squashSourceNodes(file, [])
    expect(result.size).toBe(3)
  })

  it('should skip whitespace-only text children', () => {
    const file = createNode('kubb-file')
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Ws')
    setAttribute(source, 'isExportable', false)
    setAttribute(source, 'isIndexable', false)
    setAttribute(source, 'isTypeOnly', false)
    const text = createTextNode('   ')
    appendChildNode(source, text)
    appendChildNode(file, source)

    const result = squashSourceNodes(file, [])
    const [node] = [...result]
    expect(node.nodes.length).toBe(0)
  })
})

describe('squashExportNodes', () => {
  it('should return empty set when no export nodes exist', () => {
    const root = createNode('kubb-root')
    const result = squashExportNodes(root)
    expect(result.size).toBe(0)
  })

  it('should collect a basic export node', () => {
    const file = createNode('kubb-file')
    const exportNode = createNode('kubb-export')
    setAttribute(exportNode, 'name', ['Pet'])
    setAttribute(exportNode, 'path', './models/pet')
    setAttribute(exportNode, 'isTypeOnly', false)
    setAttribute(exportNode, 'asAlias', false)
    appendChildNode(file, exportNode)

    const result = squashExportNodes(file)
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.path).toBe('./models/pet')
    expect(node.isTypeOnly).toBe(false)
    expect(node.asAlias).toBe(false)
  })

  it('should collect type-only export node', () => {
    const file = createNode('kubb-file')
    const exportNode = createNode('kubb-export')
    setAttribute(exportNode, 'path', './models/pet')
    setAttribute(exportNode, 'isTypeOnly', true)
    setAttribute(exportNode, 'asAlias', false)
    appendChildNode(file, exportNode)

    const result = squashExportNodes(file)
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.isTypeOnly).toBe(true)
  })

  it('should collect nested export nodes', () => {
    const root = createNode('kubb-root')
    const app = createNode('kubb-app')
    const file = createNode('kubb-file')
    const exportNode = createNode('kubb-export')
    setAttribute(exportNode, 'path', './foo')
    setAttribute(exportNode, 'isTypeOnly', false)
    setAttribute(exportNode, 'asAlias', false)
    appendChildNode(file, exportNode)
    appendChildNode(app, file)
    appendChildNode(root, app)

    const result = squashExportNodes(root)
    expect(result.size).toBe(1)
  })

  it('should collect multiple export nodes', () => {
    const file = createNode('kubb-file')
    for (let i = 0; i < 3; i++) {
      const exportNode = createNode('kubb-export')
      setAttribute(exportNode, 'path', `./module${i}`)
      setAttribute(exportNode, 'isTypeOnly', false)
      setAttribute(exportNode, 'asAlias', false)
      appendChildNode(file, exportNode)
    }

    const result = squashExportNodes(file)
    expect(result.size).toBe(3)
  })
})

describe('squashImportNodes', () => {
  it('should return empty set when no import nodes exist', () => {
    const root = createNode('kubb-root')
    const result = squashImportNodes(root)
    expect(result.size).toBe(0)
  })

  it('should collect a basic import node', () => {
    const file = createNode('kubb-file')
    const importNode = createNode('kubb-import')
    setAttribute(importNode, 'name', ['useState'])
    setAttribute(importNode, 'path', 'react')
    setAttribute(importNode, 'isTypeOnly', false)
    setAttribute(importNode, 'isNameSpace', false)
    appendChildNode(file, importNode)

    const result = squashImportNodes(file)
    expect(result.size).toBe(1)
    const [node] = [...result]
    expect(node.path).toBe('react')
    expect(node.isTypeOnly).toBe(false)
    expect(node.isNameSpace).toBe(false)
  })

  it('should collect type-only import node', () => {
    const file = createNode('kubb-file')
    const importNode = createNode('kubb-import')
    setAttribute(importNode, 'name', ['Pet'])
    setAttribute(importNode, 'path', './models/pet')
    setAttribute(importNode, 'isTypeOnly', true)
    setAttribute(importNode, 'isNameSpace', false)
    appendChildNode(file, importNode)

    const result = squashImportNodes(file)
    const [node] = [...result]
    expect(node.isTypeOnly).toBe(true)
  })

  it('should collect namespace import node', () => {
    const file = createNode('kubb-file')
    const importNode = createNode('kubb-import')
    setAttribute(importNode, 'name', 'z')
    setAttribute(importNode, 'path', 'zod')
    setAttribute(importNode, 'isTypeOnly', false)
    setAttribute(importNode, 'isNameSpace', true)
    appendChildNode(file, importNode)

    const result = squashImportNodes(file)
    const [node] = [...result]
    expect(node.isNameSpace).toBe(true)
  })

  it('should collect import node with root', () => {
    const file = createNode('kubb-file')
    const importNode = createNode('kubb-import')
    setAttribute(importNode, 'name', ['Pet'])
    setAttribute(importNode, 'path', './models/pet')
    setAttribute(importNode, 'root', '/src')
    setAttribute(importNode, 'isTypeOnly', false)
    setAttribute(importNode, 'isNameSpace', false)
    appendChildNode(file, importNode)

    const result = squashImportNodes(file)
    const [node] = [...result]
    expect(node.root).toBe('/src')
  })

  it('should collect nested import nodes', () => {
    const root = createNode('kubb-root')
    const app = createNode('kubb-app')
    const file = createNode('kubb-file')
    const importNode = createNode('kubb-import')
    setAttribute(importNode, 'name', ['foo'])
    setAttribute(importNode, 'path', './foo')
    setAttribute(importNode, 'isTypeOnly', false)
    setAttribute(importNode, 'isNameSpace', false)
    appendChildNode(file, importNode)
    appendChildNode(app, file)
    appendChildNode(root, app)

    const result = squashImportNodes(root)
    expect(result.size).toBe(1)
  })

  it('should collect multiple import nodes', () => {
    const file = createNode('kubb-file')
    for (let i = 0; i < 4; i++) {
      const importNode = createNode('kubb-import')
      setAttribute(importNode, 'name', [`module${i}`])
      setAttribute(importNode, 'path', `./module${i}`)
      setAttribute(importNode, 'isTypeOnly', false)
      setAttribute(importNode, 'isNameSpace', false)
      appendChildNode(file, importNode)
    }

    const result = squashImportNodes(file)
    expect(result.size).toBe(4)
  })
})

describe('processFiles', () => {
  it('should return empty array when no file nodes exist', async () => {
    const root = createNode('kubb-root')
    const result = await processFiles(root)
    expect(result).toEqual([])
  })

  it('should collect a file node with baseName and path', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'pet.ts')
    setAttribute(file, 'path', 'src/models/pet.ts')
    setAttribute(file, 'meta', {})
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result.length).toBe(1)
    expect(result[0]?.baseName).toBe('pet.ts')
    expect(result[0]?.path).toBe('src/models/pet.ts')
  })

  it('should skip file nodes without baseName', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    // no baseName set, only path
    setAttribute(file, 'path', 'src/models/pet.ts')
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result.length).toBe(0)
  })

  it('should skip file nodes without path', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'pet.ts')
    // no path set
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result.length).toBe(0)
  })

  it('should collect source nodes from file', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'pet.ts')
    setAttribute(file, 'path', 'src/models/pet.ts')
    setAttribute(file, 'meta', {})
    const source = createNode('kubb-source')
    setAttribute(source, 'name', 'Pet')
    setAttribute(source, 'isExportable', true)
    setAttribute(source, 'isIndexable', true)
    setAttribute(source, 'isTypeOnly', false)
    appendChildNode(file, source)
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result[0]?.sources.length).toBe(1)
    expect(result[0]?.sources[0]?.name).toBe('Pet')
  })

  it('should collect import nodes from file', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'pet.ts')
    setAttribute(file, 'path', 'src/models/pet.ts')
    setAttribute(file, 'meta', {})
    const importNode = createNode('kubb-import')
    setAttribute(importNode, 'name', ['useState'])
    setAttribute(importNode, 'path', 'react')
    setAttribute(importNode, 'isTypeOnly', false)
    setAttribute(importNode, 'isNameSpace', false)
    appendChildNode(file, importNode)
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result[0]?.imports.length).toBe(1)
    expect(result[0]?.imports[0]?.path).toBe('react')
  })

  it('should collect export nodes from file', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'pet.ts')
    setAttribute(file, 'path', 'src/models/pet.ts')
    setAttribute(file, 'meta', {})
    const exportNode = createNode('kubb-export')
    setAttribute(exportNode, 'path', './models/pet')
    setAttribute(exportNode, 'isTypeOnly', false)
    setAttribute(exportNode, 'asAlias', false)
    appendChildNode(file, exportNode)
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result[0]?.exports.length).toBe(1)
    expect(result[0]?.exports[0]?.path).toBe('./models/pet')
  })

  it('should collect file metadata attributes', async () => {
    const root = createNode('kubb-root')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'pet.ts')
    setAttribute(file, 'path', 'src/models/pet.ts')
    setAttribute(file, 'meta', { tag: 'pet' })
    setAttribute(file, 'banner', '// banner')
    setAttribute(file, 'footer', '// footer')
    appendChildNode(root, file)

    const result = await processFiles(root)
    expect(result[0]?.meta).toEqual({ tag: 'pet' })
    expect(result[0]?.banner).toBe('// banner')
    expect(result[0]?.footer).toBe('// footer')
  })

  it('should collect multiple file nodes', async () => {
    const root = createNode('kubb-root')
    for (let i = 0; i < 3; i++) {
      const file = createNode('kubb-file')
      setAttribute(file, 'baseName', `file${i}.ts`)
      setAttribute(file, 'path', `src/file${i}.ts`)
      setAttribute(file, 'meta', {})
      appendChildNode(root, file)
    }

    const result = await processFiles(root)
    expect(result.length).toBe(3)
  })

  it('should traverse nested non-file elements to find files', async () => {
    const root = createNode('kubb-root')
    const app = createNode('kubb-app')
    const file = createNode('kubb-file')
    setAttribute(file, 'baseName', 'nested.ts')
    setAttribute(file, 'path', 'src/nested.ts')
    setAttribute(file, 'meta', {})
    appendChildNode(app, file)
    appendChildNode(root, app)

    const result = await processFiles(root)
    expect(result.length).toBe(1)
    expect(result[0]?.baseName).toBe('nested.ts')
  })
})
