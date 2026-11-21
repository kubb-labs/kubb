import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { code } from './code.ts'
import type { RefName } from './ref.ts'

function refName(name: string, path: string | null, isTypeOnly = false): RefName {
  return { name, import: path ? ast.factory.createImport({ name: [name], path, isTypeOnly }) : null, toString: () => name }
}

const pet = refName('Pet', '/gen/types/pet.ts', true)
const order = refName('Order', '/gen/types/order.ts', true)
const petSchema = refName('petSchema', '/gen/zod/pet.ts')

describe('code', () => {
  it('prints names, strings and numbers, and skips null, undefined and false', () => {
    const source = code`${pet}: ${'a'}${1}${null}${undefined}${false}`

    expect(source.text).toBe('Pet: a1')
  })

  it('groups imports per path and type-only flag in the order of first use', () => {
    const source = code`${petSchema} satisfies ${pet} | ${order} | ${pet} ${refName('PetStatus', '/gen/types/pet.ts', true)}`

    expect(source.imports.map(({ name, path, isTypeOnly }) => ({ name, path, isTypeOnly }))).toStrictEqual([
      { name: ['petSchema'], path: '/gen/zod/pet.ts', isTypeOnly: false },
      { name: ['Pet', 'PetStatus'], path: '/gen/types/pet.ts', isTypeOnly: true },
      { name: ['Order'], path: '/gen/types/order.ts', isTypeOnly: true },
    ])
  })

  it('keeps the imports of nested code', () => {
    const inner = code`z.ZodType<${pet}>`
    const source = code`satisfies ${inner}`

    expect(source.text).toBe('satisfies z.ZodType<Pet>')
    expect(source.imports.map((imp) => imp.name)).toStrictEqual([['Pet']])
  })

  it('joins parts with a separator and keeps their imports', () => {
    const source = code.join([pet, code`${order}[]`, 'string'], ' | ')

    expect(source.text).toBe('Pet | Order[] | string')
    expect(source.imports.map((imp) => imp.name)).toStrictEqual([['Pet'], ['Order']])
  })

  it('keeps default and namespace imports as they are', () => {
    const react = ast.factory.createImport({ name: 'React', path: 'react' })
    const zod = ast.factory.createImport({ name: 'z', path: 'zod', isNameSpace: true })
    const source = code`${{ text: 'React', imports: [react, zod] }} ${pet}`

    expect(source.imports).toStrictEqual([react, zod, expect.objectContaining({ name: ['Pet'], path: '/gen/types/pet.ts' })])
  })
})
