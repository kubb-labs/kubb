import { createProperty, createSchema } from '@kubb/ast'
import type { PrimitiveSchemaType, PropertyNode, SchemaNode, ScalarSchemaType } from '@kubb/ast/types'
import { enumExtensionKeys, formatMap } from './constants.ts'
import type { ReferenceObject, SchemaObject } from './oas/types.ts'
import { isDiscriminator, isNullable, isReference } from './oas/utils.ts'
import type { ConverterDeps, SchemaContext } from './parser.ts'
import { formatToSchemaType, getPrimitiveType } from './parser.ts'
import type { DistributiveOmit, ParserOptions } from './types.ts'
import { applyDiscriminatorEnum, extractRefName, mergeAdjacentAnonymousObjects, simplifyUnionMembers } from './utils.ts'


/**
 * Converts a `$ref` schema pointer into a `RefSchemaNode`.
 *
 * Resolves the target schema's `title` and `description` so that ref properties
 * inherit them when not overridden by their own sibling fields.
 */
export function convertRef(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, nullable, defaultValue } = ctx

  const [resolvedTitle, resolvedDescription] = resolveRefAnnotations({ deps, $ref: schema.$ref })

  return createSchema({
    type: 'ref',
    name: extractRefName(schema.$ref!),
    ref: schema.$ref,
    title: schema.title ?? resolvedTitle,
    nullable,
    description: schema.description ?? resolvedDescription,
    deprecated: schema.deprecated,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
    pattern: schema.type === 'string' ? schema.pattern : undefined,
    example: schema.example,
    default: defaultValue,
  })
}

function resolveRefAnnotations({ deps, $ref }: { deps: ConverterDeps; $ref: string | undefined }): [string | undefined, string | undefined] {
  if (!$ref) return [undefined, undefined]
  try {
    const resolved = deps.oas.get<SchemaObject>($ref)
    if (!resolved) return [undefined, undefined]
    return [(resolved as { title?: string }).title, (resolved as { description?: string }).description]
  } catch {
    return [undefined, undefined]
  }
}


/**
 * Converts an `allOf` schema into either a flattened member node (single-member `allOf`)
 * or an `IntersectionSchemaNode` (multi-member `allOf`).
 *
 * Single-member `allOf` without sibling structural keys is flattened to avoid
 * producing needless intersection wrappers. The flatten path is skipped when the
 * outer schema carries structural keys (`properties`, `required`, `additionalProperties`).
 */
export function convertAllOf(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue, options } = ctx

  if (isSingleMemberAllOf(schema)) {
    return flattenSingleAllOf(deps, ctx)
  }

  const allOfMembers = buildAllOfMembers({ deps, schema, name, options })

  appendMissingRequiredKeys({ deps, schema, allOfMembers, options })

  if (schema.properties) {
    const { allOf: _allOf, ...schemaWithoutAllOf } = schema
    allOfMembers.push(deps.convertSchema({ schema: schemaWithoutAllOf }, options))
  }

  return createSchema({
    type: 'intersection',
    members: mergeAdjacentAnonymousObjects(allOfMembers),
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}

function isSingleMemberAllOf(schema: SchemaObject): boolean {
  return (
    schema.allOf!.length === 1 &&
    !schema.properties &&
    !(Array.isArray(schema.required) && schema.required.length) &&
    schema.additionalProperties === undefined
  )
}

function flattenSingleAllOf(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, options } = ctx
  const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
  const memberNode = deps.convertSchema({ schema: memberSchema! as SchemaObject }, options)
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

function buildAllOfMembers({
  deps,
  schema,
  name,
  options,
}: {
  deps: ConverterDeps
  schema: SchemaObject
  name: string | undefined
  options: Partial<ParserOptions> | undefined
}): Array<SchemaNode> {
  return (schema.allOf as Array<SchemaObject | ReferenceObject>)
    .filter((item) => !isCircularDiscriminatorRef({ deps, item, name }))
    .map((item) => {
      const memberNode = deps.convertSchema({ schema: item as SchemaObject }, options)
      return maybeEmbedDiscriminant({ deps, item, name, memberNode }) ?? memberNode
    })
}

/**
 * Detects whether an allOf item is a circular reference back through a discriminator parent.
 */
function isCircularDiscriminatorRef({
  deps,
  item,
  name,
}: {
  deps: ConverterDeps
  item: SchemaObject | ReferenceObject
  name: string | undefined
}): boolean {
  if (!isReference(item) || !name) return false

  const deref = deps.oas.get<SchemaObject>(item.$ref)
  if (!deref || !isDiscriminator(deref)) return false

  const parentUnion = deref.oneOf ?? deref.anyOf
  if (!parentUnion) return false

  const childRef = `#/components/schemas/${name}`
  const inOneOf = parentUnion.some((oneOfItem) => isReference(oneOfItem) && oneOfItem.$ref === childRef)
  const inMapping = Object.values(deref.discriminator.mapping ?? {}).some((v) => v === childRef)

  return inOneOf || inMapping
}

/**
 * In legacy mode, embeds the discriminant value as an intersection when the allOf item
 * is a discriminator parent that lists the current schema in its mapping.
 */
function maybeEmbedDiscriminant({
  deps,
  item,
  name,
  memberNode,
}: {
  deps: ConverterDeps
  item: SchemaObject | ReferenceObject
  name: string | undefined
  memberNode: SchemaNode
}): SchemaNode | undefined {
  if (!deps.isLegacyNaming || !isReference(item) || !name) return undefined

  try {
    const deref = deps.oas.get<SchemaObject>(item.$ref)
    if (!deref || !isDiscriminator(deref) || !deref.discriminator.mapping) return undefined

    const childRef = `#/components/schemas/${name}`
    const discriminantEntry = Object.entries(deref.discriminator.mapping).find(([, v]) => v === childRef)
    if (!discriminantEntry) return undefined

    const [discriminantValue] = discriminantEntry
    return createSchema({
      type: 'intersection',
      members: [memberNode, createDiscriminantObject({ propertyName: deref.discriminator.propertyName, value: discriminantValue })],
    })
  } catch {
    return undefined
  }
}

function createDiscriminantObject({ propertyName, value }: { propertyName: string; value: string }): SchemaNode {
  return createSchema({
    type: 'object',
    properties: [
      createProperty({
        name: propertyName,
        schema: createSchema({ type: 'enum', primitive: 'string', enumValues: [value] }),
        required: true,
      }),
    ],
  })
}

/**
 * When `required` lists keys not present in the outer `properties`, resolve them from
 * the allOf member schemas and inject them as extra intersection members.
 */
function appendMissingRequiredKeys({
  deps,
  schema,
  allOfMembers,
  options,
}: {
  deps: ConverterDeps
  schema: SchemaObject
  allOfMembers: Array<SchemaNode>
  options: Partial<ParserOptions> | undefined
}): void {
  if (!Array.isArray(schema.required) || !schema.required.length) return

  const outerKeys = schema.properties ? new Set(Object.keys(schema.properties)) : new Set<string>()
  const missingRequired = schema.required.filter((key) => !outerKeys.has(key))
  if (!missingRequired.length) return

  const resolvedMembers = (schema.allOf as Array<SchemaObject | ReferenceObject>).flatMap((item) => {
    if (!isReference(item)) return [item as SchemaObject]
    const deref = deps.oas.get<SchemaObject>(item.$ref)
    return deref && !isReference(deref) ? [deref] : []
  })

  for (const key of missingRequired) {
    for (const resolved of resolvedMembers) {
      if (resolved.properties?.[key]) {
        allOfMembers.push(deps.convertSchema({ schema: { properties: { [key]: resolved.properties[key] }, required: [key] } as SchemaObject }, options))
        break
      }
    }
  }
}


/**
 * Converts a `oneOf` / `anyOf` schema into a `UnionSchemaNode`.
 *
 * Both keywords are treated identically — their members are concatenated into a single union.
 * When sibling `properties` are present, each union member is individually intersected
 * with the shared properties.
 */
export function convertUnion(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue, options } = ctx
  const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].filter(
    (s): s is SchemaObject | ReferenceObject => typeof s === 'object' && s !== null,
  )
  const unionBase = {
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
    discriminatorPropertyName: isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
  }

  if (schema.properties) {
    return convertUnionWithSharedProperties({ deps, schema, unionMembers, unionBase, name, options })
  }

  if (deps.isLegacyNaming && isDiscriminator(schema)) {
    return convertLegacyDiscriminatorUnion({ deps, discriminator: schema.discriminator, unionMembers, unionBase, options })
  }

  return createSchema({
    type: 'union',
    ...unionBase,
    members: simplifyUnionMembers(unionMembers.map((s) => deps.convertSchema({ schema: s as SchemaObject, name }, options))),
  })
}

function convertUnionWithSharedProperties({
  deps,
  schema,
  unionMembers,
  unionBase,
  name,
  options,
}: {
  deps: ConverterDeps
  schema: SchemaObject
  unionMembers: Array<SchemaObject | ReferenceObject>
  unionBase: object
  name: string | undefined
  options: Partial<ParserOptions> | undefined
}): SchemaNode {
  const { oneOf: _oneOf, anyOf: _anyOf, ...schemaWithoutUnion } = schema
  const discriminator = isDiscriminator(schema) ? schema.discriminator : undefined

  const memberBaseSchema: SchemaObject = discriminator
    ? (Object.fromEntries(Object.entries(schemaWithoutUnion).filter(([key]) => key !== 'discriminator')) as SchemaObject)
    : schemaWithoutUnion

  const sharedPropertiesNode = deps.convertSchema({ schema: memberBaseSchema, name: deps.isLegacyNaming ? undefined : name }, options)

  return createSchema({
    type: 'union',
    ...unionBase,
    members: unionMembers.map((s) => {
      const ref = isReference(s) ? s.$ref : undefined
      const discriminatorValue = discriminator?.mapping && ref ? Object.entries(discriminator.mapping).find(([, v]) => v === ref)?.[0] : undefined

      let propertiesNode = sharedPropertiesNode

      if (discriminatorValue && discriminator) {
        propertiesNode = applyDiscriminatorEnum({ node: propertiesNode, propertyName: discriminator.propertyName, values: [discriminatorValue] })
      }

      return createSchema({
        type: 'intersection',
        members: [deps.convertSchema({ schema: s as SchemaObject }, options), propertiesNode],
      })
    }),
  })
}

function convertLegacyDiscriminatorUnion({
  deps,
  discriminator,
  unionMembers,
  unionBase,
  options,
}: {
  deps: ConverterDeps
  discriminator: { propertyName: string; mapping?: Record<string, string> }
  unionMembers: Array<SchemaObject | ReferenceObject>
  unionBase: object
  options: Partial<ParserOptions> | undefined
}): SchemaNode {
  return createSchema({
    type: 'union',
    ...unionBase,
    members: unionMembers.map((s) => {
      const ref = isReference(s) ? s.$ref : undefined
      const refName = ref ? extractRefName(ref) : undefined
      const discriminatorValue = discriminator.mapping ? Object.entries(discriminator.mapping).find(([, v]) => v === ref)?.[0] : refName
      const memberNode = deps.convertSchema({ schema: s as SchemaObject }, options)

      if (!discriminatorValue) return memberNode

      return createSchema({
        type: 'intersection',
        members: [
          memberNode,
          createSchema({
            type: 'object',
            properties: [
              createProperty({
                name: discriminator.propertyName,
                schema: createSchema({ type: 'enum', primitive: 'string', enumValues: [discriminatorValue], fromConst: true }),
                required: true,
              }),
            ],
          }),
        ],
      })
    }),
  })
}


/**
 * Converts an OAS 3.1 `const` schema into either a null scalar or a single-value `EnumSchemaNode`.
 */
export function convertConst(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue } = ctx
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
    fromConst: true,
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}


/**
 * Handles `format`-based special types (date/time, uuid, email, blob, etc.).
 * Returns `undefined` when the format should fall through to string handling.
 */
export function convertFormat(deps: ConverterDeps, ctx: SchemaContext): SchemaNode | undefined {
  const { schema, name, nullable, defaultValue, mergedOptions } = ctx
  const base = deps.renderSchemaBase({ schema, name, nullable, defaultValue })

  if (schema.format === 'int64') {
    return createSchema({
      type: mergedOptions.integerType === 'bigint' ? 'bigint' : 'integer',
      primitive: 'integer',
      ...base,
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
    })
  }

  if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
    const dateType = deps.getDateType(mergedOptions, schema.format)
    if (!dateType) return undefined

    if (dateType.type === 'datetime') {
      return createSchema({ ...base, primitive: 'string' as const, type: 'datetime', offset: dateType.offset, local: dateType.local })
    }
    return createSchema({ ...base, primitive: 'string' as const, type: dateType.type, representation: dateType.representation })
  }

  return convertStaticFormat({ schema, base })
}

function convertStaticFormat({ schema, base }: { schema: SchemaObject; base: object }): SchemaNode | undefined {
  const specialType = formatToSchemaType(schema.format!, formatMap)
  if (!specialType) return undefined

  const specialPrimitive: PrimitiveSchemaType = specialType === 'number' || specialType === 'integer' || specialType === 'bigint' ? specialType : 'string'

  if (specialType === 'number' || specialType === 'integer' || specialType === 'bigint') {
    return createSchema({
      ...base,
      primitive: specialPrimitive,
      type: specialType,
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
    })
  }

  if (specialType === 'url') {
    return createSchema({ ...base, primitive: 'string' as const, type: 'url' })
  }

  return createSchema({ ...base, primitive: specialPrimitive, type: specialType as ScalarSchemaType })
}


/**
 * Converts an `enum` schema into an `EnumSchemaNode`.
 *
 * Handles `{ type: 'array', enum }` normalization, `null`-in-enum for nullable,
 * vendor extension labels (`x-enumNames`), and numeric/boolean const-map enums.
 */
export function convertEnum(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, type, options } = ctx

  // Malformed schema: `{ type: 'array', enum: [...] }` — normalize by moving the enum into items.
  if (type === 'array') {
    const isItemsObject = typeof schema.items === 'object' && !Array.isArray(schema.items)
    const normalizedItems: SchemaObject = { ...(isItemsObject ? (schema.items as SchemaObject) : {}), enum: schema.enum }
    const { enum: _enum, ...schemaWithoutEnum } = schema
    return deps.convertSchema({ schema: { ...schemaWithoutEnum, items: normalizedItems } as SchemaObject, name }, options)
  }

  const { filteredValues, enumNullable, enumDefault } = normalizeEnumValues({ schema, nullable })
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

  const extensionResult = tryExtensionEnum({ schema, type, filteredValues, enumBase })
  if (extensionResult) return extensionResult

  if (type === 'number' || type === 'integer') {
    return createSchema({
      ...enumBase,
      enumType: 'number' as const,
      namedEnumValues: [...new Set(filteredValues)].map((value) => ({
        name: String(value),
        value: value as number,
        format: 'number' as const,
      })),
    })
  }

  if (type === 'boolean') {
    return createSchema({
      ...enumBase,
      enumType: 'boolean' as const,
      namedEnumValues: [...new Set(filteredValues)].map((value) => ({
        name: String(value),
        value: value as boolean,
        format: 'boolean' as const,
      })),
    })
  }

  return createSchema({ ...enumBase, enumValues: [...new Set(filteredValues)] })
}

function normalizeEnumValues({
  schema,
  nullable,
}: {
  schema: SchemaObject
  nullable: true | undefined
}): { filteredValues: Array<string | number | boolean>; enumNullable: true | undefined; enumDefault: unknown } {
  const nullInEnum = schema.enum!.includes(null)
  const filteredValues = (nullInEnum ? schema.enum!.filter((v) => v !== null) : schema.enum!) as Array<string | number | boolean>
  const enumNullable = nullable || nullInEnum || undefined
  const enumDefault = schema.default === null && enumNullable ? undefined : schema.default
  return { filteredValues, enumNullable, enumDefault }
}

function tryExtensionEnum({
  schema,
  type,
  filteredValues,
  enumBase,
}: {
  schema: SchemaObject
  type: string | undefined
  filteredValues: Array<string | number | boolean>
  enumBase: { type: 'enum' } & Record<string, unknown>
}): SchemaNode | undefined {
  const extensionKey = enumExtensionKeys.find((key) => key in schema)
  if (!extensionKey) return undefined

  const rawNames = (schema as Record<string, unknown>)[extensionKey] as Array<string | number>
  const uniqueNames = [...new Set(rawNames)]
  const enumType =
    getPrimitiveType(type) === 'number' || getPrimitiveType(type) === 'integer'
      ? ('number' as const)
      : getPrimitiveType(type) === 'boolean'
        ? ('boolean' as const)
        : ('string' as const)

  return createSchema({
    ...enumBase,
    enumType,
    namedEnumValues: uniqueNames.map((label, index) => ({
      name: String(label),
      value: filteredValues[index] ?? label,
      format: enumType,
    })),
  })
}


/**
 * Converts an object-like schema (`type: 'object'`, `properties`, `additionalProperties`,
 * or `patternProperties`) into an `ObjectSchemaNode`.
 */
export function convertObject(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue, options, mergedOptions } = ctx

  const properties = buildProperties({ deps, schema, name, options, mergedOptions })
  const additionalPropertiesNode = buildAdditionalProperties({ deps, schema, options, mergedOptions })
  const patternProperties = buildPatternProperties({ deps, schema, options, mergedOptions })

  const objectNode: SchemaNode = createSchema({
    type: 'object',
    primitive: 'object',
    properties,
    additionalProperties: additionalPropertiesNode,
    patternProperties,
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })

  if (isDiscriminator(schema) && schema.discriminator.mapping) {
    const discPropName = schema.discriminator.propertyName
    const values = Object.keys(schema.discriminator.mapping)
    const enumName = name ? deps.resolveEnumPropName(name, discPropName, mergedOptions.enumSuffix) : undefined
    return applyDiscriminatorEnum({ node: objectNode, propertyName: discPropName, values, enumName })
  }

  return objectNode
}

function buildProperties({
  deps,
  schema,
  name,
  options,
  mergedOptions,
}: {
  deps: ConverterDeps
  schema: SchemaObject
  name: string | undefined
  options: Partial<ParserOptions> | undefined
  mergedOptions: ParserOptions
}): Array<PropertyNode> {
  if (!schema.properties) return []

  return Object.entries(schema.properties).map(([propName, propSchema]) => {
    const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
    const resolvedPropSchema = propSchema as SchemaObject
    const propNullable = isNullable(resolvedPropSchema)

    const childName = deps.resolveChildName(name, propName)
    const propNode = deps.convertSchema({ schema: resolvedPropSchema, name: childName }, options)
    const schemaNode = deps.applyEnumName(propNode, name, propName, mergedOptions.enumSuffix)

    return createProperty({
      name: propName,
      schema: {
        ...schemaNode,
        nullable: (propNullable && schemaNode.type !== 'null') || undefined,
        optional: !required && !propNullable ? true : undefined,
        nullish: !required && propNullable ? true : undefined,
      },
      required,
    })
  })
}

function buildAdditionalProperties({
  deps,
  schema,
  options,
  mergedOptions,
}: {
  deps: ConverterDeps
  schema: SchemaObject
  options: Partial<ParserOptions> | undefined
  mergedOptions: ParserOptions
}): SchemaNode | true | undefined {
  const ap = schema.additionalProperties

  if (ap === true) return true
  if (ap && Object.keys(ap).length > 0) return deps.convertSchema({ schema: ap as SchemaObject }, options)
  if (ap === false) return undefined
  if (ap) return createSchema({ type: deps.resolveTypeOption(mergedOptions.unknownType) })
  return undefined
}

function buildPatternProperties({
  deps,
  schema,
  options,
  mergedOptions,
}: {
  deps: ConverterDeps
  schema: SchemaObject
  options: Partial<ParserOptions> | undefined
  mergedOptions: ParserOptions
}): Record<string, SchemaNode> | undefined {
  const raw = 'patternProperties' in schema ? schema.patternProperties : undefined
  if (!raw) return undefined

  return Object.fromEntries(
    Object.entries(raw).map(([pattern, patternSchema]) => [
      pattern,
      patternSchema === true || (typeof patternSchema === 'object' && Object.keys(patternSchema).length === 0)
        ? createSchema({ type: deps.resolveTypeOption(mergedOptions.unknownType) })
        : deps.convertSchema({ schema: patternSchema as SchemaObject }, options),
    ]),
  )
}


/**
 * Converts an OAS 3.1 `prefixItems` tuple into a `TupleSchemaNode`.
 */
export function convertTuple(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue, options } = ctx
  const tupleItems = (schema.prefixItems ?? []).map((item) => deps.convertSchema({ schema: item as SchemaObject }, options))
  const rest = schema.items ? deps.convertSchema({ schema: schema.items as SchemaObject }, options) : undefined

  return createSchema({
    type: 'tuple',
    primitive: 'array',
    items: tupleItems,
    rest,
    min: schema.minItems,
    max: schema.maxItems,
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}


/**
 * Converts a `type: 'array'` schema into an `ArraySchemaNode`.
 */
export function convertArray(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue, options, mergedOptions } = ctx
  const rawItems = schema.items as SchemaObject | undefined
  const itemName = rawItems?.enum?.length && name ? deps.resolveEnumPropName(undefined, name, mergedOptions.enumSuffix) : undefined
  const items = rawItems ? [deps.convertSchema({ schema: rawItems, name: itemName }, options)] : []

  return createSchema({
    type: 'array',
    primitive: 'array',
    items,
    min: schema.minItems,
    max: schema.maxItems,
    unique: schema.uniqueItems ?? undefined,
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}


/**
 * Converts a `type: 'string'` schema into a `StringSchemaNode`.
 */
export function convertString(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue } = ctx
  return createSchema({
    type: 'string',
    primitive: 'string',
    min: schema.minLength,
    max: schema.maxLength,
    pattern: schema.pattern,
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}

/**
 * Converts a `type: 'number'` or `type: 'integer'` schema.
 */
export function convertNumeric(deps: ConverterDeps, ctx: SchemaContext, numericType: 'number' | 'integer'): SchemaNode {
  const { schema, name, nullable, defaultValue } = ctx
  return createSchema({
    type: numericType,
    primitive: numericType,
    min: schema.minimum,
    max: schema.maximum,
    exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
    exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}

/**
 * Converts a `type: 'boolean'` schema.
 */
export function convertBoolean(deps: ConverterDeps, ctx: SchemaContext): SchemaNode {
  const { schema, name, nullable, defaultValue } = ctx
  return createSchema({
    type: 'boolean',
    primitive: 'boolean',
    ...deps.renderSchemaBase({ schema, name, nullable, defaultValue }),
  })
}

/**
 * Converts a `type: 'null'` schema.
 */
export function convertNull(_deps: ConverterDeps, { schema, name, nullable }: SchemaContext): SchemaNode {
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
