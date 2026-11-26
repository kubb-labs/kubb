import { ast, type FileNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { createDefinitions } from './definitions.ts'

const { createFile, createImport, createSource } = ast.factory

const pet = createFile({
  baseName: 'Pet.ts',
  path: '/gen/models/Pet.ts',
  inline: true,
  sources: [createSource({ name: 'Pet', isTypeOnly: true, inline: { expression: '{ id: number }' }, nodes: [] })],
})
const order = createFile({
  baseName: 'Order.ts',
  path: '/gen/models/Order.ts',
  inline: true,
  imports: [createImport({ name: ['Pet'], path: '/gen/models/Pet.ts', isTypeOnly: true })],
  sources: [
    createSource({ name: 'Order', isTypeOnly: true, inline: { expression: '{ pet: Pet }' }, nodes: [] }),
    createSource({ name: 'Pet', isTypeOnly: true, inline: { expression: 'string' }, nodes: [] }),
  ],
})
const client = createFile({
  baseName: 'order.ts',
  path: '/gen/clients/order.ts',
  imports: [
    createImport({ name: [{ propertyName: 'Order', name: 'OrderType' }], path: '/gen/models/Order.ts', isTypeOnly: true }),
    createImport({ name: ['client'], path: '@kubb/client' }),
  ],
  sources: [],
})
const virtual = new Map<string, FileNode>([pet, order].map((file) => [file.path, file]))

describe('Definitions', () => {
  it('resolves an aliased import to the definition it names', () => {
    expect(createDefinitions({ virtual, lang: 'ts' }).resolve({ file: client, name: 'OrderType' })).toMatchObject({ name: 'Order', body: '{ pet: Pet }' })
  })

  it('resolves nothing for a name imported from a file that is not virtual', () => {
    expect(createDefinitions({ virtual, lang: 'ts' }).resolve({ file: client, name: 'client' })).toBeUndefined()
  })

  it('lets a virtual file own declaration win over a name it imports', () => {
    expect(createDefinitions({ virtual, lang: 'ts' }).resolve({ file: order, name: 'Pet' })).toMatchObject({ file: order, body: 'string' })
  })

  it('reads a fragment once and keeps its references, imports and unresolved names', () => {
    const definitions = createDefinitions({ virtual, lang: 'ts' })
    const fragment = definitions.fragment({ file: client, text: 'Promise<OrderType> | client', kind: 'type' })

    expect(definitions.fragment({ file: client, text: 'Promise<OrderType> | client', kind: 'type' })).toBe(fragment)
    expect(fragment.references.map((definition) => definition?.name)).toStrictEqual([undefined, 'Order', undefined])
    expect(fragment.imports.map((imp) => imp.path)).toStrictEqual(['@kubb/client'])
    expect(fragment.unresolved).toStrictEqual(['Promise'])
  })
})
