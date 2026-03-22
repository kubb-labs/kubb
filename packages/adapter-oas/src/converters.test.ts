import { createSchema, narrowSchema } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import {
  convertAllOf,
  convertArray,
  convertBoolean,
  convertConst,
  convertEnum,
  convertFormat,
  convertNull,
  convertNumeric,
  convertObject,
  convertRef,
  convertString,
  convertTuple,
  convertUnion,
} from './converters.ts'
import type { SchemaObject } from './oas/types.ts'
import type { ConverterDeps, SchemaContext } from './parser.ts'
import type { ParserOptions } from './types.ts'

/**
 * Builds a minimal mock `ConverterDeps` for unit-testing individual converters.
 * Override individual deps as needed per test.
 */
function createMockDeps(overrides?: Partial<ConverterDeps>): ConverterDeps {
  return {
    oas: { get: () => null },
    isLegacyNaming: false,
    convertSchema: ({ name }) => createSchema({ type: 'unknown', name }),
    resolveChildName: (_parentName, propName) => propName,
    resolveEnumPropName: (_parentName, propName, enumSuffix) => `${propName}${enumSuffix}`,
    applyEnumName: (propNode) => propNode,
    resolveTypeOption: (value) => value,
    renderSchemaBase: ({ schema, name, nullable, defaultValue }) => ({
      name,
      nullable,
      title: schema.title,
      description: schema.description,
      deprecated: schema.deprecated,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      default: defaultValue,
      example: schema.example,
    }),
    getDateType: (_options, format) => {
      if (format === 'date-time') return { type: 'datetime' }
      if (format === 'date') return { type: 'date', representation: 'string' }
      return { type: 'time', representation: 'string' }
    },
    ...overrides,
  }
}

/**
 * Builds a `SchemaContext` for a given `SchemaObject`, with sensible defaults.
 */
function createContext(schema: SchemaObject, overrides?: Partial<SchemaContext>): SchemaContext {
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type
  return {
    schema,
    name: undefined,
    nullable: undefined,
    defaultValue: schema.default,
    type,
    options: undefined,
    mergedOptions: DEFAULT_PARSER_OPTIONS,
    ...overrides,
  }
}

describe('convertRef', () => {
  it('creates a ref node from a $ref string', () => {
    const schema: SchemaObject = { $ref: '#/components/schemas/Pet' } as unknown as SchemaObject
    const result = convertRef(createMockDeps(), createContext(schema))

    expect(result.type).toBe('ref')
    expect(result.name).toBe('Pet')
    expect(result).toHaveProperty('ref', '#/components/schemas/Pet')
  })

  it('inherits title and description from the resolved schema', () => {
    const deps = createMockDeps({
      oas: {
        get: () => ({ title: 'A pet', description: 'Pet description' }) as never,
      },
    })
    const schema: SchemaObject = { $ref: '#/components/schemas/Pet' } as unknown as SchemaObject
    const result = convertRef(deps, createContext(schema))

    expect(result.title).toBe('A pet')
    expect(result.description).toBe('Pet description')
  })

  it('prefers own title/description over resolved values', () => {
    const deps = createMockDeps({
      oas: {
        get: () => ({ title: 'Resolved', description: 'Resolved desc' }) as never,
      },
    })
    const schema: SchemaObject = {
      $ref: '#/components/schemas/Pet',
      title: 'Own title',
      description: 'Own desc',
    } as unknown as SchemaObject
    const result = convertRef(deps, createContext(schema))

    expect(result.title).toBe('Own title')
    expect(result.description).toBe('Own desc')
  })

  it('handles unresolvable $ref gracefully', () => {
    const deps = createMockDeps({
      oas: {
        get: () => {
          throw new Error('Not found')
        },
      },
    })
    const schema: SchemaObject = { $ref: '#/components/schemas/Missing' } as unknown as SchemaObject
    const result = convertRef(deps, createContext(schema))

    expect(result.type).toBe('ref')
    expect(result.name).toBe('Missing')
  })
})

// ---------------------------------------------------------------------------
// convertConst
// ---------------------------------------------------------------------------
describe('convertConst', () => {
  it('converts null const to a null node', () => {
    const schema: SchemaObject = { const: null } as SchemaObject
    const result = convertConst(createMockDeps(), createContext(schema))
    expect(result.type).toBe('null')
  })

  it('converts string const to a single-value enum', () => {
    const schema: SchemaObject = { const: 'active' } as SchemaObject
    const result = convertConst(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode).toBeDefined()
    expect(enumNode?.primitive).toBe('string')
    expect(enumNode?.enumValues).toEqual(['active'])
    expect(enumNode?.fromConst).toBe(true)
  })

  it('converts numeric const', () => {
    const schema: SchemaObject = { const: 42 } as SchemaObject
    const result = convertConst(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode?.primitive).toBe('number')
    expect(enumNode?.enumValues).toEqual([42])
  })

  it('converts boolean const', () => {
    const schema: SchemaObject = { const: false } as SchemaObject
    const result = convertConst(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode?.primitive).toBe('boolean')
    expect(enumNode?.enumValues).toEqual([false])
  })
})

describe('convertFormat', () => {
  it('returns datetime node for date-time format', () => {
    const schema: SchemaObject = { type: 'string', format: 'date-time' } as SchemaObject
    const result = convertFormat(createMockDeps(), createContext(schema))

    expect(result).toBeDefined()
    expect(result!.type).toBe('datetime')
  })

  it('returns date node for date format', () => {
    const schema: SchemaObject = { type: 'string', format: 'date' } as SchemaObject
    const result = convertFormat(createMockDeps(), createContext(schema))

    expect(result).toBeDefined()
    expect(result!.type).toBe('date')
  })

  it('returns time node for time format', () => {
    const schema: SchemaObject = { type: 'string', format: 'time' } as SchemaObject
    const result = convertFormat(createMockDeps(), createContext(schema))

    expect(result).toBeDefined()
    expect(result!.type).toBe('time')
  })

  it('returns int64 as integer by default', () => {
    const schema: SchemaObject = { type: 'integer', format: 'int64' } as SchemaObject
    const result = convertFormat(createMockDeps(), createContext(schema))

    expect(result).toBeDefined()
    expect(result!.type).toBe('integer')
  })

  it('returns int64 as bigint when integerType is bigint', () => {
    const schema: SchemaObject = { type: 'integer', format: 'int64' } as SchemaObject
    const options: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, integerType: 'bigint' }
    const result = convertFormat(createMockDeps(), createContext(schema, { mergedOptions: options }))

    expect(result).toBeDefined()
    expect(result!.type).toBe('bigint')
  })

  it('returns uuid node for uuid format', () => {
    const schema: SchemaObject = { type: 'string', format: 'uuid' } as SchemaObject
    const result = convertFormat(createMockDeps(), createContext(schema))

    expect(result).toBeDefined()
    expect(result!.type).toBe('uuid')
  })

  it('returns undefined for unrecognized format', () => {
    const schema: SchemaObject = { type: 'string', format: 'custom-unknown-xyz' } as SchemaObject
    const result = convertFormat(createMockDeps(), createContext(schema))

    expect(result).toBeUndefined()
  })

  it('returns undefined when getDateType returns undefined', () => {
    const deps = createMockDeps({ getDateType: () => undefined })
    const schema: SchemaObject = { type: 'string', format: 'date-time' } as SchemaObject
    const result = convertFormat(deps, createContext(schema))

    expect(result).toBeUndefined()
  })
})

describe('convertEnum', () => {
  it('converts string enum values', () => {
    const schema: SchemaObject = { type: 'string', enum: ['active', 'inactive'] } as SchemaObject
    const result = convertEnum(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode).toBeDefined()
    expect(enumNode?.enumValues).toEqual(['active', 'inactive'])
  })

  it('filters null from enum values and marks nullable', () => {
    const schema: SchemaObject = { type: 'string', enum: ['a', null, 'b'] } as SchemaObject
    const result = convertEnum(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode?.enumValues).toEqual(['a', 'b'])
    expect(enumNode?.nullable).toBe(true)
  })

  it('handles number enum with namedEnumValues', () => {
    const schema: SchemaObject = { type: 'number', enum: [1, 2, 3] } as SchemaObject
    const result = convertEnum(createMockDeps(), createContext(schema, { type: 'number' }))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode).toBeDefined()
    expect(enumNode?.namedEnumValues).toEqual([
      { name: '1', value: 1, format: 'number' },
      { name: '2', value: 2, format: 'number' },
      { name: '3', value: 3, format: 'number' },
    ])
  })

  it('handles boolean enum with namedEnumValues', () => {
    const schema: SchemaObject = { type: 'boolean', enum: [true, false] } as SchemaObject
    const result = convertEnum(createMockDeps(), createContext(schema, { type: 'boolean' }))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode?.namedEnumValues).toEqual([
      { name: 'true', value: true, format: 'boolean' },
      { name: 'false', value: false, format: 'boolean' },
    ])
  })

  it('deduplicates enum values', () => {
    const schema: SchemaObject = { type: 'string', enum: ['a', 'b', 'a'] } as SchemaObject
    const result = convertEnum(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode?.enumValues).toEqual(['a', 'b'])
  })

  it('uses x-enumNames extension for named enum values', () => {
    const schema: SchemaObject = {
      type: 'string',
      enum: ['val1', 'val2'],
      'x-enumNames': ['Label1', 'Label2'],
    } as SchemaObject
    const result = convertEnum(createMockDeps(), createContext(schema))
    const enumNode = narrowSchema(result, 'enum')

    expect(enumNode?.namedEnumValues).toEqual([
      { name: 'Label1', value: 'val1', format: 'string' },
      { name: 'Label2', value: 'val2', format: 'string' },
    ])
  })

  it('normalizes array-type enum by delegating to convertSchema', () => {
    let convertSchemaCalled = false
    const deps = createMockDeps({
      convertSchema: () => {
        convertSchemaCalled = true
        return createSchema({ type: 'array', primitive: 'array', items: [] })
      },
    })
    const schema: SchemaObject = { type: 'array', enum: ['a', 'b'], items: { type: 'string' } } as SchemaObject
    convertEnum(deps, createContext(schema, { type: 'array' }))

    expect(convertSchemaCalled).toBe(true)
  })
})

describe('convertObject', () => {
  it('converts an object with properties', () => {
    const deps = createMockDeps({
      convertSchema: ({ name: n }) => createSchema({ type: 'string', primitive: 'string', name: n }),
    })
    const schema: SchemaObject = {
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'integer' } },
      required: ['name'],
    } as SchemaObject
    const result = convertObject(deps, createContext(schema, { name: 'User' }))
    const objectNode = narrowSchema(result, 'object')

    expect(objectNode).toBeDefined()
    expect(objectNode?.properties).toHaveLength(2)
    expect(objectNode?.properties?.map((p) => p.name)).toEqual(['name', 'age'])
  })

  it('marks required properties correctly', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string' }),
    })
    const schema: SchemaObject = {
      type: 'object',
      properties: { id: { type: 'string' }, tag: { type: 'string' } },
      required: ['id'],
    } as SchemaObject
    const result = convertObject(deps, createContext(schema))
    const objectNode = narrowSchema(result, 'object')

    const idProp = objectNode?.properties?.find((p) => p.name === 'id')
    const tagProp = objectNode?.properties?.find((p) => p.name === 'tag')

    expect(idProp?.required).toBe(true)
    expect(tagProp?.required).toBeFalsy()
  })

  it('converts empty object without properties', () => {
    const schema: SchemaObject = { type: 'object' } as SchemaObject
    const result = convertObject(createMockDeps(), createContext(schema))
    const objectNode = narrowSchema(result, 'object')

    expect(objectNode).toBeDefined()
    expect(objectNode?.properties).toEqual([])
  })

  it('handles additionalProperties: true', () => {
    const schema: SchemaObject = { type: 'object', additionalProperties: true } as SchemaObject
    const result = convertObject(createMockDeps(), createContext(schema))
    const objectNode = narrowSchema(result, 'object')

    expect(objectNode?.additionalProperties).toBe(true)
  })

  it('converts additionalProperties schema', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string' }),
    })
    const schema: SchemaObject = {
      type: 'object',
      additionalProperties: { type: 'string' },
    } as SchemaObject
    const result = convertObject(deps, createContext(schema))
    const objectNode = narrowSchema(result, 'object')

    expect(objectNode?.additionalProperties).toBeDefined()
    expect(objectNode?.additionalProperties).not.toBe(true)
  })
})

describe('convertTuple', () => {
  it('converts prefixItems into tuple items', () => {
    const deps = createMockDeps({
      convertSchema: ({ schema }) => {
        const s = schema as SchemaObject
        return createSchema({ type: (s.type as 'string') ?? 'unknown', primitive: 'string' })
      },
    })
    const schema: SchemaObject = {
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
    } as SchemaObject
    const result = convertTuple(deps, createContext(schema))
    const tupleNode = narrowSchema(result, 'tuple')

    expect(tupleNode).toBeDefined()
    expect(tupleNode?.items).toHaveLength(2)
  })

  it('includes rest type from items', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string' }),
    })
    const schema: SchemaObject = {
      type: 'array',
      prefixItems: [{ type: 'string' }],
      items: { type: 'string' },
    } as SchemaObject
    const result = convertTuple(deps, createContext(schema))
    const tupleNode = narrowSchema(result, 'tuple')

    expect(tupleNode?.rest).toBeDefined()
  })

  it('preserves minItems and maxItems', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string' }),
    })
    const schema: SchemaObject = {
      type: 'array',
      prefixItems: [{ type: 'string' }],
      minItems: 1,
      maxItems: 5,
    } as SchemaObject
    const result = convertTuple(deps, createContext(schema))
    const tupleNode = narrowSchema(result, 'tuple')

    expect(tupleNode?.min).toBe(1)
    expect(tupleNode?.max).toBe(5)
  })
})

describe('convertArray', () => {
  it('converts a simple array schema', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string' }),
    })
    const schema: SchemaObject = { type: 'array', items: { type: 'string' } } as SchemaObject
    const result = convertArray(deps, createContext(schema))
    const arrayNode = narrowSchema(result, 'array')

    expect(arrayNode).toBeDefined()
    expect(arrayNode?.items).toHaveLength(1)
  })

  it('preserves array constraints', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string' }),
    })
    const schema: SchemaObject = {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
      uniqueItems: true,
    } as SchemaObject
    const result = convertArray(deps, createContext(schema))
    const arrayNode = narrowSchema(result, 'array')

    expect(arrayNode?.min).toBe(1)
    expect(arrayNode?.max).toBe(10)
    expect(arrayNode?.unique).toBe(true)
  })

  it('handles array without items', () => {
    const result = convertArray(createMockDeps(), createContext({ type: 'array' } as SchemaObject))
    const arrayNode = narrowSchema(result, 'array')

    expect(arrayNode).toBeDefined()
    expect(arrayNode?.items).toEqual([])
  })
})

describe('convertString', () => {
  it('creates a string node', () => {
    const schema: SchemaObject = { type: 'string' } as SchemaObject
    const result = convertString(createMockDeps(), createContext(schema))

    expect(result.type).toBe('string')
  })

  it('preserves string constraints', () => {
    const schema: SchemaObject = {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      pattern: '^[a-z]+$',
    } as SchemaObject
    const result = convertString(createMockDeps(), createContext(schema))

    expect(result).toHaveProperty('min', 1)
    expect(result).toHaveProperty('max', 255)
    expect(result).toHaveProperty('pattern', '^[a-z]+$')
  })

  it('preserves annotations from schema', () => {
    const schema: SchemaObject = {
      type: 'string',
      title: 'Name',
      description: 'A person name',
      deprecated: true,
    } as SchemaObject
    const result = convertString(createMockDeps(), createContext(schema, { name: 'Name' }))

    expect(result.name).toBe('Name')
    expect(result.title).toBe('Name')
    expect(result.description).toBe('A person name')
    expect(result.deprecated).toBe(true)
  })
})

describe('convertNumeric', () => {
  it('creates a number node', () => {
    const schema: SchemaObject = { type: 'number' } as SchemaObject
    const result = convertNumeric(createMockDeps(), createContext(schema), 'number')

    expect(result.type).toBe('number')
  })

  it('creates an integer node', () => {
    const schema: SchemaObject = { type: 'integer' } as SchemaObject
    const result = convertNumeric(createMockDeps(), createContext(schema), 'integer')

    expect(result.type).toBe('integer')
  })

  it('preserves numeric constraints', () => {
    const schema: SchemaObject = {
      type: 'number',
      minimum: 0,
      maximum: 100,
      exclusiveMinimum: 0,
      exclusiveMaximum: 100,
    } as SchemaObject
    const result = convertNumeric(createMockDeps(), createContext(schema), 'number')

    expect(result).toHaveProperty('min', 0)
    expect(result).toHaveProperty('max', 100)
    expect(result).toHaveProperty('exclusiveMinimum', 0)
    expect(result).toHaveProperty('exclusiveMaximum', 100)
  })

  it('ignores boolean exclusiveMinimum/Maximum (OAS 3.0 style)', () => {
    const schema: SchemaObject = {
      type: 'number',
      minimum: 5,
      exclusiveMinimum: true as unknown as number,
      exclusiveMaximum: false as unknown as number,
    } as SchemaObject
    const result = convertNumeric(createMockDeps(), createContext(schema), 'number')

    expect(result).toHaveProperty('exclusiveMinimum', undefined)
    expect(result).toHaveProperty('exclusiveMaximum', undefined)
  })
})

describe('convertBoolean', () => {
  it('creates a boolean node', () => {
    const schema: SchemaObject = { type: 'boolean' } as SchemaObject
    const result = convertBoolean(createMockDeps(), createContext(schema))

    expect(result.type).toBe('boolean')
    expect(result).toHaveProperty('primitive', 'boolean')
  })

  it('preserves nullable flag', () => {
    const schema: SchemaObject = { type: 'boolean' } as SchemaObject
    const result = convertBoolean(createMockDeps(), createContext(schema, { nullable: true }))

    expect(result.nullable).toBe(true)
  })
})

describe('convertNull', () => {
  it('creates a null node', () => {
    const schema: SchemaObject = { type: 'null' } as SchemaObject
    const result = convertNull(createMockDeps(), createContext(schema))

    expect(result.type).toBe('null')
    expect(result).toHaveProperty('primitive', 'null')
  })

  it('preserves schema annotations', () => {
    const schema: SchemaObject = {
      type: 'null',
      title: 'Nothing',
      description: 'Null value',
      deprecated: true,
    } as SchemaObject
    const result = convertNull(createMockDeps(), createContext(schema, { name: 'Nothing' }))

    expect(result.name).toBe('Nothing')
    expect(result.title).toBe('Nothing')
    expect(result.description).toBe('Null value')
    expect(result.deprecated).toBe(true)
  })
})

describe('convertUnion', () => {
  it('converts oneOf into a union node', () => {
    const deps = createMockDeps({
      convertSchema: ({ schema }) => {
        const s = schema as SchemaObject
        return createSchema({ type: (s.type as 'string') ?? 'unknown' })
      },
    })
    const schema: SchemaObject = {
      oneOf: [{ type: 'string' }, { type: 'number' }],
    } as SchemaObject
    const result = convertUnion(deps, createContext(schema))
    const unionNode = narrowSchema(result, 'union')

    expect(unionNode).toBeDefined()
    expect(unionNode?.members).toHaveLength(2)
  })

  it('merges oneOf and anyOf members', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string' }),
    })
    const schema: SchemaObject = {
      oneOf: [{ type: 'string' }],
      anyOf: [{ type: 'number' }],
    } as SchemaObject
    const result = convertUnion(deps, createContext(schema))
    const unionNode = narrowSchema(result, 'union')

    expect(unionNode?.members).toHaveLength(2)
  })

  it('filters out non-object members from oneOf', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string' }),
    })
    // OAS types allow boolean values in oneOf/anyOf
    const schema: SchemaObject = {
      oneOf: [{ type: 'string' }, true as unknown as SchemaObject],
    } as SchemaObject
    const result = convertUnion(deps, createContext(schema))
    const unionNode = narrowSchema(result, 'union')

    expect(unionNode?.members).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// convertAllOf (basic cases — complex discriminator tests are in parser.test.ts)
// ---------------------------------------------------------------------------
describe('convertAllOf', () => {
  it('flattens single-member allOf without sibling properties', () => {
    const deps = createMockDeps({
      convertSchema: () => createSchema({ type: 'string', primitive: 'string', name: 'Inner' }),
    })
    const schema: SchemaObject = {
      allOf: [{ type: 'string' }],
    } as SchemaObject
    const result = convertAllOf(deps, createContext(schema))

    // Single-member allOf is flattened — inherits the member's type
    expect(result.type).toBe('string')
  })

  it('creates intersection for multi-member allOf', () => {
    const deps = createMockDeps({
      convertSchema: ({ schema }) => {
        const s = schema as SchemaObject
        if (s.type === 'object' || s.properties) {
          return createSchema({ type: 'object', primitive: 'object', properties: [] })
        }
        return createSchema({ type: 'unknown' })
      },
    })
    const schema: SchemaObject = {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'number' } } },
      ],
    } as SchemaObject
    const result = convertAllOf(deps, createContext(schema))

    expect(result.type).toBe('intersection')
    expect(result).toHaveProperty('members')
  })
})
