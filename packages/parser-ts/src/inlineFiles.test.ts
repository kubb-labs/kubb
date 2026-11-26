import { ast, type FileNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { inlineFiles as inlineFilesWith } from './inlineFiles.ts'

const { createConst, createFunction, createFile, createImport, createSource, createText, createType } = ast.factory
const inlineFiles = (files: Array<FileNode>) => inlineFilesWith({ files, lang: 'ts', extNames: ['.ts'] })

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

  it('keeps a carried import and a local declaration of the same name apart', () => {
    const inlinePet = createFile({
      baseName: 'Pet.ts',
      path: '/gen/models/inline/Pet.ts',
      sources: [createSource({ name: 'Pet', isTypeOnly: true, inline: { expression: '{ name: string }' }, nodes: [] })],
    })
    const operation = createFile({
      ...operationFile,
      imports: [
        createImport({ name: [{ propertyName: 'Pet', name: 'InlinePet' }], path: '/gen/models/inline/Pet.ts', root: '/gen/models/pet/AddPet.ts' }),
        createImport({ name: ['Pet'], path: '/gen/models/Pet.ts', root: '/gen/models/pet/AddPet.ts', isTypeOnly: true }),
      ],
      sources: [
        createSource({ name: 'AddPetStatus200', isTypeOnly: true, inline: { expression: '{ first: InlinePet; second: InlinePet; pet: Pet }' }, nodes: [] }),
      ],
    })
    const [declaration, addPet] = inlineFiles([inlinePet, operation, clientFile('const pet: AddPetStatus200 = client()')]).files[0]?.sources ?? []

    expect(declaration).toMatchObject({ name: 'Pet2' })
    expect(addPet?.nodes).toMatchObject([{ value: 'const pet: ({ first: Pet2; second: Pet2; pet: Pet }) = client()' }])
  })

  it.each(
    [{ kind: 'a type', isTypeOnly: true, body: '{ raw: Response }', text: 'let c: Envelope', written: 'let c: ({ raw: Response })' }].flatMap((item) => [
      {
        ...item,
        order: 'before',
        text: `${item.text}; let a: PetResponse; let b: PetResponse`,
        written: `${item.written}; let a: Response2; let b: Response2`,
      },
      { ...item, order: 'after', text: `let a: PetResponse; let b: PetResponse; ${item.text}`, written: `let a: Response2; let b: Response2; ${item.written}` },
    ]),
  )('keeps a local declaration from shadowing a global used in $kind inlined $order the schema uses', ({ isTypeOnly, body, text, written }) => {
    const envelope = createFile({
      baseName: 'Envelope.ts',
      path: '/gen/models/Envelope.ts',
      sources: [createSource({ name: 'Envelope', isTypeOnly, inline: { expression: body }, nodes: [] })],
    })
    const operation = createFile({
      ...operationFile,
      imports: [],
      sources: [createSource({ name: 'Response', isTypeOnly: true, inline: { expression: '{ id: number }' }, nodes: [] })],
    })
    const file = clientFile(text, {
      imports: [
        createImport({ name: [{ propertyName: 'Response', name: 'PetResponse' }], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts' }),
        createImport({ name: ['Envelope'], path: '/gen/models/Envelope.ts', root: '/gen/clients/addPet.ts' }),
      ],
    })
    const [declaration, addPet] = inlineFiles([envelope, operation, file]).files[0]?.sources ?? []

    expect(declaration).toMatchObject({ name: 'Response2' })
    expect(addPet?.nodes).toMatchObject([{ value: written }])
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

  it('declares a value once as a local constant and keeps a global its body uses free', () => {
    const envelope = createFile({
      baseName: 'Envelope.ts',
      path: '/gen/models/Envelope.ts',
      sources: [createSource({ name: 'Envelope', inline: { expression: '{} as Response' }, nodes: [] })],
    })
    const operation = createFile({
      ...operationFile,
      imports: [],
      sources: [createSource({ name: 'Response', isTypeOnly: true, inline: { expression: '{ id: number }' }, nodes: [] })],
    })
    const file = clientFile('const c = Envelope; const d = Envelope; let a: PetResponse; let b: PetResponse', {
      imports: [
        createImport({ name: [{ propertyName: 'Response', name: 'PetResponse' }], path: '/gen/models/pet/AddPet.ts', root: '/gen/clients/addPet.ts' }),
        createImport({ name: ['Envelope'], path: '/gen/models/Envelope.ts', root: '/gen/clients/addPet.ts' }),
      ],
    })
    const sources = inlineFiles([envelope, operation, file]).files[0]?.sources ?? []

    expect(sources.find((source) => source.name === 'Envelope')).toMatchObject({ nodes: [{ kind: 'Const', nodes: [{ value: '{} as Response' }] }] })
    expect(sources.at(-1)?.nodes).toMatchObject([{ value: 'const c = Envelope; const d = Envelope; let a: Response2; let b: Response2' }])
  })

  it('keeps the type annotation and as const of an inlined constant', () => {
    const operation = createFile({
      ...operationFile,
      inline: true,
      sources: [
        createSource({
          name: 'AddPetStatus200',
          nodes: [createConst({ name: 'AddPetStatus200', type: 'ReadonlyArray<Pet>', asConst: true, nodes: [createText("['a']")] })],
        }),
      ],
    })
    const [declaration] = inlineFiles([operation, clientFile('const a = AddPetStatus200')]).files[0]?.sources ?? []

    expect(declaration?.nodes).toMatchObject([{ kind: 'Const', type: 'ReadonlyArray<Pet>', asConst: true }])
  })

  it('reports a name the virtual file declares as both a type and a value', () => {
    const operation = createFile({
      ...operationFile,
      inline: true,
      sources: [
        createSource({ name: 'AddPetStatus200', nodes: [createConst({ name: 'AddPetStatus200', nodes: [createText("{ a: 'a' }")] })] }),
        createSource({ name: 'AddPetStatus200', isTypeOnly: true, nodes: [createType({ name: 'AddPetStatus200', nodes: [createText("'a'")] })] }),
      ],
    })
    const { problems } = inlineFiles([operation, clientFile('let a: AddPetStatus200')])

    expect(problems).toEqual([
      {
        path: '/gen/clients/addPet.ts',
        message: '"AddPetStatus200" from "/gen/models/pet/AddPet.ts" has more than one declaration, so its uses cannot be told apart.',
      },
    ])
  })

  it('reports a value that refers to itself and keeps the name', () => {
    const cyclic = createFile({
      baseName: 'Tree.ts',
      path: '/gen/models/Tree.ts',
      sources: [createSource({ name: 'treeNode', inline: { expression: '{ children: [treeNode] }' }, nodes: [createText('')] })],
    })
    const file = createFile({
      baseName: 'tree.ts',
      path: '/gen/clients/tree.ts',
      imports: [createImport({ name: ['treeNode'], path: '/gen/models/Tree.ts', root: '/gen/clients/tree.ts' })],
      sources: [createSource({ nodes: [createText('const tree = treeNode')] })],
    })
    const { problems } = inlineFiles([cyclic, file])

    expect(problems).toEqual([{ path: '/gen/models/Tree.ts', message: '"treeNode" from "/gen/models/Tree.ts" is defined in terms of itself.' }])
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

  it('leaves a file with another extension as it is', () => {
    const file = clientFile('const options: AddPetOptions = client()', { baseName: 'addPet.tsx', path: '/gen/clients/addPet.tsx' })
    const { files, virtualPaths, problems } = inlineFiles([operationFile, file])

    expect(files).toEqual([])
    expect(virtualPaths).toEqual(['/gen/models/pet/AddPet.ts'])
    expect(problems).toEqual([])
  })
})
