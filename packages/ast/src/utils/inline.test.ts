import { describe, expect, it } from 'vitest'
import { createFunction, createText } from '../nodes/code.ts'
import { createFile, createImport, createSource } from '../nodes/file.ts'
import type { FileNode } from '../nodes/file.ts'
import { type InlineLanguage, inlineFiles as inlineFilesWith } from './inline.ts'

// A stand-in language with no TypeScript rules: every word is a reference, and anything but a word goes in parentheses.
const words: InlineLanguage = {
  replaceIdentifiers: (text, replace) => text.replace(/[A-Za-z_$][\w$]*/g, (name) => replace(name) ?? name),
  wrap: (expression) => (/^\w+$/.test(expression) ? expression : `(${expression})`),
}
const inlineFiles = (files: Array<FileNode>) => inlineFilesWith(files, { language: () => words })

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

  it('reports a name the virtual file does not define', () => {
    const file = clientFile('const status: AddPetStatus404 = client()', {
      imports: [createImport({ name: ['AddPetStatus404'], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts' })],
    })

    expect(inlineFiles([operationFile, file]).problems).toEqual([
      {
        path: '/gen/clients/addPet.ts',
        message: '"AddPetStatus404" is imported from "/gen/models/pet/AddPet.ts", which never writes it and has no inline definition for it.',
      },
    ])
  })

  it('reports a file whose language has no inline support and leaves it as it is', () => {
    const file = clientFile('const options: AddPetOptions = client()')
    const { files, problems } = inlineFilesWith([operationFile, file], { language: (item) => (item.path === file.path ? undefined : words) })

    expect(files).toEqual([])
    expect(problems).toEqual([{ path: '/gen/clients/addPet.ts', message: 'No parser for ".ts" files supports inline sources.' }])
  })
})
