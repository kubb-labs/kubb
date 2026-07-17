import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { containsCircularRef } from './schemaGraph.ts'

describe('containsCircularRef', () => {
  it('returns true when a nested ref points to a circular schema', () => {
    const schema = ast.factory.createSchema({
      type: 'object',
      name: 'Cat',
      properties: [
        ast.factory.createProperty({
          name: 'archEnemy',
          required: false,
          schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
        }),
      ],
    })

    expect(containsCircularRef(schema, { circularSchemas: new Set(['Pet']) })).toBe(true)
  })

  it('returns false when excludeName matches the only circular ref', () => {
    const schema = ast.factory.createSchema({
      type: 'object',
      name: 'TreeNode',
      properties: [
        ast.factory.createProperty({
          name: 'left',
          required: false,
          schema: ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
        }),
      ],
    })

    expect(containsCircularRef(schema, { circularSchemas: new Set(['TreeNode']), excludeName: 'TreeNode' })).toBe(false)
  })

  it('returns false when there are no refs', () => {
    expect(containsCircularRef(ast.factory.createSchema({ type: 'string' }), { circularSchemas: new Set(['Pet']) })).toBe(false)
  })

  it('short-circuits when the circular set is empty', () => {
    const schema = ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })

    expect(containsCircularRef(schema, { circularSchemas: new Set() })).toBe(false)
  })
})
