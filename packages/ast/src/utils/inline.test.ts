import { describe, expect, it } from 'vitest'
import { createFunction, createText } from '../nodes/code.ts'
import { createFile, createImport, createSource } from '../nodes/file.ts'
import type { FileNode } from '../nodes/file.ts'
import { inlineFiles, isVirtualFile, replaceIdentifiers } from './inline.ts'

const operationFile = createFile({
  baseName: 'AddPet.ts',
  path: '/gen/models/pet/AddPet.ts',
  imports: [
    createImport({ name: ['Pet'], path: '/gen/models/Pet.ts', root: '/gen/models/pet/AddPet.ts', isTypeOnly: true }),
    createImport({ name: ['Order'], path: '/gen/models/Order.ts', root: '/gen/models/pet/AddPet.ts', isTypeOnly: true }),
  ],
  sources: [
    createSource({ name: 'AddPetBody', isTypeOnly: true, inline: { expression: 'Pet' }, nodes: [createText('export type AddPetBody = Pet')] }),
    createSource({
      name: 'AddPetOptions',
      isTypeOnly: true,
      inline: { expression: '{ body: AddPetBody; path?: never }' },
      nodes: [createText('export type AddPetOptions = { body: AddPetBody; path?: never }')],
    }),
    createSource({
      name: 'AddPetStatus200',
      isTypeOnly: true,
      inline: { expression: 'Pet | null' },
      nodes: [createText('export type AddPetStatus200 = Pet | null')],
    }),
  ],
})

function clientFile(code: string, extra: Partial<FileNode> = {}) {
  return createFile({
    baseName: 'addPet.ts',
    path: '/gen/clients/addPet.ts',
    imports: [
      createImport({ name: ['AddPetOptions', 'AddPetStatus200'], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts', isTypeOnly: true }),
      createImport({ name: ['client'], path: '@kubb/client' }),
    ],
    sources: [createSource({ name: 'addPet', nodes: [createText(code)] })],
    ...extra,
  })
}

function code(file: FileNode | undefined) {
  return file?.sources.flatMap((source) => source.nodes?.map((node) => ('value' in node ? node.value : node)) ?? [])
}

describe('isVirtualFile', () => {
  it('is true only when every source is inline', () => {
    expect(isVirtualFile(operationFile)).toBe(true)
    expect(isVirtualFile(clientFile('client()'))).toBe(false)
    expect(isVirtualFile(createFile({ baseName: 'empty.ts', path: '/gen/empty.ts' }))).toBe(false)
  })
})

describe('inlineFiles', () => {
  it('returns nothing when no file is virtual', () => {
    expect(inlineFiles([clientFile('client()')])).toEqual({ files: [], virtualPaths: [], problems: [] })
  })

  it('replaces imported names with their definitions, nested ones too', () => {
    const { files, virtualPaths, problems } = inlineFiles([
      operationFile,
      clientFile('export function addPet(options: Options<AddPetOptions>): AddPetStatus200 { return client() }'),
    ])

    expect(virtualPaths).toEqual(['/gen/models/pet/AddPet.ts'])
    expect(problems).toEqual([])
    expect(code(files[0])).toEqual(['export function addPet(options: Options<({ body: Pet; path?: never })>): (Pet | null) { return client() }'])
  })

  it('carries over only the imports the definitions use, rooted at the importing file', () => {
    const { files } = inlineFiles([operationFile, clientFile('const options: AddPetOptions = client()')])

    expect(files[0]?.imports).toEqual([
      expect.objectContaining({ name: ['Pet'], path: '/gen/models/Pet.ts', root: '/gen/clients/addPet.ts', isTypeOnly: true }),
      expect.objectContaining({ name: ['client'], path: '@kubb/client' }),
    ])
  })

  it('rewrites the string fields of code nodes', () => {
    const file = clientFile('', {
      sources: [createSource({ name: 'addPet', nodes: [createFunction({ name: 'addPet', params: 'options: AddPetOptions', returnType: 'AddPetStatus200' })] })],
    })
    const node = inlineFiles([operationFile, file]).files[0]?.sources[0]?.nodes?.[0]

    expect(node).toMatchObject({ params: 'options: ({ body: Pet; path?: never })', returnType: '(Pet | null)' })
  })

  it('follows aliased imports', () => {
    const file = clientFile('const options: Options = client()', {
      imports: [
        createImport({ name: [{ propertyName: 'AddPetOptions', name: 'Options' }], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts' }),
        createImport({ name: ['client'], path: '@kubb/client' }),
      ],
    })

    expect(code(inlineFiles([operationFile, file]).files[0])).toEqual(['const options: ({ body: Pet; path?: never }) = client()'])
  })

  it('reports a cycle and keeps the name', () => {
    const cyclic = createFile({
      baseName: 'Tree.ts',
      path: '/gen/models/Tree.ts',
      sources: [createSource({ name: 'TreeNode', inline: { expression: '{ children: Array<TreeNode> }' }, nodes: [createText('')] })],
    })
    const file = createFile({
      baseName: 'tree.ts',
      path: '/gen/clients/tree.ts',
      imports: [createImport({ name: ['TreeNode'], path: '/gen/models/Tree.ts', root: '/gen/clients/tree.ts' })],
      sources: [createSource({ nodes: [createText('let tree: TreeNode')] })],
    })
    const { files, problems } = inlineFiles([cyclic, file])

    expect(problems).toEqual([{ path: '/gen/models/Tree.ts', message: '"TreeNode" from "/gen/models/Tree.ts" is defined in terms of itself.' }])
    expect(code(files[0])).toEqual(['let tree: ({ children: Array<TreeNode> })'])
  })

  it('reports a name the virtual file does not define, and a re-export of it', () => {
    const file = clientFile('const status: AddPetStatus404 = client()', {
      imports: [createImport({ name: ['AddPetStatus404'], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts' })],
      exports: [{ kind: 'Export', path: '/gen/models/pet/AddPet.ts' }],
    })

    expect(inlineFiles([operationFile, file]).problems).toEqual([
      { path: '/gen/clients/addPet.ts', message: 'Re-exports "/gen/models/pet/AddPet.ts", which is never written.' },
      {
        path: '/gen/clients/addPet.ts',
        message: '"AddPetStatus404" is imported from "/gen/models/pet/AddPet.ts", which never writes it and has no inline definition for it.',
      },
    ])
  })
})

describe('replaceIdentifiers', () => {
  const swap = (text: string) => replaceIdentifiers(text, (name) => (name === 'Name' ? 'Pet' : undefined))

  it('replaces references', () => {
    expect(swap('Array<Name> | Name[]')).toBe('Array<Pet> | Pet[]')
    expect(swap('T extends string ? Name : never')).toBe('T extends string ? Pet : never')
    expect(swap('{ body: Name; tags?: [...Name] }')).toBe('{ body: Pet; tags?: [...Pet] }')
    expect(swap('`${Name}`')).toBe('`${Pet}`')
  })

  it('leaves strings, comments, member access, keys and longer names alone', () => {
    expect(swap(`'Name' "Name" \`Name\``)).toBe(`'Name' "Name" \`Name\``)
    expect(swap('// Name\n/* Name */')).toBe('// Name\n/* Name */')
    expect(swap('x.Name x?.Name')).toBe('x.Name x?.Name')
    expect(swap('{ Name: 1, Name?: 2 }\n(Name: string) => void')).toBe('{ Name: 1, Name?: 2 }\n(Name: string) => void')
    expect(swap('NameKey PetName 0xName')).toBe('NameKey PetName 0xName')
  })
})
