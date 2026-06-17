import { pascalCase } from '@internals/utils'
import { macroDiscriminatorEnum, macroEnumName, macroSimplifyUnion } from '@kubb/ast/macros'
import { childName, enumPropName, extractRefName, mergeAdjacentObjectsLazy } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS, enumExtensionKeys, SCHEMA_REF_PREFIX } from './constants.ts'
import { oasDialect, type OasDialect } from './dialect.ts'
import { createDiscriminantNode, findDiscriminator } from './discriminator.ts'
import { getOperationId, getOperations, getRequestContentType, getResponseByStatusCode, getResponseStatusCodes } from './operation.ts'
import {
  buildSchemaNode,
  extractExamples,
  flattenSchema,
  getDateType,
  getParameters,
  getPrimitiveType,
  getRequestBodyContentTypes,
  getRequestSchema,
  getResponseBodyContentTypes,
  getResponseSchema,
  getSchemas,
  getSchemaType,
} from './resolvers.ts'
import type { ContentType, Document, Operation, ReferenceObject, SchemaObject } from './types.ts'
import type { StatusCode } from '@kubb/ast'

/**
 * Parser context holding the raw OpenAPI document and optional content-type override.
 *
 * Passed to schema and operation converters to access the full specification
 * and handle content negotiation when multiple media types are available.
 */
export type OasParserContext = {
  document: Document
  contentType?: ContentType
}

/**
 * The object returned by {@link createSchemaParser}.
 * Contains parser functions bound to a specific document.
 */
export type SchemaParser = {
  parseSchema: (entry: { schema: SchemaObject; name?: string | null }, options?: Partial<ast.ParserOptions>) => ast.SchemaNode
  parseOperation: (options: ast.ParserOptions, operation: Operation) => ast.OperationNode
  parseParameter: (options: ast.ParserOptions, param: Record<string, unknown>) => ast.ParameterNode
}

/**
 * Pre-computed per-schema context passed to every schema converter.
 *
 * Centralizes schema derivations (type resolution, defaults, options) to avoid repeated
 * computation across all conversion branches. The `type` field is normalized from OAS 3.1
 * multi-type arrays to a single string.
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
  rawOptions: Partial<ast.ParserOptions> | undefined
  options: ast.ParserOptions
}

/**
 * One entry in the ordered schema rule table: a predicate paired with a converter. A rule whose
 * `match` returns `true` may still `convert` to `null` to defer to the next rule (e.g. a `format`
 * that is not convertible falls through to plain `type` handling).
 */
type SchemaRule = {
  /**
   * Identifies the rule when reading the table or debugging which branch ran.
   */
  name: string
  /**
   * Returns `true` when this rule is responsible for the given context.
   */
  match: (context: SchemaContext) => boolean
  /**
   * Produces a node for the context, or `null` to fall through to the next rule.
   */
  convert: (context: SchemaContext) => ast.SchemaNode | null
}

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

  return { ...schemaWithoutEnum, items: normalizedItems } as SchemaObject
}

/**
 * Builds a `null` scalar node carrying the schema's documentation. Shared by the `const: null`
 * and the drf-spectacular `NullEnum` (`{ enum: [null] }`) branches, which render identically.
 */
function createNullSchema(schema: SchemaObject, name: string | null | undefined): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'null',
    primitive: 'null',
    name,
    title: schema.title,
    description: schema.description,
    deprecated: schema.deprecated,
    format: schema.format,
  })
}

/**
 * Names the inline enums on a property's schema, and on each item when the property is a tuple, from
 * the parent and property name. Wraps `macroEnumName` at the property construction site.
 */
function nameEnums(node: ast.SchemaNode, options: { parentName: string | null | undefined; propName: string; enumSuffix: string }): ast.SchemaNode {
  const macro = macroEnumName(options)
  const named = ast.applyMacros(node, [macro], { depth: 'shallow' })
  const tupleNode = ast.narrowSchema(named, 'tuple')
  if (tupleNode?.items) {
    const namedItems = tupleNode.items.map((item) => ast.applyMacros(item, [macro], { depth: 'shallow' }))
    if (namedItems.some((item, i) => item !== tupleNode.items![i])) {
      return { ...tupleNode, items: namedItems }
    }
  }
  return named
}

/**
 * Factory function that creates schema and operation converters for a given OpenAPI context.
 *
 * Returns closures that share mutable state (`resolvingRefs` set for cycle detection).
 * Each converter branch (`convertRef`, `convertAllOf`, etc.) mutually recursively calls `parseSchema`,
 * which works because function declarations hoist.
 *
 * @internal
 */
export function createSchemaParser(ctx: OasParserContext, dialect: OasDialect = oasDialect) {
  const document = ctx.document

  // Branch handlers, each converts one OAS schema pattern to a SchemaNode.

  /**
   * Tracks `$ref` paths that are currently being resolved to prevent infinite
   * recursion when schemas contain circular references (e.g. `Pet → parent → Pet`).
   */
  const resolvingRefs = new Set<string>()

  /**
   * Cache of `$ref` schemas already resolved in this parser instance, keyed by ref path.
   *
   * Without it, a shared schema (e.g. `customer`) is re-expanded for every `$ref` that points at
   * it. In cross-referenced specs like Stripe (~1400 schemas) that becomes exponential blowup,
   * since one schema can be referenced from dozens of parents, each re-walking its whole subtree.
   * Memoizing by ref path drops the work from O(2^depth) to O(N) unique schema names.
   */
  const resolvedRefCache = new Map<string, ast.SchemaNode | null>()

  /**
   * Converts a `$ref` schema into a `RefSchemaNode`.
   *
   * The resolved schema is stored in `node.schema`. Usage-site sibling fields
   * (description, readOnly, nullable, etc.) are stored directly on the ref node.
   * Use `syncSchemaRef(node)` in printers to get a merged view of both.
   * Circular refs are detected via `resolvingRefs` and leave `schema` as `undefined`.
   */
  function convertRef({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): ast.SchemaNode {
    let resolvedSchema: ast.SchemaNode | null = null
    const refPath = schema.$ref
    if (refPath && !resolvingRefs.has(refPath)) {
      if (!resolvedRefCache.has(refPath)) {
        try {
          const referenced = dialect.schema.resolveRef<SchemaObject>(document, refPath)
          if (referenced) {
            resolvingRefs.add(refPath)
            resolvedSchema = parseSchema({ schema: referenced }, rawOptions)
            resolvingRefs.delete(refPath)
          }
        } catch {
          // Ref cannot be resolved in this document (e.g. unit tests with minimal documents).
        }
        resolvedRefCache.set(refPath, resolvedSchema)
      }
      resolvedSchema = resolvedRefCache.get(refPath) ?? null
    }

    return ast.factory.createSchema({
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
  function convertAllOf({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): ast.SchemaNode {
    if (
      schema.allOf!.length === 1 &&
      !schema.properties &&
      !(Array.isArray(schema.required) && schema.required.length) &&
      schema.additionalProperties === undefined
    ) {
      const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
      const memberNode = parseSchema({ schema: memberSchema! as SchemaObject, name }, rawOptions)
      const { kind: _kind, ...memberNodeProps } = memberNode
      const mergedNullable = nullable || memberNode.nullable || undefined
      const mergedDefault = schema.default === null && mergedNullable ? undefined : (schema.default ?? memberNode.default)

      return ast.factory.createSchema({
        ...memberNodeProps,
        name,
        title: schema.title ?? memberNode.title,
        description: schema.description ?? memberNode.description,
        deprecated: schema.deprecated ?? memberNode.deprecated,
        nullable: mergedNullable,
        readOnly: schema.readOnly ?? memberNode.readOnly,
        writeOnly: schema.writeOnly ?? memberNode.writeOnly,
        default: mergedDefault,
        examples: extractExamples(schema) ?? memberNode.examples,
        pattern: schema.pattern ?? ('pattern' in memberNode ? memberNode.pattern : undefined),
        format: schema.format ?? memberNode.format,
      } as ast.DistributiveOmit<ast.SchemaNode, 'kind'>)
    }

    const filteredDiscriminantValues: Array<{
      propertyName: string
      value: string
    }> = []
    const allOfMembers: Array<ast.SchemaNode> = (schema.allOf as Array<SchemaObject | ReferenceObject>)
      .filter((item) => {
        if (!dialect.schema.isReference(item) || !name) return true
        const deref = dialect.schema.resolveRef<SchemaObject>(document, item.$ref)
        if (!deref || !dialect.schema.isDiscriminator(deref)) return true
        const parentUnion = deref.oneOf ?? deref.anyOf
        if (!parentUnion) return true
        const childRef = `${SCHEMA_REF_PREFIX}${name}`
        const inOneOf = parentUnion.some((oneOfItem) => dialect.schema.isReference(oneOfItem) && oneOfItem.$ref === childRef)
        const inMapping = Object.values(deref.discriminator.mapping ?? {}).some((v) => v === childRef)
        if (inOneOf || inMapping) {
          const discriminatorValue = findDiscriminator(deref.discriminator.mapping, childRef)
          if (discriminatorValue) {
            filteredDiscriminantValues.push({
              propertyName: deref.discriminator.propertyName,
              value: discriminatorValue,
            })
          }
          return false
        }
        return true
      })
      .map((s) => parseSchema({ schema: s as SchemaObject, name }, rawOptions))

    const syntheticStart = allOfMembers.length

    if (Array.isArray(schema.required) && schema.required.length) {
      const outerKeys = schema.properties ? new Set(Object.keys(schema.properties)) : new Set<string>()
      const missingRequired = schema.required.filter((key) => !outerKeys.has(key))

      if (missingRequired.length) {
        const resolvedMembers = (schema.allOf as Array<SchemaObject | ReferenceObject>).flatMap((item) => {
          if (!dialect.schema.isReference(item)) return [item as SchemaObject]
          const deref = dialect.schema.resolveRef<SchemaObject>(document, item.$ref)
          return deref && !dialect.schema.isReference(deref) ? [deref] : []
        })

        for (const key of missingRequired) {
          for (const resolved of resolvedMembers) {
            if (resolved.properties?.[key]) {
              allOfMembers.push(
                parseSchema(
                  {
                    schema: {
                      properties: { [key]: resolved.properties[key] },
                      required: [key],
                    } as SchemaObject,
                    name,
                  },
                  rawOptions,
                ),
              )
              break
            }
          }
        }
      }
    }

    if (schema.properties) {
      const { allOf: _allOf, ...schemaWithoutAllOf } = schema
      // Don't pass `name` here, the result must stay anonymous so it can be merged with the
      // adjacent synthetic object in `mergeAdjacentObjectsLazy`. Nested enum qualification
      // happens upstream via `convertObject`'s `setEnumName` propagation.
      allOfMembers.push(parseSchema({ schema: schemaWithoutAllOf }, rawOptions))
    }

    for (const { propertyName, value } of filteredDiscriminantValues) {
      allOfMembers.push(createDiscriminantNode({ propertyName, value }))
    }

    return ast.factory.createSchema({
      type: 'intersection',
      members: [...mergeAdjacentObjectsLazy(allOfMembers.slice(0, syntheticStart)), ...mergeAdjacentObjectsLazy(allOfMembers.slice(syntheticStart))],
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `oneOf` / `anyOf` schema into a `UnionSchemaNode`.
   */
  function convertUnion({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): ast.SchemaNode {
    function pickDiscriminatorPropertyNode(node: ast.SchemaNode, propertyName: string): ast.SchemaNode | null {
      const objectNode = ast.narrowSchema(node, 'object')
      const discriminatorProperty = objectNode?.properties?.find((property) => property.name === propertyName)

      if (!discriminatorProperty) {
        return null
      }

      return ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [discriminatorProperty],
      })
    }

    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    const strategy: 'one' | 'any' = schema.oneOf ? 'one' : 'any'
    const unionBase = {
      ...buildSchemaNode(schema, name, nullable, defaultValue),
      discriminatorPropertyName: dialect.schema.isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
      strategy,
    }
    const discriminator = dialect.schema.isDiscriminator(schema) ? schema.discriminator : undefined
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
        const ref = dialect.schema.isReference(s) ? s.$ref : undefined
        const discriminatorValue = findDiscriminator(discriminator?.mapping, ref)
        const memberNode = parseSchema({ schema: s as SchemaObject, name }, rawOptions)

        if (!discriminatorValue || !discriminator) {
          return memberNode
        }

        const narrowedDiscriminatorNode = sharedPropertiesNode
          ? pickDiscriminatorPropertyNode(
              ast.applyMacros(sharedPropertiesNode, [macroDiscriminatorEnum({ propertyName: discriminator.propertyName, values: [discriminatorValue] })], {
                depth: 'shallow',
              }),
              discriminator.propertyName,
            )
          : undefined

        return ast.factory.createSchema({
          type: 'intersection',
          members: [
            memberNode,
            narrowedDiscriminatorNode ??
              createDiscriminantNode({
                propertyName: discriminator.propertyName,
                value: discriminatorValue,
              }),
          ],
        })
      })

      const unionNode = ast.factory.createSchema({
        type: 'union',
        ...unionBase,
        members,
      })

      if (!sharedPropertiesNode) {
        return unionNode
      }

      return ast.factory.createSchema({
        type: 'intersection',
        ...buildSchemaNode(schema, name, nullable, defaultValue),
        members: [unionNode, sharedPropertiesNode],
      })
    }

    const unionNode = ast.factory.createSchema({
      type: 'union',
      ...unionBase,
      members: unionMembers.map((s) => parseSchema({ schema: s as SchemaObject, name }, rawOptions)),
    })

    return ast.applyMacros(unionNode, [macroSimplifyUnion], { depth: 'shallow' })
  }

  /**
   * Converts an OAS 3.1 `const` schema into a null scalar or a single-value `EnumSchemaNode`.
   */
  function convertConst({ schema, name, nullable, defaultValue }: SchemaContext): ast.SchemaNode {
    const constValue = schema.const

    if (constValue === null) {
      return createNullSchema(schema, name)
    }

    const constPrimitive = getPrimitiveType(typeof constValue === 'number' ? 'number' : typeof constValue === 'boolean' ? 'boolean' : 'string')
    return ast.factory.createSchema({
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
  function convertFormat({ schema, name, nullable, defaultValue, options }: SchemaContext): ast.SchemaNode | null {
    const base = buildSchemaNode(schema, name, nullable, defaultValue)

    if (schema.format === 'int64') {
      return ast.factory.createSchema({
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
        return ast.factory.createSchema({
          ...base,
          primitive: 'string' as const,
          type: 'datetime',
          offset: dateType.offset,
          local: dateType.local,
        })
      }
      return ast.factory.createSchema({
        ...base,
        primitive: 'string' as const,
        type: dateType.type,
        representation: dateType.representation,
      })
    }

    const specialType = getSchemaType(schema.format!)
    if (!specialType) return null

    const specialPrimitive: ast.PrimitiveSchemaType = specialType === 'number' || specialType === 'integer' || specialType === 'bigint' ? specialType : 'string'

    if (specialType === 'number' || specialType === 'integer' || specialType === 'bigint') {
      return ast.factory.createSchema({
        ...base,
        primitive: specialPrimitive,
        type: specialType,
      })
    }
    if (specialType === 'url') {
      return ast.factory.createSchema({
        ...base,
        primitive: 'string' as const,
        type: 'url',
        min: schema.minLength,
        max: schema.maxLength,
      })
    }
    if (specialType === 'ipv4') {
      return ast.factory.createSchema({
        ...base,
        primitive: 'string' as const,
        type: 'ipv4',
      })
    }
    if (specialType === 'ipv6') {
      return ast.factory.createSchema({
        ...base,
        primitive: 'string' as const,
        type: 'ipv6',
      })
    }
    if (specialType === 'uuid' || specialType === 'email') {
      return ast.factory.createSchema({
        ...base,
        primitive: 'string' as const,
        type: specialType,
        min: schema.minLength,
        max: schema.maxLength,
      })
    }

    return ast.factory.createSchema({
      ...base,
      primitive: specialPrimitive,
      type: specialType as ast.ScalarSchemaType,
    })
  }

  /**
   * Converts an `enum` schema into an `EnumSchemaNode`.
   */
  function convertEnum({ schema, name, nullable, type, rawOptions }: SchemaContext): ast.SchemaNode {
    if (type === 'array') {
      return parseSchema({ schema: normalizeArrayEnum(schema), name }, rawOptions)
    }

    const nullInEnum = schema.enum!.includes(null)
    const filteredValues = (nullInEnum ? schema.enum!.filter((v) => v !== null) : schema.enum!) as Array<string | number | boolean>

    // drf-spectacular `NullEnum` ({ enum: [null] }) is just `null`. An empty enum node would
    // render as `never` (plugin-ts) / invalid `z.enum([])` (plugin-zod). Mirror the `const: null`
    // branch so it renders as a clean `null` (not `z.null().nullable()`).
    if (nullInEnum && filteredValues.length === 0) {
      return createNullSchema(schema, name)
    }

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
      examples: extractExamples(schema),
      format: schema.format,
    }

    const extensionKey = enumExtensionKeys.find((key) => key in schema)
    if (extensionKey || enumPrimitive === 'number' || enumPrimitive === 'integer' || enumPrimitive === 'boolean') {
      const enumPrimitiveType = (enumPrimitive === 'number' || enumPrimitive === 'integer' ? 'number' : enumPrimitive === 'boolean' ? 'boolean' : 'string') as
        | 'number'
        | 'boolean'
        | 'string'
      const rawEnumNames = extensionKey ? ((schema as Record<string, unknown>)[extensionKey] as Array<string | number>) : undefined
      const uniqueValues = [...new Set(filteredValues)]
      const seenNames = new Set<string>()

      return ast.factory.createSchema({
        ...enumBase,
        primitive: enumPrimitiveType,
        namedEnumValues: uniqueValues
          .map((value, index) => ({
            name: String(rawEnumNames?.[index] ?? value),
            value,
            primitive: enumPrimitiveType,
          }))
          .filter((entry) => {
            if (seenNames.has(entry.name)) return false
            seenNames.add(entry.name)
            return true
          }),
      })
    }

    return ast.factory.createSchema({
      ...enumBase,
      enumValues: [...new Set(filteredValues)],
    })
  }

  /**
   * Converts an object-like schema into an `ObjectSchemaNode`.
   */
  function convertObject({ schema, name, nullable, defaultValue, rawOptions, options }: SchemaContext): ast.SchemaNode {
    const properties: Array<ast.PropertyNode> = schema.properties
      ? Object.entries(schema.properties).map(([propName, propSchema]) => {
          const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
          const resolvedPropSchema = propSchema as SchemaObject
          const propNullable = dialect.schema.isNullable(resolvedPropSchema)

          const resolvedChildName = childName(name, propName)
          const propNode = parseSchema({ schema: resolvedPropSchema, name: resolvedChildName }, rawOptions)
          const schemaNode = nameEnums(propNode, { parentName: name, propName, enumSuffix: options.enumSuffix })

          return ast.factory.createProperty({
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
    const additionalPropertiesNode: ast.SchemaNode | boolean | undefined = (() => {
      if (additionalProperties === true) return true
      if (additionalProperties === false) return false
      if (additionalProperties && Object.keys(additionalProperties).length > 0) {
        return parseSchema({ schema: additionalProperties as SchemaObject }, rawOptions)
      }
      if (additionalProperties) return ast.factory.createSchema({ type: options.unknownType })
      return undefined
    })()

    const rawPatternProperties = 'patternProperties' in schema ? schema.patternProperties : undefined

    const patternProperties = rawPatternProperties
      ? Object.fromEntries(
          Object.entries(rawPatternProperties).map(([pattern, patternSchema]) => [
            pattern,
            patternSchema === true || (typeof patternSchema === 'object' && Object.keys(patternSchema).length === 0)
              ? ast.factory.createSchema({
                  type: options.unknownType,
                })
              : parseSchema({ schema: patternSchema as SchemaObject }, rawOptions),
          ]),
        )
      : undefined

    const objectNode: ast.SchemaNode = ast.factory.createSchema({
      type: 'object',
      primitive: 'object',
      properties,
      additionalProperties: additionalPropertiesNode,
      patternProperties,
      minProperties: schema.minProperties,
      maxProperties: schema.maxProperties,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })

    if (dialect.schema.isDiscriminator(schema) && schema.discriminator.mapping) {
      const discPropName = schema.discriminator.propertyName
      const values = Object.keys(schema.discriminator.mapping)
      const enumName = name ? enumPropName(name, discPropName, options.enumSuffix) : undefined
      return ast.applyMacros(objectNode, [macroDiscriminatorEnum({ propertyName: discPropName, values, enumName })], { depth: 'shallow' })
    }

    return objectNode
  }

  /**
   * Converts an OAS 3.1 `prefixItems` tuple into a `TupleSchemaNode`.
   */
  function convertTuple({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): ast.SchemaNode {
    const tupleItems = (schema.prefixItems ?? []).map((item) => parseSchema({ schema: item as SchemaObject }, rawOptions))
    const rest = schema.items ? parseSchema({ schema: schema.items as SchemaObject }, rawOptions) : ast.factory.createSchema({ type: 'any' })

    return ast.factory.createSchema({
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
  function convertArray({ schema, name, nullable, defaultValue, rawOptions, options }: SchemaContext): ast.SchemaNode {
    const rawItems = schema.items as SchemaObject | undefined
    const itemName = rawItems?.enum?.length && name ? enumPropName(null, name, options.enumSuffix) : name
    const items = rawItems ? [parseSchema({ schema: rawItems, name: itemName }, rawOptions)] : []

    return ast.factory.createSchema({
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
  function convertString({ schema, name, nullable, defaultValue }: SchemaContext): ast.SchemaNode {
    return ast.factory.createSchema({
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
  function convertNumeric({ schema, name, nullable, defaultValue }: SchemaContext, type: 'number' | 'integer'): ast.SchemaNode {
    return ast.factory.createSchema({
      type,
      primitive: type,
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      multipleOf: schema.multipleOf,
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'boolean'` schema.
   */
  function convertBoolean({ schema, name, nullable, defaultValue }: SchemaContext): ast.SchemaNode {
    return ast.factory.createSchema({
      type: 'boolean',
      primitive: 'boolean',
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts an explicit `type: 'null'` schema.
   */
  function convertNull({ schema, name, nullable }: SchemaContext): ast.SchemaNode {
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
   * Converts a binary string schema (`type: 'string'`, `contentMediaType: 'application/octet-stream'`)
   * into a `blob` node.
   */
  function convertBlob({ schema, name, nullable, defaultValue }: SchemaContext): ast.SchemaNode {
    return ast.factory.createSchema({
      type: 'blob',
      primitive: 'string',
      ...buildSchemaNode(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts an OAS 3.1 multi-type array (e.g. `type: ['string', 'number']`) into a `UnionSchemaNode`.
   *
   * Returns `null` when only one non-`null` type remains (e.g. `['string', 'null']`), so `parseSchema`
   * falls through and handles it as that single type with nullability already folded in.
   */
  function convertMultiType({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): ast.SchemaNode | null {
    const types = schema.type as Array<string>
    const nonNullTypes = types.filter((t) => t !== 'null')
    if (nonNullTypes.length <= 1) return null

    const arrayNullable = types.includes('null') || nullable || undefined
    return ast.factory.createSchema({
      type: 'union',
      members: nonNullTypes.map((t) => parseSchema({ schema: { ...schema, type: t } as SchemaObject, name }, rawOptions)),
      ...buildSchemaNode(schema, name, arrayNullable, defaultValue),
    })
  }

  /**
   * Ordered schema rule table. Order is significant: composition keywords (`$ref`, `allOf`,
   * `oneOf`/`anyOf`) take precedence over `const`/`format`, which take precedence over the plain
   * `type`. The first matching rule that produces a node wins. See {@link SchemaRule} for the
   * match/convert/fall-through contract.
   */
  const schemaRules: Array<SchemaRule> = [
    { name: 'ref', match: ({ schema }) => dialect.schema.isReference(schema), convert: convertRef },
    { name: 'allOf', match: ({ schema }) => !!schema.allOf?.length, convert: convertAllOf },
    { name: 'union', match: ({ schema }) => !!(schema.oneOf?.length || schema.anyOf?.length), convert: convertUnion },
    { name: 'const', match: ({ schema }) => 'const' in schema && schema.const !== undefined, convert: convertConst },
    { name: 'format', match: ({ schema }) => !!schema.format, convert: convertFormat },
    {
      name: 'blob',
      match: ({ schema }) => dialect.schema.isBinary(schema),
      convert: convertBlob,
    },
    { name: 'multi-type', match: ({ schema }) => Array.isArray(schema.type) && schema.type.length > 1, convert: convertMultiType },
    {
      name: 'constrained-string',
      match: ({ schema, type }) => !type && (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined),
      convert: convertString,
    },
    {
      name: 'constrained-number',
      match: ({ schema, type }) => !type && (schema.minimum !== undefined || schema.maximum !== undefined),
      convert: (ctx) => convertNumeric(ctx, 'number'),
    },
    { name: 'enum', match: ({ schema }) => !!schema.enum?.length, convert: convertEnum },
    {
      name: 'object',
      match: ({ schema, type }) => type === 'object' || !!schema.properties || !!schema.additionalProperties || 'patternProperties' in schema,
      convert: convertObject,
    },
    { name: 'tuple', match: ({ schema }) => 'prefixItems' in schema, convert: convertTuple },
    { name: 'array', match: ({ schema, type }) => type === 'array' || 'items' in schema, convert: convertArray },
    { name: 'string', match: ({ type }) => type === 'string', convert: convertString },
    { name: 'number', match: ({ type }) => type === 'number', convert: (ctx) => convertNumeric(ctx, 'number') },
    { name: 'integer', match: ({ type }) => type === 'integer', convert: (ctx) => convertNumeric(ctx, 'integer') },
    { name: 'boolean', match: ({ type }) => type === 'boolean', convert: convertBoolean },
    { name: 'null', match: ({ type }) => type === 'null', convert: convertNull },
  ]

  /**
   * Converts an OAS `SchemaObject` into a `SchemaNode`.
   *
   * Builds the per-schema context, then walks the ordered {@link schemaRules} table and returns
   * the first converter that produces a node. When none match, falls back to the configured
   * `emptySchemaType`.
   */
  function parseSchema({ schema, name }: { schema: SchemaObject; name?: string | null }, rawOptions?: Partial<ast.ParserOptions>): ast.SchemaNode {
    const options: ast.ParserOptions = {
      ...DEFAULT_PARSER_OPTIONS,
      ...rawOptions,
    }
    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema && flattenedSchema !== schema) {
      return parseSchema({ schema: flattenedSchema, name }, rawOptions)
    }

    const nullable = dialect.schema.isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    const schemaCtx: SchemaContext = {
      schema,
      name,
      nullable,
      defaultValue,
      type,
      rawOptions,
      options,
    }

    for (const rule of schemaRules) {
      if (!rule.match(schemaCtx)) continue
      const node = rule.convert(schemaCtx)
      if (node) return node
    }

    const emptyType = options.emptySchemaType
    return ast.factory.createSchema({
      type: emptyType as ast.ScalarSchemaType,
      name,
      title: schema.title,
      description: schema.description,
      format: schema.format,
    })
  }

  /**
   * Converts a dereferenced OAS parameter object into a `ParameterNode`.
   */
  function parseParameter(options: ast.ParserOptions, param: Record<string, unknown>, parentName?: string): ast.ParameterNode {
    const required = (param['required'] as boolean | undefined) ?? false
    const paramName = param['name'] as string
    const schemaName = parentName && paramName ? pascalCase(`${parentName} ${paramName}`) : undefined

    const schema: ast.SchemaNode = param['schema']
      ? parseSchema({ schema: param['schema'] as SchemaObject, name: schemaName }, options)
      : ast.factory.createSchema({ type: options.unknownType })

    return ast.factory.createParameter({
      name: paramName,
      in: param['in'] as ast.ParameterLocation,
      schema: {
        ...schema,
        description: (param['description'] as string | undefined) ?? schema.description,
      },
      required,
    })
  }

  /**
   * Reads the inline `requestBody` metadata (description / required) that OAS exposes
   * outside the schema itself. Returns an empty object when the request body is missing or a `$ref`.
   */
  function getRequestBodyMeta(operation: Operation): {
    description?: string
    required: boolean
  } {
    const body = operation.schema.requestBody as { description?: string; required?: boolean } | undefined
    if (!body) return { required: false }

    // After getRequestBodyContentTypes has run, body may still carry $ref but the
    // resolved fields (description, required, content) are already spread onto it.
    return {
      description: body.description,
      required: body.required === true,
    }
  }

  /**
   * Reads the inline response object (not a `$ref`) and returns its description plus its `content` map.
   */
  function getResponseMeta(responseObj: unknown): {
    description?: string
    content?: Record<string, unknown>
  } {
    if (typeof responseObj !== 'object' || responseObj === null || Array.isArray(responseObj)) return {}

    const inline = responseObj as {
      description?: string
      content?: Record<string, unknown>
    }
    return { description: inline.description, content: inline.content }
  }

  /**
   * Collects property names whose schema has a truthy boolean flag (`readOnly` or `writeOnly`).
   * `$ref` entries are skipped since their flags live on the dereferenced target.
   */
  function collectPropertyKeysByFlag(schema: SchemaObject | null, flag: 'readOnly' | 'writeOnly'): Array<string> | null {
    if (!schema?.properties) return null

    const keys: Array<string> = []
    for (const key in schema.properties) {
      const prop = schema.properties[key]
      if (prop && !dialect.schema.isReference(prop) && (prop as Record<string, unknown>)[flag]) {
        keys.push(key)
      }
    }
    return keys.length ? keys : null
  }

  /**
   * Converts an OAS `Operation` into an `OperationNode`.
   */
  function parseOperation(options: ast.ParserOptions, operation: Operation): ast.OperationNode {
    const operationId = getOperationId(operation)
    const operationName = operationId ? pascalCase(operationId) : undefined
    const parameters: Array<ast.ParameterNode> = getParameters(document, operation).map((param) =>
      parseParameter(options, param as unknown as Record<string, unknown>, operationName),
    )

    // Determine which content types to include in requestBody.content.
    // When a global contentType is configured, restrict to that single type.
    // Otherwise include every content type declared in the spec.
    const allContentTypes = ctx.contentType ? [ctx.contentType] : getRequestBodyContentTypes(document, operation)

    const requestBodyMeta = getRequestBodyMeta(operation)
    const requestBodyName = operationName ? `${operationName}Request` : undefined

    const content = allContentTypes.flatMap((ct) => {
      const schema = getRequestSchema(document, operation, { contentType: ct })
      if (!schema) return []
      return [
        ast.factory.createContent({
          contentType: ct,
          schema: ast.optionality(parseSchema({ schema, name: requestBodyName }, options), requestBodyMeta.required),
          keysToOmit: collectPropertyKeysByFlag(schema, 'readOnly'),
        }),
      ]
    })

    const requestBody =
      content.length > 0 || requestBodyMeta.description
        ? {
            description: requestBodyMeta.description,
            required: requestBodyMeta.required || undefined,
            content: content.length > 0 ? content : undefined,
          }
        : undefined

    const responses: Array<ast.ResponseNode> = getResponseStatusCodes(operation).map((statusCode) => {
      const responseObj = getResponseByStatusCode({ document, operation, statusCode })

      // Use `Status<code>` (matching plugin-ts's resolveResponseStatusName convention) so the
      // qualified names for nested enums don't collide with top-level component schemas that
      // happen to be named `<operation><statusCode>` (e.g. `GetMaintenance200`).
      const responseName = operationName ? `${operationName}Status${statusCode}` : undefined
      const { description } = getResponseMeta(responseObj)

      const parseEntrySchema = (contentType?: string) => {
        const raw = getResponseSchema(document, operation, statusCode, { contentType })
        const node =
          raw && Object.keys(raw).length > 0
            ? parseSchema({ schema: raw, name: responseName }, options)
            : ast.factory.createSchema({ type: options.emptySchemaType })
        return { schema: node, keysToOmit: collectPropertyKeysByFlag(raw, 'writeOnly') }
      }

      // Build one entry per declared response content type so plugins can union the variants.
      // When a global contentType is configured, restrict to that single type (mirrors requestBody).
      const responseContentTypes = ctx.contentType ? [ctx.contentType] : getResponseBodyContentTypes(document, operation, statusCode)
      const content = responseContentTypes.map((contentType) => ast.factory.createContent({ contentType, ...parseEntrySchema(contentType) }))

      // Body-less responses keep a single fallback entry so the response still resolves to a
      // (void/any) schema, matching how `requestBody` only carries schemas inside `content`.
      if (content.length === 0) {
        content.push(
          ast.factory.createContent({
            contentType: getRequestContentType({ document, operation }) || 'application/json',
            ...parseEntrySchema(ctx.contentType),
          }),
        )
      }

      return ast.factory.createResponse({
        statusCode: statusCode as StatusCode,
        description,
        content,
      })
    })

    const pathItem = document.paths?.[operation.path]
    const pathItemDoc = pathItem && !dialect.schema.isReference(pathItem) ? (pathItem as { summary?: unknown; description?: unknown }) : undefined
    const pickDoc = (key: 'summary' | 'description'): string | undefined => {
      const own = operation.schema[key]
      if (typeof own === 'string') return own
      const fallback = pathItemDoc?.[key]
      return typeof fallback === 'string' ? fallback : undefined
    }

    return ast.factory.createOperation({
      operationId,
      protocol: 'http',
      method: operation.method.toUpperCase() as ast.HttpMethod,
      path: operation.path,
      tags: Array.isArray(operation.schema.tags) ? operation.schema.tags.map(String) : [],
      summary: pickDoc('summary') || undefined,
      description: pickDoc('description') || undefined,
      deprecated: operation.schema.deprecated || undefined,
      parameters,
      requestBody,
      responses,
    })
  }

  return { parseSchema, parseOperation, parseParameter }
}

/**
 * Parses a single OpenAPI `SchemaObject` into a `SchemaNode`.
 *
 * Reach for this when you only need one schema, not the whole spec. To parse a full spec
 * with its operations and schemas, call `parseOas()`.
 *
 * @note Internal state tracks `$ref` paths under resolution, so circular schemas stop
 * recursing instead of looping.
 *
 * @example
 * ```ts
 * const document = yaml.parse(fs.readFileSync('openapi.yaml', 'utf8'))
 * const ctx = { document }
 * const schema = parseSchema(ctx, { schema: { type: 'string', format: 'uuid' } })
 * ```
 */
export function parseSchema(
  ctx: OasParserContext,
  { schema, name }: { schema: SchemaObject; name?: string },
  options?: Partial<ast.ParserOptions>,
): ast.SchemaNode {
  return createSchemaParser(ctx).parseSchema({ schema, name }, options)
}

/**
 * Parses an OpenAPI specification into Kubb's universal `InputNode` AST.
 *
 * This is the main entry point for `@kubb/adapter-oas`. It converts OpenAPI/Swagger specs into a spec-agnostic tree
 * that downstream plugins (`plugin-ts`, `plugin-zod`, etc.) consume for code generation. No code is generated here.
 * The tree is a pure data structure of all schemas and operations.
 *
 * Returns the AST root and a `nameMapping` for resolving schema references.
 *
 * @example
 * ```ts
 * import { parseOas } from '@kubb/adapter-oas'
 *
 * const document = await parseFromConfig(config)
 * const { root, nameMapping } = parseOas(document, { dateType: 'date', contentType: 'application/json' })
 * ```
 */
export function parseOas(
  document: Document,
  options: Partial<ast.ParserOptions> & { contentType?: ContentType } = {},
): { root: ast.InputNode; nameMapping: Map<string, string> } {
  const { contentType, ...parserOptions } = options
  const mergedOptions: ast.ParserOptions = {
    ...DEFAULT_PARSER_OPTIONS,
    ...parserOptions,
  }

  const { schemas: schemaObjects, nameMapping } = getSchemas(document, {
    contentType,
  })
  const { parseSchema: _parseSchema, parseOperation: _parseOperation } = createSchemaParser({ document, contentType })

  const schemas: Array<ast.SchemaNode> = Object.entries(schemaObjects).map(([name, schema]) => _parseSchema({ schema, name }, mergedOptions))

  const operations: Array<ast.OperationNode> = getOperations(document)
    .map((operation) => _parseOperation(mergedOptions, operation))
    .filter((op): op is ast.OperationNode => op !== null)

  const root = ast.factory.createInput({ schemas, operations })

  return { root, nameMapping }
}
