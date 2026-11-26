import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { replaceIdentifiers, wrap } from './inline.ts'
import { createInline, inlineFiles } from './inlineFiles.ts'
import type { InlineTextKind } from './nodeText.ts'
import { printSource } from './utils.ts'

describe('replaceIdentifiers', () => {
  const swap = (text: string, kind?: InlineTextKind) => replaceIdentifiers(text, (name) => (name === 'Name' ? 'Pet' : undefined), 'ts', kind)

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

  it('leaves bound names, method names and enum members alone', () => {
    expect(swap('function f<Name>(x: Name): Name {}', 'code')).toBe('function f<Name>(x: Name): Name {}')
    expect(swap('{ Name(): void; other: Name }', 'type')).toBe('{ Name(): void; other: Pet }')
    expect(swap('{ Name() { return Name } }', 'value')).toBe('{ Name() { return Pet } }')
    expect(swap('enum E { Name }', 'code')).toBe('enum E { Name }')
  })

  it('keeps the key of a shorthand property', () => {
    expect(swap('{ Name, other: 1 }', 'value')).toBe('{ Name: Pet, other: 1 }')
  })

  it('keeps a shorthand key when the value ends in a line comment', () => {
    expect(swap('{ Name } // note', 'value')).toBe('{ Name: Pet } // note')
  })

  it('keeps the export name of an exported reference', () => {
    expect(swap('export { Name }', 'code')).toBe('export { Pet as Name }')
    expect(swap('export { Name as Other }', 'code')).toBe('export { Pet as Other }')
  })

  it('reads a fragment as the kind it is given', () => {
    expect(swap('options: Name, x = Name', 'parameters')).toBe('options: Pet, x = Pet')
    expect(swap('TData = Name', 'typeParameters')).toBe('TData = Pet')
  })

  it('reads past a quote inside a regex literal', () => {
    expect(swap("const r = /'/; let p: Name")).toBe("const r = /'/; let p: Pet")
  })

  it('leaves JSX text and attribute names alone in tsx', () => {
    const text = '<Name Name="x">Name {Name}</Name>'
    expect(replaceIdentifiers(text, (name) => (name === 'Name' ? 'Pet' : undefined), 'tsx')).toBe('<Name Name="x">Name {Pet}</Name>')
  })
})

describe('wrap', () => {
  it('keeps names and dotted paths bare and puts anything else in parentheses', () => {
    expect(wrap('Pet')).toBe('Pet')
    expect(wrap('models.Pet')).toBe('models.Pet')
    expect(wrap('Pet | null')).toBe('(Pet | null)')
    expect(wrap('{ body: Pet }')).toBe('({ body: Pet })')
  })
})

describe('createInline', () => {
  const { createFile, createImport, createSource, createText } = ast.factory
  const models = createFile({
    baseName: 'pet.ts',
    path: '/gen/models/pet.ts',
    inline: true,
    sources: [createSource({ name: 'Pet', isTypeOnly: true, inline: { expression: '{ id: number }' }, nodes: [] })],
  })
  const client = createFile({
    baseName: 'pet.ts',
    path: '/gen/clients/pet.ts',
    imports: [createImport({ name: ['Pet'], path: '/gen/models/pet.ts', root: '/gen/clients/pet.ts', isTypeOnly: true })],
    sources: [createSource({ nodes: [createText('let pet: Pet')] })],
  })

  it('inlines the files of its extensions when called as the hook', () => {
    const { files, virtualPaths, problems } = createInline('ts', ['.ts'])([models, client])

    expect(virtualPaths).toEqual(['/gen/models/pet.ts'])
    expect(problems).toEqual([])
    expect(files.map((file) => file.sources.map(printSource))).toEqual([['let pet: ({ id: number })']])
  })

  it('still inlines when an older core reads it as an InlineLanguage object', () => {
    const inline = createInline('tsx', ['.tsx'])

    expect(inline.replaceIdentifiers('<A>{Name}</A>', (name) => (name === 'Name' ? 'Pet' : undefined))).toBe('<A>{Pet}</A>')
    expect(inline.wrap('Pet | null')).toBe('(Pet | null)')
    // The call a @kubb/core before the hook makes.
    const { files, problems } = ast.file.inline([models, client], { language: () => createInline('ts', ['.ts']) })
    expect(problems).toEqual([])
    expect(files.map((file) => file.sources.map(printSource))).toEqual([['let pet: ({ id: number })']])
  })
})

describe('inlineFiles', () => {
  const { createConst, createFile, createImport, createSource, createText, createType } = ast.factory
  const models = createFile({
    baseName: 'pet.ts',
    path: '/gen/models/pet.ts',
    inline: true,
    sources: [
      createSource({ name: 'Pet', isTypeOnly: true, nodes: [createType({ name: 'Pet', nodes: [createText('{ id: number }')] })] }),
      createSource({ name: 'petSchema', nodes: [createConst({ name: 'petSchema', nodes: [createText('z.object({ id: z.number() })')] })] }),
    ],
    imports: [createImport({ name: ['z'], path: 'zod', root: '/gen/models/pet.ts' })],
  })

  it('declares a type used twice and a value once, and carries the imports they need', () => {
    const client = createFile({
      baseName: 'pet.ts',
      path: '/gen/clients/pet.ts',
      imports: [createImport({ name: ['Pet', 'petSchema'], path: '/gen/models/pet.ts', root: '/gen/clients/pet.ts' })],
      sources: [createSource({ nodes: [createText('export function check(pet: Pet): Pet {\n  return { petSchema }.petSchema.parse(pet)\n}')] })],
    })
    const { files, problems } = inlineFiles([models, client], { lang: 'ts', extNames: ['.ts'] })
    const [file] = files

    expect(problems).toEqual([])
    expect(file?.imports.map((imp) => imp.path)).toEqual(['zod'])
    expect(file?.sources.map(printSource)).toEqual([
      'type Pet = { id: number }',
      'const petSchema = z.object({ id: z.number() })',
      'export function check(pet: Pet): Pet {\n  return { petSchema }.petSchema.parse(pet)\n}',
    ])
  })
})
