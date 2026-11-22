import type { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { createSchemaParser } from '../parser.ts'
import { createRefs } from '../refs.ts'
import type { Document, SchemaObject } from '../types.ts'
import type { ParserOptions } from '../parserOptions.ts'

const document = {
  openapi: '3.1.0',
  info: { title: 'Rules', version: '1' },
  paths: {},
  components: { schemas: { Pet: { type: 'object' } } },
  $defs: { Name: { type: 'string', 'x-target': 1, 'x-shared': 'target' } },
} as Document
const refs = createRefs(document)

function parse(schema: SchemaObject, options: Partial<ParserOptions> = {}): ast.SchemaNode {
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

  it.each<{ title: string; schema: SchemaObject; options: Partial<ParserOptions>; type: string }>([
    { title: 'a plain-printing format', schema: { type: 'string', format: 'uuid', enum: ['a'] }, options: {}, type: 'union' },
    { title: 'a Date format', schema: { type: 'string', format: 'date', enum: ['2024-01-01'] }, options: { dateType: 'date' }, type: 'date' },
    { title: 'dateType false', schema: { type: 'string', format: 'date', enum: ['2024-01-01'] }, options: { dateType: false }, type: 'enum' },
  ])('routes an enum with $title', ({ schema, options, type }) => {
    expect(parse(schema, options)).toMatchObject({ type })
  })

  it('keeps vendor extensions on schema nodes', () => {
    expect(parse({ type: 'string', format: 'decimal', 'x-minimum': '0.5' } as SchemaObject)).toMatchObject({
      type: 'string',
      extensions: { 'x-minimum': '0.5' },
    })
    expect(parse({ type: 'string' }).extensions).toBeUndefined()
    expect(parse({ type: 'null', 'x-a': 1 } as SchemaObject).extensions).toEqual({ 'x-a': 1 })
    expect(parse({ allOf: [{ type: 'string', 'x-a': 1 }], 'x-b': 2 } as SchemaObject).extensions).toEqual({ 'x-a': 1, 'x-b': 2 })
    expect(parse({ allOf: [{ items: { type: 'string' }, 'x-a': 1, 'x-s': 'member' }], 'x-s': 'outer' } as SchemaObject).extensions).toEqual({
      'x-a': 1,
      'x-s': 'outer',
    })
    expect(parse({ $ref: '#/$defs/Name', 'x-shared': 'ref' } as SchemaObject).extensions).toEqual({ 'x-target': 1, 'x-shared': 'ref' })
  })

  it('keeps vendor extensions once across deduped and split schemas', () => {
    const union = parse({ anyOf: [{ type: 'string', 'x-a': 1 }, { type: 'string' }] } as SchemaObject) as ast.UnionSchemaNode
    expect(union.members).toHaveLength(1)

    const multi = parse({ type: ['integer', 'string'], 'x-minimum': '1' } as SchemaObject) as ast.UnionSchemaNode
    expect(multi.extensions).toEqual({ 'x-minimum': '1' })
    expect(multi.members?.map((member) => member.extensions)).toEqual([undefined, undefined])
  })

  it('keeps contentMediaType on a blob node', () => {
    expect(parse({ type: 'string', format: 'binary', contentMediaType: 'application/pdf' } as SchemaObject)).toMatchObject({
      type: 'blob',
      content: { mediaType: 'application/pdf' },
    })
    expect(parse({ type: 'string', format: 'binary', contentEncoding: 'base64' } as SchemaObject)).toMatchObject({
      type: 'blob',
      content: { encoding: 'base64' },
    })
    expect(parse({ contentMediaType: 'application/octet-stream' } as SchemaObject)).toMatchObject({
      type: 'blob',
      content: { mediaType: 'application/octet-stream' },
    })
  })
})
