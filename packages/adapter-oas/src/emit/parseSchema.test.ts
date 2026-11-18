import type { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { createSchemaParser } from '../parser.ts'
import { createRefs } from '../refs.ts'
import type { Document, SchemaObject } from '../types.ts'

const document = {
  openapi: '3.1.0',
  info: { title: 'Rules', version: '1' },
  paths: {},
  components: { schemas: { Pet: { type: 'object' } } },
} as Document
const refs = createRefs(document)

function parse(schema: SchemaObject, options: Partial<ast.ParserOptions> = {}): ast.SchemaNode {
  return createSchemaParser({ document, refs, options })({ schema, name: 'Value' })
}

describe('schemaRules', () => {
  it('lets a const win over a $ref sibling, and a $ref win otherwise', () => {
    expect(parse({ $ref: '#/components/schemas/Pet', const: 'cat' } as SchemaObject)).toMatchObject({ type: 'enum', enumValues: ['cat'] })
    expect(parse({ $ref: '#/components/schemas/Pet', description: 'x' } as SchemaObject)).toMatchObject({ type: 'ref', name: 'Pet' })
  })

  it('splits a multi-type array before applying its format', () => {
    expect(parse({ type: ['null', 'integer', 'string'], format: 'int32' } as SchemaObject)).toMatchObject({ type: 'union' })
    expect(parse({ type: ['integer', 'null'], format: 'int32' } as SchemaObject)).toMatchObject({ type: 'integer', nullable: true })
  })

  it.each<{ title: string; schema: SchemaObject; options: Partial<ast.ParserOptions>; type: string }>([
    { title: 'a plain-printing format', schema: { type: 'string', format: 'uuid', enum: ['a'] }, options: {}, type: 'union' },
    { title: 'a Date format', schema: { type: 'string', format: 'date', enum: ['2024-01-01'] }, options: { dateType: 'date' }, type: 'date' },
    { title: 'dateType false', schema: { type: 'string', format: 'date', enum: ['2024-01-01'] }, options: { dateType: false }, type: 'enum' },
  ])('routes an enum with $title', ({ schema, options, type }) => {
    expect(parse(schema, options)).toMatchObject({ type })
  })
})
