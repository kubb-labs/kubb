import { describe, expect, it } from 'vitest'
import { narrowSchema } from '../guards.ts'
import { createInput } from '../nodes/input.ts'
import type { InputNode } from '../nodes/input.ts'
import { createProperty } from '../nodes/property.ts'
import { createSchema, type RefSchemaNode } from '../nodes/schema.ts'
import { parse, stringify } from './index.ts'

function createPetInput() {
  const category = createSchema({ type: 'object', properties: [createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) })] })
  const ref = () => createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category', schema: category })
  const pet = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [createProperty({ name: 'category', required: true, schema: ref() }), createProperty({ name: 'previous', required: false, schema: ref() })],
  })

  return createInput({ schemas: [pet], operations: [], meta: { title: 'Pets', serverIndex: 1 } })
}

function refsOf(input: InputNode): Array<RefSchemaNode> {
  return narrowSchema(input.schemas[0], 'object')?.properties.flatMap((property) => narrowSchema(property.schema, 'ref') ?? []) ?? []
}

describe('stringify', () => {
  it('writes a schema that two refs point at once', () => {
    const document = JSON.parse(stringify(createPetInput()))

    expect(document.targets).toHaveLength(1)
    expect(document.input.schemas[0].properties.map((property: { schema: { schema: number } }) => property.schema.schema)).toStrictEqual([0, 0])
  })

  it('writes a ref target that points back at itself', () => {
    const node = createSchema({ type: 'object', name: 'Node', properties: [] })
    const self = createSchema({ type: 'ref', name: 'Node', ref: '#/components/schemas/Node', schema: node })
    node.properties.push(createProperty({ name: 'parent', required: false, schema: self }))

    const input = createInput({
      schemas: [createSchema({ type: 'object', properties: [createProperty({ name: 'node', required: true, schema: self })] })],
      operations: [],
    })

    const [parsed] = refsOf(parse(stringify(input)))
    const target = narrowSchema(parsed?.schema ?? undefined, 'object')

    expect(narrowSchema(target?.properties[0]?.schema, 'ref')?.schema).toBe(target)
  })
})

describe('parse', () => {
  it('returns an input equal to the one stringify was given', () => {
    const input = createPetInput()

    // `toEqual`, since JSON drops the keys a factory leaves `undefined`.
    expect(parse(stringify(input))).toEqual(input)
    expect(parse(stringify(input)).meta.serverIndex).toBe(1)
  })

  it('keeps spec data that looks like a ref node', () => {
    const examples = [
      { kind: 'Schema', type: 'ref', schema: 0 },
      { kind: 'Schema', type: 'ref', schema: { id: 1 } },
    ]
    const input = createInput({ schemas: [createSchema({ type: 'object', name: 'Pet', examples })], operations: [] })

    expect(parse(stringify(input)).schemas[0]?.examples).toStrictEqual(examples)
  })

  it('points refs to the same schema at one shared object', () => {
    const [first, second] = refsOf(parse(stringify(createPetInput())))

    expect(first?.schema).toBeDefined()
    expect(first?.schema).toBe(second?.schema)
  })

  it('throws when the text has another format version', () => {
    expect(() => parse('{"version":2,"input":{},"targets":[]}')).toThrow('expected format version 1, got 2')
  })

  it('throws when the text has no input or targets', () => {
    expect(() => parse('{"version":1}')).toThrow('`input` or `targets` is missing')
  })

  it('throws when a ref points at a missing target', () => {
    const text = stringify(createPetInput()).replace(/"targets":\[.*\]\}$/, '"targets":[]}')

    expect(() => parse(text)).toThrow('a ref points at target 0, which is missing')
  })
})
