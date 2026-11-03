import { describe, expect, it } from 'vitest'
import { inlineTs, inlineTsx, replaceIdentifiers } from './inline.ts'

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

  it('reads past a quote inside a regex literal', () => {
    expect(swap("const r = /'/; let p: Name")).toBe("const r = /'/; let p: Pet")
  })

  it('leaves JSX text and attribute names alone in tsx', () => {
    const text = '<Name Name="x">Name {Name}</Name>'
    expect(inlineTsx.replaceIdentifiers(text, (name) => (name === 'Name' ? 'Pet' : undefined))).toBe('<Name Name="x">Name {Pet}</Name>')
  })
})

describe('inlineTs.wrap', () => {
  it('keeps names and dotted paths bare and puts anything else in parentheses', () => {
    expect(inlineTs.wrap('Pet')).toBe('Pet')
    expect(inlineTs.wrap('models.Pet')).toBe('models.Pet')
    expect(inlineTs.wrap('Pet | null')).toBe('(Pet | null)')
    expect(inlineTs.wrap('{ body: Pet }')).toBe('({ body: Pet })')
  })
})
