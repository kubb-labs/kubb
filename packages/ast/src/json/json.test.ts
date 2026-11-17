import { describe, expect, it } from 'vitest'
import { createFile, createImport, createSource, createText } from '../nodes/index.ts'
import { createInput } from '../nodes/input.ts'
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

  return createInput({ schemas: [pet], operations: [], meta: { title: 'Pets' } })
}

function refsOf(input: ReturnType<typeof parse>): Array<RefSchemaNode> {
  const [pet] = input.schemas
  if (pet?.type !== 'object') return []
  return pet.properties.map((property) => property.schema as RefSchemaNode)
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

    const [parsed] = refsOf(
      parse(
        stringify(
          createInput({
            schemas: [createSchema({ type: 'object', properties: [createProperty({ name: 'node', required: true, schema: self })] })],
            operations: [],
          }),
        ),
      ),
    )

    expect(parsed?.schema).toBe((parsed?.schema as { properties: Array<{ schema: RefSchemaNode }> }).properties[0]?.schema.schema)
  })
})

describe('parse', () => {
  it('returns an input equal to the one stringify was given', () => {
    const input = createPetInput()

    // `toEqual`, since JSON drops the keys a factory leaves `undefined`.
    expect(parse(stringify(input))).toEqual(input)
  })

  it('points refs to the same schema at one shared object', () => {
    const [first, second] = refsOf(parse(stringify(createPetInput())))

    expect(first?.schema).toBeDefined()
    expect(first?.schema).toBe(second?.schema)
  })

  it('throws when the text has another format version', () => {
    expect(() => parse('{"version":2,"input":{},"targets":[]}')).toThrow('expected format version 1, got 2')
  })

  it('throws when a ref points at a missing target', () => {
    const text = stringify(createPetInput()).replace(/"targets":\[.*\]\}$/, '"targets":[]}')

    expect(() => parse(text)).toThrow('a ref points at target 0, which is missing')
  })
})

describe('FileNode', () => {
  it('survives plain JSON without a helper', () => {
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/models/pet.ts',
      imports: [createImport({ name: ['Category'], path: './category.ts', isTypeOnly: true })],
      sources: [createSource({ name: 'Pet', isExportable: true, nodes: [createText('export type Pet = { category: Category }')] })],
    })

    expect(JSON.parse(JSON.stringify(file))).toStrictEqual(file)
  })
})
