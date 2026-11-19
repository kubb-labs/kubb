import { ast, type FileNode, type SourceNode, type UserImportNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { resolveSymbols } from './resolveSymbols.ts'

function source(name: string, plugin: string, options: Partial<SourceNode> = {}): SourceNode {
  return ast.factory.createSource({ name, plugin, isExportable: true, nodes: [ast.factory.createText(`export type ${name} = {}`)], ...options })
}

function file(path: string, { sources = [], imports = [] }: { sources?: Array<SourceNode>; imports?: Array<UserImportNode> } = {}): FileNode {
  return ast.factory.createFile({ path, baseName: path.split('/').at(-1) as `${string}.${string}`, sources, imports: imports.map(ast.factory.createImport) })
}

// A file that uses every name it imports, so `createFile` keeps the imports.
function importer(path: string, imports: Array<UserImportNode>, plugin = 'plugin-cypress'): FileNode {
  const used = imports.flatMap((imp) =>
    Array.isArray(imp.name) ? imp.name.map((item) => (typeof item === 'string' ? item : (item.name ?? item.propertyName))) : [imp.name],
  )
  return file(path, { sources: [source('request', plugin, { nodes: [ast.factory.createText(`export function request(): ${used.join(' | ')} {}`)] })], imports })
}

describe('resolveSymbols', () => {
  it('gives an import the path of the file the plugin emitted the name in', () => {
    const types = file('/gen/types/addPet.ts', { sources: [source('AddPetResponse', 'plugin-ts', { isTypeOnly: true })] })
    const cypress = importer('/gen/cypress/addPet.ts', [{ name: ['AddPetResponse'], plugin: 'plugin-ts', isTypeOnly: true }])

    const { files, problems } = resolveSymbols([types, cypress])

    expect(problems).toStrictEqual([])
    expect(files.map((resolved) => resolved.path)).toStrictEqual(['/gen/cypress/addPet.ts'])
    expect(files[0]?.imports).toMatchObject([
      { name: ['AddPetResponse'], path: '/gen/types/addPet.ts', root: '/gen/cypress/addPet.ts', isTypeOnly: true, plugin: null },
    ])
  })

  it('resolves a name whose file comes later in the list', () => {
    const cypress = importer('/gen/cypress/addPet.ts', [{ name: ['AddPetResponse'], plugin: 'plugin-ts' }])
    const types = file('/gen/types/addPet.ts', { sources: [source('AddPetResponse', 'plugin-ts')] })

    expect(resolveSymbols([cypress, types]).files[0]?.imports[0]?.path).toBe('/gen/types/addPet.ts')
  })

  it('keeps the import type-only only when it asks for it', () => {
    const types = file('/gen/types/Pet.ts', {
      sources: [source('Pet', 'plugin-ts', { isTypeOnly: true }), source('Animal', 'plugin-ts', { isTypeOnly: true })],
    })
    const cypress = importer('/gen/cypress/addPet.ts', [
      { name: ['Pet'], plugin: 'plugin-ts', isTypeOnly: true },
      { name: ['Animal'], plugin: 'plugin-ts', isTypeOnly: false },
    ])

    const imports = resolveSymbols([types, cypress]).files[0]?.imports
    expect(imports?.map(({ name, isTypeOnly }) => ({ name, isTypeOnly }))).toStrictEqual([
      { name: ['Pet'], isTypeOnly: true },
      { name: ['Animal'], isTypeOnly: false },
    ])
  })

  it('counts a value and a type with one name in one file as one declaration', () => {
    const types = file('/gen/types/Status.ts', { sources: [source('Status', 'plugin-ts', { isTypeOnly: true }), source('Status', 'plugin-ts')] })
    const cypress = importer('/gen/cypress/status.ts', [{ name: ['Status'], plugin: 'plugin-ts' }])

    const { files, problems } = resolveSymbols([types, cypress])
    expect(problems).toStrictEqual([])
    expect(files[0]?.imports).toMatchObject([{ path: '/gen/types/Status.ts' }])
  })

  it('splits names from several files into one import per file', () => {
    const pet = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts')] })
    const order = file('/gen/types/Order.ts', { sources: [source('Order', 'plugin-ts')] })
    const cypress = importer('/gen/cypress/addPet.ts', [{ name: ['Pet', 'Order'], plugin: 'plugin-ts' }])

    const imports = resolveSymbols([pet, order, cypress]).files[0]?.imports
    expect(imports?.map(({ name, path }) => ({ name, path }))).toStrictEqual([
      { name: ['Order'], path: '/gen/types/Order.ts' },
      { name: ['Pet'], path: '/gen/types/Pet.ts' },
    ])
  })

  it('keeps the written order of names that resolve to one file', () => {
    const types = file('/gen/types/addPet.ts', { sources: [source('AddPetResponse', 'plugin-ts'), source('AddPetBody', 'plugin-ts')] })
    const cypress = importer('/gen/cypress/addPet.ts', [{ name: ['AddPetResponse', 'AddPetBody'], plugin: 'plugin-ts' }])

    expect(resolveSymbols([types, cypress]).files[0]?.imports.map(({ name }) => name)).toStrictEqual([['AddPetResponse', 'AddPetBody']])
  })

  it('looks a renamed import up by its imported name and keeps the alias', () => {
    const types = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts')] })
    const cypress = importer('/gen/cypress/pet.ts', [{ name: [{ propertyName: 'Pet', name: 'PetType' }], plugin: 'plugin-ts' }])

    expect(resolveSymbols([types, cypress]).files[0]?.imports).toMatchObject([{ name: [{ propertyName: 'Pet', name: 'PetType' }], path: '/gen/types/Pet.ts' }])
  })

  it('keeps imports apart when two plugins emit the same name', () => {
    const ts = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts')] })
    const other = file('/gen/other/Pet.ts', { sources: [source('Pet', 'plugin-other')] })
    const cypress = importer('/gen/cypress/pet.ts', [{ name: ['Pet'], plugin: 'plugin-other' }])

    const { files, problems } = resolveSymbols([ts, other, cypress])
    expect(problems).toStrictEqual([])
    expect(files[0]?.imports[0]?.path).toBe('/gen/other/Pet.ts')
  })

  it('keeps an aliased import of the importing file, so the alias stays bound', () => {
    const shared = file('/gen/all.ts', {
      sources: [source('Pet', 'plugin-ts'), source('request', 'plugin-ts', { nodes: [ast.factory.createText('export function request(): PetAlias {}')] })],
      imports: [{ name: [{ propertyName: 'Pet', name: 'PetAlias' }], plugin: 'plugin-ts' }],
    })

    const { files, problems } = resolveSymbols([shared])
    expect(problems).toStrictEqual([])
    expect(files[0]?.imports).toMatchObject([{ name: [{ propertyName: 'Pet', name: 'PetAlias' }], path: '/gen/all.ts' }])
  })

  it('writes no import when an unaliased name resolves to the importing file', () => {
    // The import survives `createFile` only when it names the file's own path, so build the file with it already set.
    const shared = file('/gen/all.ts', {
      sources: [source('Pet', 'plugin-ts'), source('request', 'plugin-ts', { nodes: [ast.factory.createText('export function request(): Pet {}')] })],
    })
    const withImport = { ...shared, imports: [ast.factory.createImport({ name: ['Pet'], plugin: 'plugin-ts' })] }

    const { files, problems } = resolveSymbols([withImport])
    expect(problems).toStrictEqual([])
    expect(files[0]?.imports).toStrictEqual([])
  })

  it('reports a name the plugin never emitted and drops its import', () => {
    const types = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts')] })
    const cypress = importer('/gen/cypress/addPet.ts', [{ name: ['Pet', 'AddPetResponse'], plugin: 'plugin-ts' }])

    const { files, problems } = resolveSymbols([types, cypress])
    expect(problems).toStrictEqual([
      { kind: 'notFound', file: '/gen/cypress/addPet.ts', importer: 'plugin-cypress', plugin: 'plugin-ts', name: 'AddPetResponse', paths: [] },
    ])
    expect(files[0]?.imports.map(({ name }) => name)).toStrictEqual([['Pet']])
  })

  it('reports a name the plugin emitted in two files instead of picking one', () => {
    const a = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts')] })
    const b = file('/gen/types/legacy/Pet.ts', { sources: [source('Pet', 'plugin-ts')] })
    const cypress = importer('/gen/cypress/pet.ts', [{ name: ['Pet'], plugin: 'plugin-ts' }])

    const { files, problems } = resolveSymbols([a, b, cypress])
    expect(problems).toMatchObject([{ kind: 'ambiguous', name: 'Pet', paths: ['/gen/types/Pet.ts', '/gen/types/legacy/Pet.ts'] }])
    expect(files[0]?.imports).toStrictEqual([])
  })

  it('ignores sources that are not exportable or carry no plugin', () => {
    const local = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts', { isExportable: false })] })
    const unstamped = file('/gen/types/Order.ts', { sources: [ast.factory.createSource({ name: 'Order', isExportable: true, nodes: [] })] })
    const cypress = importer('/gen/cypress/pet.ts', [{ name: ['Pet', 'Order'], plugin: 'plugin-ts' }])

    expect(resolveSymbols([local, unstamped, cypress]).problems.map(({ name }) => name)).toStrictEqual(['Pet', 'Order'])
  })

  it('returns nothing when no file has a plugin import', () => {
    const types = file('/gen/types/Pet.ts', { sources: [source('Pet', 'plugin-ts')], imports: [{ name: ['z'], path: 'zod' }] })

    expect(resolveSymbols([types])).toStrictEqual({ files: [], problems: [] })
  })
})
