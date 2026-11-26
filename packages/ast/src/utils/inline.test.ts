import { describe, expect, it } from 'vitest'
import { createFunction, createText, createType } from '../nodes/code.ts'
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

  it('takes each body from the declarations of a file marked inline', () => {
    const file = createFile({
      baseName: 'AddPet.ts',
      path: '/gen/models/pet/AddPet.ts',
      inline: true,
      imports: [],
      sources: [
        createSource({ name: 'AddPetOptions', nodes: [createType({ name: 'AddPetOptions', export: true, nodes: [createText('{ body: AddPetStatus200 }')] })] }),
        createSource({ name: 'AddPetStatus200', nodes: [createType({ name: 'AddPetStatus200', export: true, nodes: [createText('Pet')] })] }),
      ],
    })
    const { files, virtualPaths, problems } = inlineFiles([file, clientFile('const options: AddPetOptions = client()')])

    expect(virtualPaths).toEqual(['/gen/models/pet/AddPet.ts'])
    expect(problems).toEqual([])
    expect(code(files[0])).toEqual(['const options: ({ body: Pet }) = client()'])
  })

  it.each([
    { kind: 'a Type with no body', node: createType({ name: 'AddPetOptions', export: true, nodes: [] }) },
    { kind: 'a Function', node: createFunction({ name: 'AddPetOptions', export: true, nodes: [createText('return 1')] }) },
  ])('reports $kind in an inline file, which has no body to use in place of its name', ({ node }) => {
    const file = createFile({
      baseName: 'AddPet.ts',
      path: '/gen/models/pet/AddPet.ts',
      inline: true,
      imports: [],
      sources: [createSource({ name: 'AddPetOptions', nodes: [node] })],
    })

    expect(inlineFiles([file, clientFile('const options: AddPetOptions = client()')]).problems).toEqual([
      {
        path: '/gen/clients/addPet.ts',
        message: '"AddPetOptions" is imported from "/gen/models/pet/AddPet.ts", which never writes it and has no inline definition for it.',
      },
    ])
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

  it('aliases a carried import whose name the file already imports from another module', () => {
    const file = clientFile('const status: AddPetStatus200 = client<Options>()', {
      imports: [
        createImport({ name: ['AddPetStatus200'], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts', isTypeOnly: true }),
        createImport({ name: ['client', 'Options'], path: '@kubb/client' }),
      ],
    })
    const withOptions = createFile({
      ...operationFile,
      imports: [createImport({ name: ['Options'], path: '/gen/models/Options.ts', root: '/gen/models/pet/AddPet.ts', isTypeOnly: true })],
      sources: [createSource({ name: 'AddPetStatus200', isTypeOnly: true, inline: { expression: 'Options' }, nodes: [] })],
    })
    const { files } = inlineFiles([withOptions, file])

    expect(code(files[0])).toEqual(['const status: Options2 = client<Options>()'])
    expect(files[0]?.imports).toContainEqual(
      expect.objectContaining({ path: '/gen/models/Options.ts', names: [expect.objectContaining({ alias: 'Options2' })] }),
    )
  })

  it('aliases only the carried import from the other module when two modules share a name', () => {
    const inlineOptions = (path: `${string}.${string}`, from: string) =>
      createFile({
        baseName: path,
        path: `/gen/models/${path}`,
        inline: true,
        imports: [createImport({ name: ['Options'], path: from, isTypeOnly: true })],
        sources: [createSource({ name: path.replace('.ts', ''), isTypeOnly: true, inline: { expression: 'Options' }, nodes: [] })],
      })
    const file = clientFile('const a: A = client<Options>(); const b: B = client()', {
      imports: [
        createImport({ name: ['A'], path: '/gen/models/A.ts', isTypeOnly: true }),
        createImport({ name: ['B'], path: '/gen/models/B.ts', isTypeOnly: true }),
        createImport({ name: ['client', 'Options'], path: '@kubb/client' }),
      ],
    })
    const { files } = inlineFiles([inlineOptions('A.ts', '@kubb/client'), inlineOptions('B.ts', '/gen/models/Options.ts'), file])

    expect(code(files[0])).toEqual(['const a: Options = client<Options>(); const b: Options2 = client()'])
  })

  it('aliases a carried import that would shadow a global the file uses', () => {
    const file = clientFile('const handler = (data: AddPetStatus200): Promise<Response> => client()')
    const withResponse = createFile({
      ...operationFile,
      imports: [createImport({ name: ['Response'], path: '/gen/models/Response.ts', root: '/gen/models/pet/AddPet.ts', isTypeOnly: true })],
      sources: [createSource({ name: 'AddPetStatus200', isTypeOnly: true, inline: { expression: 'Response' }, nodes: [] })],
    })

    expect(code(inlineFiles([withResponse, file]).files[0])).toEqual(['const handler = (data: Response2): Promise<Response> => client()'])
  })

  it('declares a type used twice once as a local type, and writes a bare alias where it is used', () => {
    const file = clientFile('function addPet(): AddPetStatus200 { return client<AddPetStatus200>() }')
    const twice = createFile({
      ...operationFile,
      sources: [
        createSource({ name: 'AddPetBody', isTypeOnly: true, inline: { expression: '{ name: string }' }, nodes: [] }),
        createSource({ name: 'AddPetStatus200', isTypeOnly: true, inline: { expression: 'AddPetBody' }, nodes: [] }),
      ],
    })
    const [declaration, addPet] = inlineFiles([twice, file]).files[0]?.sources ?? []

    expect(declaration).toMatchObject({ name: 'AddPetBody', nodes: [{ kind: 'Type', name: 'AddPetBody', nodes: [{ value: '{ name: string }' }] }] })
    expect(code({ ...file, sources: [addPet!] })).toEqual(['function addPet(): AddPetBody { return client<AddPetBody>() }'])
  })

  it('declares a type that refers to itself under its own name', () => {
    const file = clientFile('const tree: AddPetStatus200 = client()')
    const recursive = createFile({
      ...operationFile,
      sources: [createSource({ name: 'AddPetStatus200', isTypeOnly: true, inline: { expression: '{ children: AddPetStatus200[] }' }, nodes: [] })],
    })
    const [declaration] = inlineFiles([recursive, file]).files[0]?.sources ?? []

    expect(declaration).toMatchObject({ name: 'AddPetStatus200', nodes: [{ nodes: [{ value: '{ children: AddPetStatus200[] }' }] }] })
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
