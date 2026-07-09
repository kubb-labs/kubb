import { ast, childName, enumPropName, extractRefName, macroDiscriminatorEnum, macroEnumName, macroSimplifyUnion, mergeAdjacentObjectsLazy } from '@kubb/ast'
import { enumDescriptionKeys, enumExtensionKeys, SCHEMA_REF_PREFIX } from './constants.ts'
import { createDiscriminantNode, findDiscriminator } from './discriminator.ts'
import { isBinary, isDiscriminator, isNullable, isReference } from './oas.ts'
import { resolveRef } from './refs.ts'
import { buildSchemaNode, extractExamples, getDateType, getPrimitiveType, getSchemaType } from './resolvers.ts'
import type { Document, ReferenceObject, SchemaObject } from './types.ts'

/**
 * Pre-computed per-schema context passed to every schema converter.
 *
 * Centralizes schema derivations (type resolution, defaults, options) to avoid repeated
 * computation across all conversion branches. The `type` field is normalized from OAS 3.1
 * multi-type arrays to a single string.
 */
export type SchemaContext = {
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
 * Recurses into a nested schema. Converters call this instead of capturing the parser closure,
 * so each converter stays a standalone function.
 */
export type ParseFn = (entry: { schema: SchemaObject; name?: string | null }, rawOptions?: Partial<ast.ParserOptions>) => ast.SchemaNode

/**
 * What a converter needs from the parser instance beyond the schema: how to recurse, the source
 * document, and the two `$ref` helpers whose caches live on the instance.
 */
export type ConverterDeps = {
  parse: ParseFn
  document: Document
  /**
   * Resolves a `$ref` to its parsed node, with cycle detection and per-instance memoization.
   * Returns `null` for a cycle or an unresolvable target.
   */
  resolveRefNode: (refPath: string, rawOptions?: Partial<ast.ParserOptions>) => ast.SchemaNode | null
  /**
   * Returns `true` when a `$ref` path resolves to a component the document actually defines.
   */
  refExists: (refPath: string) => boolean
}

/**
 * Everything a converter receives: the per-schema context plus what it needs from the parser instance.
 */
export type ConvertContext = SchemaContext & ConverterDeps

/**
 * One entry in the ordered schema rule table: a predicate paired with a converter. A rule whose
 * `match` returns `true` may still `convert` to `null` to defer to the next rule (e.g. a `format`
 * that is not convertible falls through to plain `type` handling).
 */
export type SchemaRule = {
  /**
   * Returns `true` when this rule is responsible for the given context.
   */
  match: (context: ConvertContext) => boolean
  /**
   * Produces a node for the context, or `null` to fall through to the next rule.
   */
  convert: (context: ConvertContext) => ast.SchemaNode | null
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

  const normalized = { ...schemaWithoutEnum, items: normalizedItems }
  return normalized as SchemaObject
}

/**
 * Builds a `null` scalar node carrying the schema's documentation. Shared by the `const: null`
 * and the drf-spectacular `NullEnum` (`{ enum: [null] }`) branches, which render identically.
 */
function createNullNode(schema: SchemaObject, name: string | null | undefined, nullable?: true): ast.SchemaNode {
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
 * Converts a `$ref` schema into a `RefSchemaNode`.
 *
 * The resolved schema is stored in `node.schema`. Usage-site sibling fields
 * (description, readOnly, nullable, etc.) are stored directly on the ref node.
 * Use `syncSchemaRef(node)` in printers to get a merged view of both.
 * Circular refs are detected in `resolveRefNode` and leave `schema` as `null`.
 */
export function convertRef({ schema, name, nullable, defaultValue, rawOptions, document, resolveRefNode, refExists }: ConvertContext): ast.SchemaNode {
  const refPath = schema.$ref
  const resolvedSchema = refPath ? resolveRefNode(refPath, rawOptions) : null

  // A `$ref` to a component the document never defines (a malformed spec) would otherwise emit an
  // import to a module that is never generated, leaving the output uncompilable. Fall back to
  // `unknown` so the rest of the schema still resolves. Only do this for a document that declares a
  // component registry — a registry-less fragment (e.g. a minimal `parse` call) parses refs
  // leniently, since the target is expected to live outside the fragment.
  if (refPath && document.components && !refExists(refPath)) {
    return ast.factory.createSchema({
      ...buildSchemaNode(schema, name, nullable, defaultValue),
      type: 'unknown',
    })
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
export function convertAllOf({ schema, name, nullable, defaultValue, rawOptions, parse, document }: ConvertContext): ast.SchemaNode {
  if (
    schema.allOf!.length === 1 &&
    !schema.properties &&
    !(Array.isArray(schema.required) && schema.required.length) &&
    schema.additionalProperties === undefined
  ) {
    const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
    const memberNode = parse({ schema: memberSchema! as SchemaObject, name }, rawOptions)
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
      if (!isReference(item) || !name) return true
      const deref = resolveRef<SchemaObject>(document, item.$ref)
      if (!deref || !isDiscriminator(deref)) return true
      const parentUnion = deref.oneOf ?? deref.anyOf
      if (!parentUnion) return true
      const childRef = `${SCHEMA_REF_PREFIX}${name}`
      const inOneOf = parentUnion.some((oneOfItem) => isReference(oneOfItem) && oneOfItem.$ref === childRef)
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
    .map((s) => parse({ schema: s as SchemaObject, name }, rawOptions))

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
          const prop = resolved.properties?.[key]
          if (prop) {
            const raw = { properties: { [key]: prop }, required: [key] }
            const memberSchema = raw as SchemaObject
            allOfMembers.push(parse({ schema: memberSchema, name }, rawOptions))
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
    allOfMembers.push(parse({ schema: schemaWithoutAllOf }, rawOptions))
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
export function convertUnion({ schema, name, nullable, defaultValue, rawOptions, parse, document }: ConvertContext): ast.SchemaNode {
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

  // Silent walk — reporting resolver would flag missing refs as errors during speculative lookup.
  function resolveRefSilent($ref: string): SchemaObject | null {
    if (!$ref.startsWith('#')) return null
    const target = decodeURIComponent($ref.substring(1))
      .split('/')
      .filter(Boolean)
      .reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], document)

    return (target as SchemaObject | undefined) ?? null
  }

  function implicitDiscriminantValue(member: unknown): string | null {
    if (!discriminator || discriminator.mapping || !isReference(member)) return null
    const value = extractRefName(member.$ref)
    if (!value) return null
    const variant = resolveRefSilent(member.$ref)
    if (!variant) return null

    const propertyName = discriminator.propertyName
    // Intersecting two different literals on the same property collapses it to `never`,
    // so skip folding the implicit name when the variant already pins the discriminator.
    const seen = new Set([member.$ref])

    function constrains(v: SchemaObject): boolean {
      const prop = v.properties?.[propertyName]
      const resolved = prop && isReference(prop) ? resolveRefSilent(prop.$ref) : (prop as SchemaObject | undefined)
      if (resolved && (Array.isArray(resolved.enum) || resolved.const !== undefined)) return true
      const composition = v.allOf ?? v.oneOf ?? v.anyOf
      if (!composition) return false

      return composition.some((m) => {
        if (!isReference(m)) return constrains(m as SchemaObject)
        if (seen.has(m.$ref)) return false
        seen.add(m.$ref)
        const r = resolveRefSilent(m.$ref)
        return r ? constrains(r) : false
      })
    }

    return constrains(variant) ? null : value
  }

  const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
  const strategy: 'one' | 'any' = schema.oneOf ? 'one' : 'any'
  const unionBase = {
    ...buildSchemaNode(schema, name, nullable, defaultValue),
    discriminatorPropertyName: isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
    strategy,
  }
  const discriminator = isDiscriminator(schema) ? schema.discriminator : undefined
  const { oneOf: _o, anyOf: _a, discriminator: _d, ...memberBaseSchema } = schema
  const sharedPropertiesNode = schema.properties ? parse({ schema: memberBaseSchema as SchemaObject, name }, rawOptions) : undefined

  if (sharedPropertiesNode || discriminator) {
    const members = unionMembers.map((s) => {
      const ref = isReference(s) ? s.$ref : undefined
      const discriminatorValue = findDiscriminator(discriminator?.mapping, ref) ?? implicitDiscriminantValue(s)
      const memberNode = parse({ schema: s as SchemaObject, name }, rawOptions)

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
    members: unionMembers.map((s) => parse({ schema: s as SchemaObject, name }, rawOptions)),
  })

  return ast.applyMacros(unionNode, [macroSimplifyUnion], { depth: 'shallow' })
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
export function convertFormat({ schema, name, nullable, defaultValue, options }: ConvertContext): ast.SchemaNode | null {
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
  const hasLength = specialType === 'url' || specialType === 'uuid' || specialType === 'email'

  return ast.factory.createSchema({
    ...base,
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

  const enumBase = {
    type: 'enum' as const,
    primitive: enumPrimitive,
    ...buildSchemaNode(schema, name, enumNullable as true | undefined, enumDefault),
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

    return ast.factory.createSchema({
      ...enumBase,
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

  return ast.factory.createSchema({
    ...enumBase,
    enumValues: [...new Set(filteredValues)],
  })
}

/**
 * Converts an object-like schema into an `ObjectSchemaNode`.
 */
export function convertObject({ schema, name, nullable, defaultValue, rawOptions, options, parse }: ConvertContext): ast.SchemaNode {
  const properties: Array<ast.PropertyNode> = schema.properties
    ? Object.entries(schema.properties).map(([propName, propSchema]) => {
        const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
        const resolvedPropSchema = propSchema as SchemaObject
        const propNullable = isNullable(resolvedPropSchema)

        const resolvedChildName = childName(name, propName)
        const propNode = parse({ schema: resolvedPropSchema, name: resolvedChildName }, rawOptions)
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
      return parse({ schema: additionalProperties as SchemaObject }, rawOptions)
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
            : parse({ schema: patternSchema as SchemaObject }, rawOptions),
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

  if (isDiscriminator(schema) && schema.discriminator.mapping) {
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
export function convertTuple({ schema, name, nullable, defaultValue, rawOptions, parse }: ConvertContext): ast.SchemaNode {
  const tupleItems = (schema.prefixItems ?? []).map((item) => parse({ schema: item as SchemaObject }, rawOptions))
  // items: false closes the tuple; absent/true widens the tail to any.
  const rest =
    schema.items === false
      ? undefined
      : !schema.items || schema.items === true
        ? ast.factory.createSchema({ type: 'any' })
        : parse({ schema: schema.items as SchemaObject }, rawOptions)

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
export function convertArray({ schema, name, nullable, defaultValue, rawOptions, options, parse }: ConvertContext): ast.SchemaNode {
  const rawItems = schema.items as SchemaObject | undefined
  const itemName = rawItems?.enum?.length && name ? enumPropName(null, name, options.enumSuffix) : name
  const items = rawItems ? [parse({ schema: rawItems, name: itemName }, rawOptions)] : []

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
export function convertString({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
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
export function convertNumeric({ schema, name, nullable, defaultValue }: ConvertContext, type: 'number' | 'integer'): ast.SchemaNode {
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
export function convertBoolean({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'boolean',
    primitive: 'boolean',
    ...buildSchemaNode(schema, name, nullable, defaultValue),
  })
}

/**
 * Converts a binary string schema (`type: 'string'`, `contentMediaType: 'application/octet-stream'`)
 * into a `blob` node.
 */
export function convertBinary({ schema, name, nullable, defaultValue }: ConvertContext): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'blob',
    primitive: 'string',
    ...buildSchemaNode(schema, name, nullable, defaultValue),
  })
}

/**
 * Converts an OAS 3.1 multi-type array (e.g. `type: ['string', 'number']`) into a `UnionSchemaNode`.
 *
 * Returns `null` when only one non-`null` type remains (e.g. `['string', 'null']`), so `parse`
 * falls through and handles it as that single type with nullability already folded in.
 */
export function convertMultiType({ schema, name, nullable, defaultValue, rawOptions, parse }: ConvertContext): ast.SchemaNode | null {
  const types = schema.type as Array<string>
  const nonNullTypes = types.filter((t) => t !== 'null')
  if (nonNullTypes.length <= 1) return null

  const arrayNullable = types.includes('null') || nullable || undefined
  return ast.factory.createSchema({
    type: 'union',
    members: nonNullTypes.map((t) => {
      const raw = { ...schema, type: t }
      const memberSchema = raw as SchemaObject
      return parse({ schema: memberSchema, name }, rawOptions)
    }),
    ...buildSchemaNode(schema, name, arrayNullable, defaultValue),
  })
}

/**
 * Ordered schema rule table. Order is significant: composition keywords (`$ref`, `allOf`,
 * `oneOf`/`anyOf`) take precedence over `const`/`format`, which take precedence over the plain
 * `type`. The first matching rule that produces a node wins. See {@link SchemaRule} for the
 * match/convert/fall-through contract.
 */
export const schemaRules: Array<SchemaRule> = [
  { match: ({ schema }) => isReference(schema), convert: convertRef },
  { match: ({ schema }) => !!schema.allOf?.length, convert: convertAllOf },
  { match: ({ schema }) => !!(schema.oneOf?.length || schema.anyOf?.length), convert: convertUnion },
  { match: ({ schema }) => 'const' in schema && schema.const !== undefined, convert: convertConst },
  { match: ({ schema }) => !!schema.format, convert: convertFormat },
  { match: ({ schema }) => isBinary(schema), convert: convertBinary },
  { match: ({ schema }) => Array.isArray(schema.type) && schema.type.length > 1, convert: convertMultiType },
  {
    match: ({ schema, type }) => !type && (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined),
    convert: convertString,
  },
  {
    match: ({ schema, type }) => !type && (schema.minimum !== undefined || schema.maximum !== undefined),
    convert: (ctx) => convertNumeric(ctx, 'number'),
  },
  { match: ({ schema }) => !!schema.enum?.length, convert: convertEnum },
  {
    match: ({ schema, type }) => type === 'object' || !!schema.properties || !!schema.additionalProperties || 'patternProperties' in schema,
    convert: convertObject,
  },
  { match: ({ schema }) => 'prefixItems' in schema, convert: convertTuple },
  { match: ({ schema, type }) => type === 'array' || 'items' in schema, convert: convertArray },
  { match: ({ type }) => type === 'string', convert: convertString },
  { match: ({ type }) => type === 'number', convert: (ctx) => convertNumeric(ctx, 'number') },
  { match: ({ type }) => type === 'integer', convert: (ctx) => convertNumeric(ctx, 'integer') },
  { match: ({ type }) => type === 'boolean', convert: convertBoolean },
  { match: ({ type }) => type === 'null', convert: ({ schema, name, nullable }) => createNullNode(schema, name, nullable) },
]
