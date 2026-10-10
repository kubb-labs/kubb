import { ast } from '@kubb/kit'
import { enumDescriptionKeys, enumExtensionKeys, formatMap, numericFormats } from '../../constants.ts'
import type { SchemaObject } from '../../types.ts'
import { createNode } from '../createNode.ts'
import type { ConvertContext } from '../parseSchema.ts'
import { resolveDateTypeValue } from '../schemaShape.ts'

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

function getPrimitiveType(type: string | undefined): ast.PrimitiveSchemaType {
  if (type === 'number' || type === 'integer' || type === 'bigint') return type
  if (type === 'boolean') return 'boolean'

  return 'string'
}

/** Shared by number, integer and bigint nodes; the exclusive bounds keep only the OAS 3.1 numeric form. */
function getNumericConstraints(schema: SchemaObject): Pick<ast.NumberSchemaNode, 'min' | 'max' | 'exclusiveMinimum' | 'exclusiveMaximum' | 'multipleOf'> {
  return {
    min: schema.minimum,
    max: schema.maximum,
    exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
    exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
    multipleOf: schema.multipleOf,
  }
}

function getDateType(
  options: ast.ParserOptions,
  format: 'date-time' | 'date' | 'time',
): { type: 'datetime'; offset?: boolean; local?: boolean } | { type: 'date' | 'time'; representation: 'date' | 'string' } {
  const value = resolveDateTypeValue(options.dateType, format)

  if (format !== 'date-time') {
    return { type: format, representation: value === 'date' ? 'date' : 'string' }
  }
  if (value === 'date') return { type: 'date', representation: 'date' }
  if (value === 'stringOffset') return { type: 'datetime', offset: true }
  if (value === 'stringLocal') return { type: 'datetime', local: true }

  return { type: 'datetime', offset: false }
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
export function convertConst(context: ConvertContext): ast.SchemaNode {
  const { schema, name } = context
  const constValue = schema.const

  if (constValue === null) {
    return createNullNode(schema, name)
  }

  return createNode(context, {
    type: 'enum',
    primitive: getPrimitiveType(typeof constValue),
    enumValues: [constValue as string | number | boolean],
  })
}

/**
 * Converts a format-annotated schema into a special-type `SchemaNode`. Only called once the
 * `format` rule's `match` has confirmed the format is handled (see `isHandledFormat`) and, for
 * a date-ish format, that `dateType` is not `false`.
 */
export function convertFormat(context: ConvertContext): ast.SchemaNode {
  const { schema, options, type } = context

  // A numeric format on a `type: 'string'` schema describes how the number is spelled, not that
  // the value is a number, so the declared type wins. The format stays on the node for plugins
  // that want to validate the digits.
  if (type === 'string' && numericFormats.has(schema.format!)) {
    return convertString(context)
  }

  if (schema.format === 'int64' || schema.format === 'uint64') {
    return createNode(context, {
      type: options.integerType === 'bigint' ? 'bigint' : 'integer',
      primitive: 'integer',
      ...getNumericConstraints(schema),
    })
  }

  if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
    const dateType = getDateType(options, schema.format)

    if (dateType.type === 'datetime') {
      return createNode(context, {
        primitive: 'string' as const,
        type: 'datetime',
        offset: dateType.offset,
        local: dateType.local,
      })
    }
    return createNode(context, {
      primitive: 'string' as const,
      type: dateType.type,
      representation: dateType.representation,
    })
  }

  const specialType = formatMap[schema.format as keyof typeof formatMap]

  const isNumeric = specialType === 'number' || specialType === 'integer'
  const specialPrimitive: ast.PrimitiveSchemaType = isNumeric ? specialType : 'string'
  const hasLength = specialType === 'url' || specialType === 'uuid' || specialType === 'email'

  return createNode(context, {
    primitive: specialPrimitive,
    type: specialType as ast.ScalarSchemaType,
    ...(hasLength ? { min: schema.minLength, max: schema.maxLength } : {}),
    ...(isNumeric ? getNumericConstraints(schema) : {}),
  })
}

/**
 * Converts an `enum` schema into an `EnumSchemaNode`.
 */
export function convertEnum({ schema, name, nullable, type, parse }: ConvertContext): ast.SchemaNode {
  if (type === 'array') {
    return parse({ schema: normalizeArrayEnum(schema), name })
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
    const enumPrimitiveType: 'number' | 'boolean' | 'string' = (() => {
      if (enumPrimitive === 'boolean') return 'boolean'
      if (enumPrimitive === 'number' || enumPrimitive === 'integer') return 'number'
      return 'string'
    })()
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
export function convertString(context: ConvertContext): ast.SchemaNode {
  const { schema } = context

  return createNode(context, {
    type: 'string',
    primitive: 'string',
    min: schema.minLength,
    max: schema.maxLength,
    pattern: schema.pattern,
  })
}

/**
 * Converts a `type: 'number'` or `type: 'integer'` schema.
 */
export function convertNumeric(context: ConvertContext, type: 'number' | 'integer'): ast.SchemaNode {
  return createNode(context, {
    type,
    primitive: type,
    ...getNumericConstraints(context.schema),
  })
}
