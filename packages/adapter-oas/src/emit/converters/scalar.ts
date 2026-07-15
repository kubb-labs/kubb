import { ast } from '@kubb/ast'
import { enumDescriptionKeys, enumExtensionKeys } from '../../constants.ts'
import type { SchemaObject } from '../../types.ts'
import { createNode } from '../createNode.ts'
import type { ConvertContext } from '../parseSchema.ts'
import { getDateType, getPrimitiveType, getSchemaType } from '../schemaHelpers.ts'

/**
 * Normalizes malformed `{ type: 'array', enum: [...] }` schemas by moving enum values into items.
 *
 * This pattern violates the OpenAPI spec but appears in real specs. The fix moves enum values
 * from the array to its items sub-schema, so they are valid for downstream processing.
 *
 * @note A defensive measure for non-compliant specs.
 */
function normalizeArrayEnum(schema: SchemaObject): SchemaObject {
  const isItemsObject = typeof schema.items === 'object' && !Array.isArray(schema.items)
  const normalizedItems: SchemaObject = {
    ...(isItemsObject ? (schema.items as SchemaObject) : {}),
    enum: schema.enum,
  }
  const { enum: _enum, ...schemaWithoutEnum } = schema
  // `SchemaObject` is a discriminated union; the spread can't be verified against every member
  // structurally, so the merge result is asserted rather than annotated.
  const merged = { ...schemaWithoutEnum, items: normalizedItems }

  return merged as SchemaObject
}

/**
 * Builds a `null` scalar node carrying the schema's documentation. Shared by the `const: null`
 * and the drf-spectacular `NullEnum` (`{ enum: [null] }`) branches, which render identically.
 */
export function createNullNode(schema: SchemaObject, name: string | null | undefined, nullable?: true): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'null',
    primitive: 'null',
    name,
    title: schema.title,
    description: schema.description,
    deprecated: schema.deprecated,
    nullable,
    format: schema.format,
  })
}

/**
 * Converts an OAS 3.1 `const` schema into a null scalar or a single-value `EnumSchemaNode`.
 */
export function convertConst({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
  const constValue = schema.const

  if (constValue === null) {
    return createNullNode(schema, name)
  }

  const constPrimitive = getPrimitiveType(typeof constValue === 'number' ? 'number' : typeof constValue === 'boolean' ? 'boolean' : 'string')
  return createNode(
    { schema, name, nullable, defaultValue },
    {
      type: 'enum',
      primitive: constPrimitive,
      enumValues: [constValue as string | number | boolean],
    },
  )
}

/**
 * Converts a format-annotated schema into a special-type `SchemaNode`. Only called once the
 * `format` rule's `match` has confirmed the format is handled (see `isHandledFormat`) and, for
 * a date-ish format, that `dateType` is not `false`.
 */
export function convertFormat({ schema, name, nullable, defaultValue, options }: ConvertContext): ast.SchemaNode {
  const ctx = { schema, name, nullable, defaultValue }

  if (schema.format === 'int64') {
    return createNode(ctx, {
      type: options.integerType === 'bigint' ? 'bigint' : 'integer',
      primitive: 'integer',
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
    })
  }

  if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
    const dateType = getDateType(options, schema.format)!

    if (dateType.type === 'datetime') {
      return createNode(ctx, {
        primitive: 'string' as const,
        type: 'datetime',
        offset: dateType.offset,
        local: dateType.local,
      })
    }
    return createNode(ctx, {
      primitive: 'string' as const,
      type: dateType.type,
      representation: dateType.representation,
    })
  }

  const specialType = getSchemaType(schema.format!)!

  const specialPrimitive: ast.PrimitiveSchemaType = specialType === 'number' || specialType === 'integer' || specialType === 'bigint' ? specialType : 'string'
  const hasLength = specialType === 'url' || specialType === 'uuid' || specialType === 'email'

  return createNode(ctx, {
    primitive: specialPrimitive,
    type: specialType as ast.ScalarSchemaType,
    ...(hasLength ? { min: schema.minLength, max: schema.maxLength } : {}),
  })
}

/**
 * Converts an `enum` schema into an `EnumSchemaNode`.
 */
export function convertEnum({ schema, name, nullable, type, rawOptions, parse }: ConvertContext): ast.SchemaNode {
  if (type === 'array') {
    return parse({ schema: normalizeArrayEnum(schema), name }, rawOptions)
  }

  const nullInEnum = schema.enum!.includes(null)
  const filteredValues = (nullInEnum ? schema.enum!.filter((v) => v !== null) : schema.enum!) as Array<string | number | boolean>

  // drf-spectacular `NullEnum` ({ enum: [null] }) is just `null`. An empty enum node would
  // render as `never` (plugin-ts) / invalid `z.enum([])` (plugin-zod). Mirror the `const: null`
  // branch so it renders as a clean `null` (not `z.null().nullable()`).
  if (nullInEnum && filteredValues.length === 0) {
    return createNullNode(schema, name)
  }

  const enumNullable = nullable || nullInEnum || undefined
  const enumDefault = schema.default === null && enumNullable ? undefined : schema.default
  const enumPrimitive = getPrimitiveType(type)

  const ctx = { schema, name, nullable: enumNullable as true | undefined, defaultValue: enumDefault }
  const enumExtras = {
    type: 'enum' as const,
    primitive: enumPrimitive,
  }

  const extensionKey = enumExtensionKeys.find((key) => key in schema)
  const descriptionKey = enumDescriptionKeys.find((key) => key in schema)
  if (extensionKey || descriptionKey || enumPrimitive === 'number' || enumPrimitive === 'integer' || enumPrimitive === 'boolean') {
    const enumPrimitiveType = (enumPrimitive === 'number' || enumPrimitive === 'integer' ? 'number' : enumPrimitive === 'boolean' ? 'boolean' : 'string') as
      | 'number'
      | 'boolean'
      | 'string'
    const rawEnumNames = extensionKey ? ((schema as Record<string, unknown>)[extensionKey] as Array<string | number>) : undefined
    const rawEnumDescriptions = descriptionKey ? ((schema as Record<string, unknown>)[descriptionKey] as Array<string>) : undefined
    const uniqueValues = [...new Set(filteredValues)]
    const seenNames = new Set<string>()

    return createNode(ctx, {
      ...enumExtras,
      primitive: enumPrimitiveType,
      namedEnumValues: uniqueValues
        .map((value, index) => ({
          name: String(rawEnumNames?.[index] ?? value),
          value,
          primitive: enumPrimitiveType,
          description: rawEnumDescriptions?.[index],
        }))
        .filter((entry) => {
          if (seenNames.has(entry.name)) return false
          seenNames.add(entry.name)
          return true
        }),
    })
  }

  return createNode(ctx, {
    ...enumExtras,
    enumValues: [...new Set(filteredValues)],
  })
}

/**
 * Converts a `type: 'string'` schema into a `StringSchemaNode`.
 */
export function convertString({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
  return createNode(
    { schema, name, nullable, defaultValue },
    {
      type: 'string',
      primitive: 'string',
      min: schema.minLength,
      max: schema.maxLength,
      pattern: schema.pattern,
    },
  )
}

/**
 * Converts a `type: 'number'` or `type: 'integer'` schema.
 */
export function convertNumeric({ schema, name, nullable, defaultValue }: ConvertContext, type: 'number' | 'integer'): ast.SchemaNode {
  return createNode(
    { schema, name, nullable, defaultValue },
    {
      type,
      primitive: type,
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      multipleOf: schema.multipleOf,
    },
  )
}

/**
 * Converts a `type: 'boolean'` schema.
 */
export function convertBoolean({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
  return createNode({ schema, name, nullable, defaultValue }, { type: 'boolean', primitive: 'boolean' })
}

/**
 * Converts a binary string schema (`type: 'string'`, `contentMediaType: 'application/octet-stream'`)
 * into a `blob` node.
 */
export function convertBinary({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
  return createNode({ schema, name, nullable, defaultValue }, { type: 'blob', primitive: 'string' })
}
