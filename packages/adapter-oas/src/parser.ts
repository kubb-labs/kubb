import { URLPath } from '@internals/utils'
import {
  childName,
  createDiscriminantNode,
  createOperation,
  createParameter,
  createProperty,
  createResponse,
  createRoot,
  createSchema,
  enumPropName,
  extractRefName,
  findDiscriminator,
  mergeAdjacentObjects,
  narrowSchema,
  type ParserOptions,
  setDiscriminatorEnum,
  setEnumName,
  simplifyUnion,
  syncOptionality,
} from '@kubb/ast'
import type {
  DistributiveOmit,
  HttpMethod,
  OperationNode,
  ParameterLocation,
  ParameterNode,
  PrimitiveSchemaType,
  PropertyNode,
  ResponseNode,
  RootNode,
  ScalarSchemaType,
  SchemaNode,
  StatusCode,
} from '@kubb/ast/types'
import BaseOas from 'oas'
import { DEFAULT_PARSER_OPTIONS, enumExtensionKeys, typeOptionMap } from './constants.ts'
import { isDiscriminator, isNullable, isReference } from './guards.ts'
import { resolveRef } from './refs.ts'
import {
  buildSchemaNode,
  flattenSchema,
  getDateType,
  getMediaType,
  getParameters,
  getPrimitiveType,
  getRequestSchema,
  getResponseSchema,
  getSchemas,
  getSchemaType,
} from './resolvers.ts'
import type { ContentType, Document, Operation, ReferenceObject, SchemaObject } from './types.ts'

/**
 * Construction-time context for the OAS parser.
 *
 * Holds the raw OpenAPI document and optional content-type override used when extracting
 * request/response schemas.
 */
export type OasParserContext = {
  document: Document
  contentType?: ContentType
}

/**
 * Pre-computed per-schema context passed to every `convert*` branch handler.
 * Grouping these values avoids repeating the same derivations across all branches.
 */
type SchemaContext = {
  schema: SchemaObject
  name: string | null | undefined
  nullable: true | undefined
  defaultValue: unknown
  /**
   * Normalized single type string (first element when OAS 3.1 multi-type array).
   */
  type: string | undefined
  rawOptions: Partial<ParserOptions> | undefined
  options: ParserOptions
}

/**
 * Normalize a malformed `{ type: 'array', enum: [...] }` schema by moving the
 * enum values into the items sub-schema. This pattern is technically invalid OAS
 * but appears in the wild and must be handled gracefully.
 */
function normalizeArrayEnum(schema: SchemaObject): SchemaObject {
  const isItemsObject = typeof schema.items === 'object' && !Array.isArray(schema.items)
  const normalizedItems: SchemaObject = { ...(isItemsObject ? (schema.items as SchemaObject) : {}), enum: schema.enum }
  const { enum: _enum, ...schemaWithoutEnum } = schema

  return { ...schemaWithoutEnum, items: normalizedItems } as SchemaObject
}

/**
 * Builds the internal converter functions for a given `OasParserContext`.
 *
 * All `convert*` functions are defined as function declarations so they can freely
 * reference each other and `parseSchema` via JS hoisting (mutual recursion).
 */
function createSchemaParser(ctx: OasParserContext) {
  const document = ctx.document

  // Branch handlers — each converts one OAS schema pattern to a SchemaNode.

  /**
   * Tracks `$ref` paths that are currently being resolved to prevent infinite
   * recursion when schemas contain circular references (e.g. `Pet → parent → Pet`).
   */
  const resolvingRefs = new Set<string>()

  /**
   * Converts a `$ref` schema into a `RefSchemaNode`.
   *
   * The resolved schema is stored in `node.schema`. Usage-site sibling fields
   * (description, readOnly, nullable, etc.) are stored directly on the ref node.
   * Use `syncSchemaRef(node)` in printers to get a merged view of both.
   * Circular refs are detected via `resolvingRefs` and leave `schema` as `undefined`.
   */
  function convertRef({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    let resolvedSchema: SchemaNode | undefined
    const refPath = schema.$ref
    if (refPath && !resolvingRefs.has(refPath)) {
      try {
        const referenced = resolveRef<SchemaObject>(document, refPath)
        if (referenced) {
          resolvingRefs.add(refPath)
          resolvedSchema = parseSchema({ schema: referenced }, rawOptions)
          resolvingRefs.delete(refPath)
        }
      } catch {
        // Ref cannot be resolved in this document (e.g. unit tests with minimal documents).
      }
    }

    return createSchema({
      ...buildSchemaNode(schema, name, nullable, defaultValue),
      type: 'ref',
      name: extractRefName(schema.$ref!),
      ref: schema.$ref,
      schema: resolvedSchema,
    })
  }

  /**
   * Converts an `allOf` schema into a flattened node or an `IntersectionSchemaNode`.
   */
  function convertAllOf({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    if (
      schema.allOf!.length === 1 &&
      !schema.properties &&
      !(Array.isArray(schema.required) && schema.required.length) &&
      schema.additionalProperties === undefined
    ) {
      const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
      const memberNode = parseSchema({ schema: memberSchema! as SchemaObject, name: null }, rawOptions)
      const { kind: _kind, ...memberNodeProps } = memberNode
      const mergedNullable = nullable || memberNode.nullable || undefined
      const mergedDefault = schema.default === null && mergedNullable ? undefined : (schema.default ?? memberNode.default)

      return createSchema({
        ...memberNodeProps,
        name,
        title: schema.title ?? memberNode.title,
        description: schema.description ?? memberNode.description,
        deprecated: schema.deprecated ?? memberNode.deprecated,
        nullable: mergedNullable,
        readOnly: schema.readOnly ?? memberNode.readOnly,
        writeOnly: schema.writeOnly ?? memberNode.writeOnly,
        default: mergedDefault,
        example: schema.example ?? memberNode.example,
        pattern: schema.pattern ?? ('pattern' in memberNode ? memberNode.pattern : undefined),
      } as DistributiveOmit<SchemaNode, 'kind'>)
    }

    const filteredDiscriminantValues: Array<{ propertyName: string; value: string }> = []
    const allOfMembers: Array<SchemaNode> = (schema.allOf as Array<SchemaObject | ReferenceObject>)
      .filter((item) => {
        if (!isReference(item) || !name) return true
        const deref = resolveRef<SchemaObject>(document, item.$ref)
        if (!deref || !isDiscriminator(deref)) return true
        const parentUnion = deref.oneOf ?? deref.anyOf
        if (!parentUnion) return true
        const childRef = `#/components/schemas/${name}`
        const inOneOf = parentUnion.some((oneOfItem) => isReference(oneOfItem) && oneOfItem.$ref === childRef)
        const inMapping = Object.values(deref.discriminator.mapping ?? {}).some((v) => v === childRef)
        if (inOneOf || inMapping) {
          const discriminatorValue = findDiscriminator(deref.discriminator.mapping, childRef)
          if (discriminatorValue) {
            filteredDiscriminantValues.push({ propertyName: deref.discriminator.propertyName, value: discriminatorValue })
          }
          return false
        }
        return true
      })
      .map((s) => parseSchema({ schema: s as SchemaObject }, rawOptions))

    const syntheticStart = allOfMembers.length

    if (Array.isArray(schema.required) && schema.required.length) {
      const outerKeys = schema.properties ? new Set(Object.keys(schema.properties)) : new Set<string>()
      const missingRequired = schema.required.filter((key) => !outerKeys.has(key))

      if (missingRequired.length) {
        const resolvedMembers = (schema.allOf as Array<SchemaObject | ReferenceObject>).flatMap((item) => {
          if (!isReference(item)) return [item as SchemaObject]
          const deref = resolveRef<SchemaObject>(document, item.$ref)
          return deref && !isReference(deref) ? [deref] : []
        })

        for (const key of missingRequired) {
          for (const resolved of resolvedMembers) {
            if (resolved.properties?.[key]) {
              allOfMembers.push(parseSchema({ schema: { properties: { [key]: resolved.properties[key] }, required: [key] } as SchemaObject }, rawOptions))
              break
            }
          }
        }
      }
    }

    if (schema.properties) {
      const { allOf: _allOf, ...schemaWithoutAllOf } = schema
      allOfMembers.push(parseSchema({ schema: schemaWithoutAllOf }, rawOptions))
    }

    for (const { propertyName, value } of filteredDiscriminantValues) {
      allOfMembers.push(createDiscriminantNode({ propertyName, value }))
    }

    return createSchema({
      type: 'intersection',
      members: [...mergeAdjacentObjects(allOfMembers.slice(0, syntheticStart)), ...mergeAdjacentObjects(allOfMembers.slice(syntheticStart))],
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `oneOf` / `anyOf` schema into a `UnionSchemaNode`.
   */
  function convertUnion({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    function pickDiscriminatorPropertyNode(node: SchemaNode, propertyName: string): SchemaNode | null {
      const objectNode = narrowSchema(node, 'object')
      const discriminatorProperty = objectNode?.properties?.find((property) => property.name === propertyName)

      if (!discriminatorProperty) {
        return null
      }

      return createSchema({
        type: 'object',
        primitive: 'object',
        properties: [discriminatorProperty],
      })
    }

    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    const unionBase = {
      ...buildSchemaNode(schema, name, nullable, defaultValue),
      discriminatorPropertyName: isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
    }
    const discriminator = isDiscriminator(schema) ? schema.discriminator : undefined
    const sharedPropertiesNode = schema.properties
      ? (() => {
          const { oneOf: _oneOf, anyOf: _anyOf, ...schemaWithoutUnion } = schema
          const memberBaseSchema: SchemaObject = discriminator
            ? (Object.fromEntries(Object.entries(schemaWithoutUnion).filter(([key]) => key !== 'discriminator')) as SchemaObject)
            : schemaWithoutUnion
          return parseSchema({ schema: memberBaseSchema, name }, rawOptions)
        })()
      : undefined

    if (sharedPropertiesNode || discriminator?.mapping) {
      const members = unionMembers.map((s) => {
        const ref = isReference(s) ? s.$ref : undefined
        const discriminatorValue = findDiscriminator(discriminator?.mapping, ref)
        const memberNode = parseSchema({ schema: s as SchemaObject }, rawOptions)

        if (!discriminatorValue || !discriminator) {
          return memberNode
        }

        const narrowedDiscriminatorNode = sharedPropertiesNode
          ? pickDiscriminatorPropertyNode(
              setDiscriminatorEnum({
                node: sharedPropertiesNode,
                propertyName: discriminator.propertyName,
                values: [discriminatorValue],
              }),
              discriminator.propertyName,
            )
          : undefined

        return createSchema({
          type: 'intersection',
          members: [memberNode, narrowedDiscriminatorNode ?? createDiscriminantNode({ propertyName: discriminator.propertyName, value: discriminatorValue })],
        })
      })

      const unionNode = createSchema({
        type: 'union',
        ...unionBase,
        members,
      })

      if (!sharedPropertiesNode) {
        return unionNode
      }

      return createSchema({
        type: 'intersection',
        ...buildSchemaNode(schema, name, nullable, defaultValue),
        members: [unionNode, sharedPropertiesNode],
      })
    }

    return createSchema({
      type: 'union',
      ...unionBase,
      members: simplifyUnion(unionMembers.map((s) => parseSchema({ schema: s as SchemaObject }, rawOptions))),
    })
  }

  /**
   * Converts an OAS 3.1 `const` schema into a null scalar or a single-value `EnumSchemaNode`.
   */
  function convertConst({ schema, name, nullable, defaultValue }: SchemaContext): SchemaNode {
    const constValue = schema.const

    if (constValue === null) {
      return createSchema({
        type: 'null',
        primitive: 'null',
        name,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
      })
    }

    const constPrimitive = getPrimitiveType(typeof constValue === 'number' ? 'number' : typeof constValue === 'boolean' ? 'boolean' : 'string')
    return createSchema({
      type: 'enum',
      primitive: constPrimitive,
      enumValues: [constValue as string | number | boolean],
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a format-annotated schema into a special-type `SchemaNode`.
   * Returns `null` when the format should fall through to string handling (`dateType: false`).
   */
  function convertFormat({ schema, name, nullable, defaultValue, options }: SchemaContext): SchemaNode | null {
    const base = buildSchemaNode(schema, name, nullable, defaultValue)

    if (schema.format === 'int64') {
      return createSchema({
        type: options.integerType === 'bigint' ? 'bigint' : 'integer',
        primitive: 'integer',
        ...base,
        min: schema.minimum,
        max: schema.maximum,
        exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
        exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      })
    }

    if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
      const dateType = getDateType(options, schema.format)
      if (!dateType) return null

      if (dateType.type === 'datetime') {
        return createSchema({ ...base, primitive: 'string' as const, type: 'datetime', offset: dateType.offset, local: dateType.local })
      }
      return createSchema({ ...base, primitive: 'string' as const, type: dateType.type, representation: dateType.representation })
    }

    const specialType = getSchemaType(schema.format!)
    if (!specialType) return null

    const specialPrimitive: PrimitiveSchemaType = specialType === 'number' || specialType === 'integer' || specialType === 'bigint' ? specialType : 'string'

    if (specialType === 'number' || specialType === 'integer' || specialType === 'bigint') {
      return createSchema({ ...base, primitive: specialPrimitive, type: specialType })
    }
    if (specialType === 'url') {
      return createSchema({ ...base, primitive: 'string' as const, type: 'url' })
    }

    return createSchema({ ...base, primitive: specialPrimitive, type: specialType as ScalarSchemaType })
  }

  /**
   * Converts an `enum` schema into an `EnumSchemaNode`.
   */
  function convertEnum({ schema, name, nullable, type, rawOptions }: SchemaContext): SchemaNode {
    if (type === 'array') {
      return parseSchema({ schema: normalizeArrayEnum(schema), name }, rawOptions)
    }

    const nullInEnum = schema.enum!.includes(null)
    const filteredValues = (nullInEnum ? schema.enum!.filter((v) => v !== null) : schema.enum!) as Array<string | number | boolean>
    const enumNullable = nullable || nullInEnum || undefined
    const enumDefault = schema.default === null && enumNullable ? undefined : schema.default
    const enumPrimitive = getPrimitiveType(type)

    const enumBase = {
      type: 'enum' as const,
      primitive: enumPrimitive,
      name,
      title: schema.title,
      description: schema.description,
      deprecated: schema.deprecated,
      nullable: enumNullable,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      default: enumDefault,
      example: schema.example,
    }

    const extensionKey = enumExtensionKeys.find((key) => key in schema)
    if (extensionKey || enumPrimitive === 'number' || enumPrimitive === 'integer' || enumPrimitive === 'boolean') {
      const enumPrimitiveType = (enumPrimitive === 'number' || enumPrimitive === 'integer' ? 'number' : enumPrimitive === 'boolean' ? 'boolean' : 'string') as
        | 'number'
        | 'boolean'
        | 'string'
      const sourceValues = extensionKey
        ? [...new Set((schema as Record<string, unknown>)[extensionKey] as Array<string | number>)]
        : [...new Set(filteredValues)]

      return createSchema({
        ...enumBase,
        primitive: enumPrimitiveType,
        namedEnumValues: sourceValues.map((label, index) => ({
          name: String(label),
          value: extensionKey ? (filteredValues[index] ?? label) : label,
          primitive: enumPrimitiveType,
        })),
      })
    }

    return createSchema({
      ...enumBase,
      enumValues: [...new Set(filteredValues)],
    })
  }

  /**
   * Converts an object-like schema into an `ObjectSchemaNode`.
   */
  function convertObject({ schema, name, nullable, defaultValue, rawOptions, options }: SchemaContext): SchemaNode {
    const properties: Array<PropertyNode> = schema.properties
      ? Object.entries(schema.properties).map(([propName, propSchema]) => {
          const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
          const resolvedPropSchema = propSchema as SchemaObject
          const propNullable = isNullable(resolvedPropSchema)

          const resolvedChildName = childName(name, propName)
          const propNode = parseSchema({ schema: resolvedPropSchema, name: resolvedChildName }, rawOptions)
          let schemaNode = setEnumName(propNode, name, propName, options.enumSuffix)

          const tupleNode = narrowSchema(schemaNode, 'tuple')
          if (tupleNode?.items) {
            const namedItems = tupleNode.items.map((item) => setEnumName(item, name, propName, options.enumSuffix))
            if (namedItems.some((item, i) => item !== tupleNode.items![i])) {
              schemaNode = { ...tupleNode, items: namedItems }
            }
          }

          return createProperty({
            name: propName,
            schema: {
              ...schemaNode,
              nullable: schemaNode.type === 'null' ? undefined : propNullable || undefined,
            },
            required,
          })
        })
      : []

    const additionalProperties = schema.additionalProperties
    let additionalPropertiesNode: SchemaNode | true | undefined
    if (additionalProperties === true) {
      additionalPropertiesNode = true
    } else if (additionalProperties && Object.keys(additionalProperties).length > 0) {
      additionalPropertiesNode = parseSchema({ schema: additionalProperties as SchemaObject }, rawOptions)
    } else if (additionalProperties === false) {
      additionalPropertiesNode = undefined
    } else if (additionalProperties) {
      additionalPropertiesNode = createSchema({ type: typeOptionMap.get(options.unknownType)! })
    }

    const rawPatternProperties = 'patternProperties' in schema ? schema.patternProperties : undefined

    const patternProperties = rawPatternProperties
      ? Object.fromEntries(
          Object.entries(rawPatternProperties).map(([pattern, patternSchema]) => [
            pattern,
            patternSchema === true || (typeof patternSchema === 'object' && Object.keys(patternSchema).length === 0)
              ? createSchema({ type: typeOptionMap.get(options.unknownType)! })
              : parseSchema({ schema: patternSchema as SchemaObject }, rawOptions),
          ]),
        )
      : undefined

    const objectNode: SchemaNode = createSchema({
      type: 'object',
      primitive: 'object',
      properties,
      additionalProperties: additionalPropertiesNode,
      patternProperties,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })

    if (isDiscriminator(schema) && schema.discriminator.mapping) {
      const discPropName = schema.discriminator.propertyName
      const values = Object.keys(schema.discriminator.mapping)
      const enumName = name ? enumPropName(name, discPropName, options.enumSuffix) : undefined
      return setDiscriminatorEnum({ node: objectNode, propertyName: discPropName, values, enumName })
    }

    return objectNode
  }

  /**
   * Converts an OAS 3.1 `prefixItems` tuple into a `TupleSchemaNode`.
   */
  function convertTuple({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    const tupleItems = (schema.prefixItems ?? []).map((item) => parseSchema({ schema: item as SchemaObject }, rawOptions))
    const rest = schema.items ? parseSchema({ schema: schema.items as SchemaObject }, rawOptions) : createSchema({ type: 'any' })

    return createSchema({
      type: 'tuple',
      primitive: 'array',
      items: tupleItems,
      rest,
      min: schema.minItems,
      max: schema.maxItems,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'array'` schema into an `ArraySchemaNode`.
   */
  function convertArray({ schema, name, nullable, defaultValue, rawOptions, options }: SchemaContext): SchemaNode {
    const rawItems = schema.items as SchemaObject | undefined
    const itemName = rawItems?.enum?.length && name ? enumPropName(undefined, name, options.enumSuffix) : undefined
    const items = rawItems ? [parseSchema({ schema: rawItems, name: itemName }, rawOptions)] : []

    return createSchema({
      type: 'array',
      primitive: 'array',
      items,
      min: schema.minItems,
      max: schema.maxItems,
      unique: schema.uniqueItems ?? undefined,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'string'` schema into a `StringSchemaNode`.
   */
  function convertString({ schema, name, nullable, defaultValue }: SchemaContext): SchemaNode {
    return createSchema({
      type: 'string',
      primitive: 'string',
      min: schema.minLength,
      max: schema.maxLength,
      pattern: schema.pattern,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'number'` or `type: 'integer'` schema.
   */
  function convertNumeric({ schema, name, nullable, defaultValue }: SchemaContext, type: 'number' | 'integer'): SchemaNode {
    return createSchema({
      type,
      primitive: type,
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'boolean'` schema.
   */
  function convertBoolean({ schema, name, nullable, defaultValue }: SchemaContext): SchemaNode {
    return createSchema({
      type: 'boolean',
      primitive: 'boolean',
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts an explicit `type: 'null'` schema.
   */
  function convertNull({ schema, name, nullable }: SchemaContext): SchemaNode {
    return createSchema({
      type: 'null',
      primitive: 'null',
      name,
      title: schema.title,
      description: schema.description,
      deprecated: schema.deprecated,
      nullable,
    })
  }

  /**
   * Central dispatcher that converts an OAS `SchemaObject` into a `SchemaNode`.
   *
   * Dispatch order (first match wins): `$ref` → `allOf` → `oneOf`/`anyOf` → `const` → `format`
   * → octet-stream blob → multi-type array → constraint-inferred type → `enum` → object/array/tuple/scalar
   * → empty-schema fallback (`emptySchemaType` option).
   */
  function parseSchema({ schema, name }: { schema: SchemaObject; name?: string | null }, rawOptions?: Partial<ParserOptions>): SchemaNode {
    const options: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...rawOptions }
    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema && flattenedSchema !== schema) {
      return parseSchema({ schema: flattenedSchema, name }, rawOptions)
    }

    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    const ctx: SchemaContext = { schema, name, nullable, defaultValue, type, rawOptions, options }

    if (isReference(schema)) return convertRef(ctx)

    if (schema.allOf?.length) return convertAllOf(ctx)
    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    if (unionMembers.length) return convertUnion(ctx)

    if ('const' in schema && schema.const !== undefined) return convertConst(ctx)

    if (schema.format) {
      const formatResult = convertFormat(ctx)
      if (formatResult) return formatResult
    }

    if (schema.type === 'string' && schema.contentMediaType === 'application/octet-stream') {
      return createSchema({ type: 'blob', primitive: 'string', ...buildSchemaNode(schema, name, nullable, defaultValue) })
    }

    if (Array.isArray(schema.type) && schema.type.length > 1) {
      const nonNullTypes = schema.type.filter((t) => t !== 'null') as string[]
      const arrayNullable = schema.type.includes('null') || nullable || undefined

      if (nonNullTypes.length > 1) {
        return createSchema({
          type: 'union',
          members: nonNullTypes.map((t) => parseSchema({ schema: { ...schema, type: t } as SchemaObject, name }, rawOptions)),
          ...buildSchemaNode(schema, name, arrayNullable, defaultValue),
        })
      }
    }

    if (!type) {
      if (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined) {
        return convertString(ctx)
      }
      if (schema.minimum !== undefined || schema.maximum !== undefined) {
        return convertNumeric(ctx, 'number')
      }
    }

    if (schema.enum?.length) return convertEnum(ctx)
    if (type === 'object' || schema.properties || schema.additionalProperties || 'patternProperties' in schema) return convertObject(ctx)
    if ('prefixItems' in schema) return convertTuple(ctx)
    if (type === 'array' || 'items' in schema) return convertArray(ctx)
    if (type === 'string') return convertString(ctx)
    if (type === 'number') return convertNumeric(ctx, 'number')
    if (type === 'integer') return convertNumeric(ctx, 'integer')
    if (type === 'boolean') return convertBoolean(ctx)
    if (type === 'null') return convertNull(ctx)

    const emptyType = typeOptionMap.get(options.emptySchemaType)!
    return createSchema({ type: emptyType as ScalarSchemaType, name, title: schema.title, description: schema.description })
  }

  /**
   * Converts a dereferenced OAS parameter object into a `ParameterNode`.
   */
  function parseParameter(options: ParserOptions, param: Record<string, unknown>): ParameterNode {
    const required = (param['required'] as boolean | undefined) ?? false

    const schema: SchemaNode = param['schema']
      ? parseSchema({ schema: param['schema'] as SchemaObject }, options)
      : createSchema({ type: typeOptionMap.get(options.unknownType)! })

    return createParameter({
      name: param['name'] as string,
      in: param['in'] as ParameterLocation,
      schema: {
        ...schema,
        description: (param['description'] as string | undefined) ?? schema.description,
      },
      required,
    })
  }

  /**
   * Converts an OAS `Operation` into an `OperationNode`.
   */
  function parseOperation(options: ParserOptions, operation: Operation): OperationNode {
    const parameters: Array<ParameterNode> = getParameters(document, operation).map((param) =>
      parseParameter(options, param as unknown as Record<string, unknown>),
    )

    const requestBodySchema = getRequestSchema(document, operation, { contentType: ctx.contentType })
    const requestBodySchemaNode = requestBodySchema ? parseSchema({ schema: requestBodySchema }, options) : undefined

    const requestBodyDescription =
      operation.schema.requestBody && !isReference(operation.schema.requestBody)
        ? (operation.schema.requestBody as { description?: string }).description
        : undefined

    const requestBodyKeysToOmit = requestBodySchema?.properties
      ? Object.entries(requestBodySchema.properties)
          .filter(([, prop]) => !isReference(prop) && (prop as { readOnly?: boolean }).readOnly)
          .map(([key]) => key)
      : undefined

    const requestBodyRequired =
      operation.schema.requestBody && !isReference(operation.schema.requestBody)
        ? (operation.schema.requestBody as { required?: boolean }).required === true
        : false

    const requestBody = requestBodySchemaNode
      ? {
          description: requestBodyDescription,
          schema: syncOptionality(requestBodySchemaNode, requestBodyRequired),
          keysToOmit: requestBodyKeysToOmit?.length ? requestBodyKeysToOmit : undefined,
          required: requestBodyRequired || undefined,
        }
      : undefined

    const responses: Array<ResponseNode> = operation.getResponseStatusCodes().map((statusCode) => {
      const responseObj = operation.getResponseByStatusCode(statusCode)
      const responseSchema = getResponseSchema(document, operation, statusCode, { contentType: ctx.contentType })

      const schema =
        responseSchema && Object.keys(responseSchema).length > 0
          ? parseSchema({ schema: responseSchema }, options)
          : createSchema({ type: typeOptionMap.get(options.emptySchemaType)! })

      const description = typeof responseObj === 'object' && responseObj !== null && !Array.isArray(responseObj) ? responseObj.description : undefined

      const rawContent =
        typeof responseObj === 'object' && responseObj !== null && !Array.isArray(responseObj)
          ? (responseObj as { content?: Record<string, unknown> }).content
          : undefined

      const mediaType = rawContent ? getMediaType(Object.keys(rawContent)[0] ?? '') : getMediaType(operation.contentType ?? '')

      const keysToOmit = responseSchema?.properties
        ? Object.entries(responseSchema.properties)
            .filter(([, prop]) => !isReference(prop) && (prop as { writeOnly?: boolean }).writeOnly)
            .map(([key]) => key)
        : undefined

      return createResponse({
        statusCode: statusCode as StatusCode,
        description,
        schema,
        mediaType,
        keysToOmit: keysToOmit?.length ? keysToOmit : undefined,
      })
    })

    const urlPath = new URLPath(operation.path)

    return createOperation({
      operationId: operation.getOperationId(),
      method: operation.method.toUpperCase() as HttpMethod,
      path: urlPath.path,
      tags: operation.getTags().map((tag) => tag.name),
      summary: operation.getSummary() || undefined,
      description: operation.getDescription() || undefined,
      deprecated: operation.isDeprecated() || undefined,
      parameters,
      requestBody,
      responses,
    })
  }

  return { parseSchema, parseOperation, parseParameter }
}

/**
 * Converts a single `SchemaObject` into a `SchemaNode`.
 *
 * @example
 * ```ts
 * const ctx = { document }
 * parseSchema(ctx, { schema: { type: 'string', format: 'uuid' } })
 * ```
 */
export function parseSchema(ctx: OasParserContext, { schema, name }: { schema: SchemaObject; name?: string }, options?: Partial<ParserOptions>): SchemaNode {
  return createSchemaParser(ctx).parseSchema({ schema, name }, options)
}

/**
 * Converts the entire OpenAPI spec into a `RootNode` (the top-level `@kubb/ast` tree).
 *
 * This is the main entry point: `OpenAPI / Swagger → Kubb AST`.
 * No code is generated here — the resulting tree is spec-agnostic and consumed by
 * downstream plugins (`plugin-ts`, `plugin-zod`, …).
 *
 * @example
 * ```ts
 * const document = await parseFromConfig(config)
 * const root = parseOas(document, { dateType: 'date', contentType: 'application/json' })
 * ```
 */
export function parseOas(
  document: Document,
  options: Partial<ParserOptions> & { contentType?: ContentType } = {},
): { root: RootNode; nameMapping: Map<string, string> } {
  const { contentType, ...parserOptions } = options
  const mergedOptions: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...parserOptions }

  const { schemas: schemaObjects, nameMapping } = getSchemas(document, { contentType })
  const { parseSchema: _parseSchema, parseOperation: _parseOperation } = createSchemaParser({ document, contentType })

  const schemas: Array<SchemaNode> = Object.entries(schemaObjects).map(([name, schema]) => _parseSchema({ schema, name }, mergedOptions))

  const baseOas = new BaseOas(document)
  const paths = baseOas.getPaths()

  const operations: Array<OperationNode> = Object.entries(paths).flatMap(([_path, methods]) =>
    Object.entries(methods)
      .map(([, operation]) => (operation ? _parseOperation(mergedOptions, operation) : null))
      .filter((op): op is OperationNode => op !== null),
  )

  const root = createRoot({ schemas, operations })

  return { root, nameMapping }
}
