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
  type InferSchemaNode,
  mediaTypes,
  mergeAdjacentObjects,
  narrowSchema,
  type ParserOptions,
  resolveNames,
  schemaTypes,
  setDiscriminatorEnum,
  setEnumName,
  simplifyUnion,
} from '@kubb/ast'
import type {
  DistributiveOmit,
  HttpMethod,
  MediaType,
  OperationNode,
  ParameterLocation,
  ParameterNode,
  PrimitiveSchemaType,
  PropertyNode,
  ResponseNode,
  RootNode,
  ScalarSchemaType,
  SchemaNode,
  SchemaType,
  StatusCode,
} from '@kubb/ast/types'
import { DEFAULT_PARSER_OPTIONS, enumExtensionKeys, formatMap } from './constants.ts'
import type { Oas } from './oas/Oas.ts'
import type { contentType, Operation, ReferenceObject, SchemaObject } from './oas/types.ts'
import { flattenSchema, isDiscriminator, isNullable, isReference } from './oas/utils.ts'

/**
 * Construction-time options passed to `createOasParser`.
 *
 * @example
 * ```ts
 * const parser = createOasParser(oas, { contentType: 'application/xml' })
 * ```
 */
export type OasParserOptions = {
  contentType?: contentType
}

/**
 * Returns the Kubb `SchemaType` for an OAS `format` string, or `undefined` for formats
 * handled separately because they depend on runtime options (`int64`, `date-time`, etc.).
 */
function formatToSchemaType(format: string): SchemaType | undefined {
  return formatMap[format as keyof typeof formatMap]
}

/**
 * Maps an OAS `type` string to its `PrimitiveSchemaType`.
 * Numeric types are returned unchanged; `boolean` maps to `'boolean'`; everything else defaults to `'string'`.
 */
function getPrimitiveType(type: string | undefined): PrimitiveSchemaType {
  if (type === 'number' || type === 'integer' || type === 'bigint') return type
  if (type === 'boolean') return 'boolean'
  return 'string'
}

/**
 * Narrows a raw content-type string to the `MediaType` union Kubb recognises.
 * Returns `undefined` for unknown content types.
 */
function toMediaType(contentType: string): MediaType | undefined {
  return Object.values(mediaTypes).includes(contentType as MediaType) ? (contentType as MediaType) : undefined
}

/**
 * Pre-computed per-schema context bag passed to every `convert*` branch handler.
 */
type SchemaContext = {
  schema: SchemaObject
  name: string | undefined
  nullable: true | undefined
  defaultValue: unknown
  /** Normalised type string — first element when OAS 3.1 uses a multi-type array. */
  type: string | undefined
  rawOptions: Partial<ParserOptions> | undefined
  options: ParserOptions
}

/**
 * Public interface returned by `createOasParser`.
 *
 * @example
 * ```ts
 * const parser = createOasParser(oas)
 * const root = parser.parse({ dateType: 'date' })
 * const schema = parser.convertSchema({ schema: petSchema, name: 'Pet' })
 * ```
 */
export type OasParser = {
  /**
   * Converts the full OpenAPI spec into a `RootNode` (the top-level `@kubb/ast` tree).
   */
  parse: <TOptions extends Partial<ParserOptions> = object>(options?: TOptions) => RootNode
  /**
   * Converts a single `SchemaObject` into a typed `SchemaNode`.
   *
   * @example
   * ```ts
   * parser.convertSchema({ schema: { type: 'string', format: 'uuid' } })
   * // UrlSchemaNode with type 'uuid'
   * ```
   */
  convertSchema: <TFormat extends string, TSchema extends SchemaObject & { format?: TFormat }, TOptions extends Partial<ParserOptions> = object>(
    params: { schema: TSchema; name?: string },
    options?: TOptions,
  ) => InferSchemaNode<TSchema, TOptions extends { dateType: ParserOptions['dateType'] } ? TOptions['dateType'] : 'string'>
  /**
   * Walks `node` and replaces each `ref` name with the value returned by `resolveName`.
   *
   * The callback receives the full `$ref` path when available, e.g. `'#/components/schemas/Order'`.
   * The optional `resolveEnumName` callback handles inline `enum` nodes separately.
   *
   * @example
   * ```ts
   * parser.resolveRefs(schemaNode, (ref) => transformer.default(ref))
   * ```
   */
  resolveRefs: (node: SchemaNode, resolveName: (ref: string) => string | undefined, resolveEnumName?: (name: string) => string | undefined) => SchemaNode
  /**
   * Map from original `$ref` paths to their collision-resolved schema names.
   *
   * Pass this to `collectImports()` to resolve imports without holding a reference to the parser.
   *
   * @example
   * ```ts
   * parser.nameMapping.get('#/components/schemas/Order') // 'Order'
   * ```
   */
  nameMapping: Map<string, string>
}

/**
 * Creates an OAS parser that converts an OpenAPI spec into the `@kubb/ast` tree.
 *
 * This is the **kubb-parser** compilation stage: `OpenAPI / Swagger → Kubb AST`.
 * No code is generated here — the resulting tree is spec-agnostic and consumed by
 * downstream plugins (`plugin-ts`, `plugin-zod`, …).
 * Options are forwarded per-call to `parse` or `convertSchema`, keeping the factory lightweight.
 *
 * @example
 * ```ts
 * const parser = createOasParser(oas)
 * const root = parser.parse({ dateType: 'date', emptySchemaType: 'unknown' })
 * ```
 *
 * @example
 * ```ts
 * const parser = createOasParser(oas, { contentType: 'application/xml' })
 * const schema = parser.convertSchema({ schema: petSchema, name: 'Pet' })
 * ```
 */
export function createOasParser(oas: Oas, { contentType }: OasParserOptions = {}): OasParser {
  // Map from original component paths to resolved schema names (after collision resolution)
  // e.g., { '#/components/schemas/Order': 'OrderSchema', '#/components/responses/Product': 'ProductResponse' }
  const { schemas: schemaObjects, nameMapping } = oas.getSchemas({ contentType })

  const TYPE_OPTION_MAP: Record<'any' | 'unknown' | 'void', ScalarSchemaType> = {
    any: schemaTypes.any,
    unknown: schemaTypes.unknown,
    void: schemaTypes.void,
  }

  /**
   * Maps an `'any' | 'unknown' | 'void'` option string to the corresponding `SchemaType` constant.
   * Used for both `unknownType` (unannotated schemas) and `emptySchemaType` (empty `{}` schemas).
   */
  function resolveTypeOption(value: 'any' | 'unknown' | 'void'): ScalarSchemaType {
    return TYPE_OPTION_MAP[value]
  }

  /**
   * Normalises a malformed `{ type: 'array', enum: [...] }` schema by moving the
   * enum values into the items subschema. This pattern is technically invalid OAS
   * but appears in the wild and must be handled gracefully.
   */
  function normalizeArrayEnum(schema: SchemaObject): SchemaObject {
    const isItemsObject = typeof schema.items === 'object' && !Array.isArray(schema.items)
    const normalizedItems: SchemaObject = { ...(isItemsObject ? (schema.items as SchemaObject) : {}), enum: schema.enum }
    const { enum: _enum, ...schemaWithoutEnum } = schema
    return { ...schemaWithoutEnum, items: normalizedItems } as SchemaObject
  }

  /**
   * Resolves the AST type descriptor for a date/time format, honoring the `dateType` option.
   * Returns `undefined` when `dateType: false`, signalling the format should fall through to `string`.
   */
  function getDateType(
    options: ParserOptions,
    format: 'date-time' | 'date' | 'time',
  ): { type: 'datetime'; offset?: boolean; local?: boolean } | { type: 'date' | 'time'; representation: 'date' | 'string' } | undefined {
    if (!options.dateType) {
      return undefined
    }

    if (format === 'date-time') {
      if (options.dateType === 'date') {
        return { type: 'date', representation: 'date' }
      }
      if (options.dateType === 'stringOffset') {
        return { type: 'datetime', offset: true }
      }
      if (options.dateType === 'stringLocal') {
        return { type: 'datetime', local: true }
      }
      return { type: 'datetime', offset: false }
    }

    if (format === 'date') {
      return { type: 'date', representation: options.dateType === 'date' ? 'date' : 'string' }
    }

    // time
    return { type: 'time', representation: options.dateType === 'date' ? 'date' : 'string' }
  }

  /**
   * Collects the shared metadata fields passed to every `createSchema` call.
   */
  function renderSchemaBase(schema: SchemaObject, name: string | undefined, nullable: true | undefined, defaultValue: unknown) {
    return {
      name,
      nullable,
      title: schema.title,
      description: schema.description,
      deprecated: schema.deprecated,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      default: defaultValue,
      example: schema.example,
    } as const
  }

  // Branch handlers — each converts one OAS schema pattern to a SchemaNode.
  // They are defined as function declarations so they can reference each other
  // and `convertSchema` freely (JS hoisting).

  /**
   * Converts a `$ref` schema into a `RefSchemaNode`.
   *
   * OAS 3.0 technically ignores `$ref` siblings, but Kubb preserves annotations like
   * `pattern`, `description`, and `nullable` so they appear in generated JSDoc and type modifiers.
   */
  function convertRef({ schema, nullable, defaultValue }: SchemaContext): SchemaNode {
    return createSchema({
      type: 'ref',
      name: extractRefName(schema.$ref!),
      ref: schema.$ref,
      nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      pattern: schema.type === 'string' ? schema.pattern : undefined,
      example: schema.example,
      default: defaultValue,
    })
  }

  /**
   * Converts an `allOf` schema into a flattened node or an `IntersectionSchemaNode`.
   *
   * A single-member `allOf` with no sibling structural keys is flattened to avoid a needless
   * intersection wrapper — this is the common OAS 3.0 pattern for annotating a `$ref`.
   * Flattening is skipped when the outer schema has `properties`, `required`, or
   * `additionalProperties`. Discriminator parent back-references are detected and skipped to
   * prevent circular type references during code generation.
   */
  function convertAllOf({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    if (
      schema.allOf!.length === 1 &&
      !schema.properties &&
      !(Array.isArray(schema.required) && schema.required.length) &&
      schema.additionalProperties === undefined
    ) {
      const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
      const memberNode = convertSchema({ schema: memberSchema! as SchemaObject }, rawOptions)
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

    // When a child schema extends a discriminator parent via allOf and the parent's oneOf/anyOf
    // references that child back, skip that allOf item to prevent a circular type reference.
    // When an item is skipped, collect its discriminant value so it can be injected below.
    const filteredDiscriminantValues: Array<{ propertyName: string; value: string }> = []
    const allOfMembers: Array<SchemaNode> = (schema.allOf as Array<SchemaObject | ReferenceObject>)
      .filter((item) => {
        if (!isReference(item) || !name) return true
        const deref = oas.get<SchemaObject>(item.$ref)
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
      .map((s) => convertSchema({ schema: s as SchemaObject }, rawOptions))

    // Track where allOf-derived members end so each portion can be merged independently.
    const syntheticStart = allOfMembers.length

    // When `required` lists keys not present in the outer `properties`, resolve them from
    // the allOf member schemas and inject them as extra intersection members.
    if (Array.isArray(schema.required) && schema.required.length) {
      const outerKeys = schema.properties ? new Set(Object.keys(schema.properties)) : new Set<string>()
      const missingRequired = schema.required.filter((key) => !outerKeys.has(key))

      if (missingRequired.length) {
        const resolvedMembers = (schema.allOf as Array<SchemaObject | ReferenceObject>).flatMap((item) => {
          if (!isReference(item)) return [item as SchemaObject]
          const deref = oas.get<SchemaObject>(item.$ref)
          return deref && !isReference(deref) ? [deref] : []
        })

        for (const key of missingRequired) {
          for (const resolved of resolvedMembers) {
            if (resolved.properties?.[key]) {
              allOfMembers.push(convertSchema({ schema: { properties: { [key]: resolved.properties[key] }, required: [key] } as SchemaObject }, rawOptions))
              break
            }
          }
        }
      }
    }

    if (schema.properties) {
      const { allOf: _allOf, ...schemaWithoutAllOf } = schema
      allOfMembers.push(convertSchema({ schema: schemaWithoutAllOf }, rawOptions))
    }

    // Inject a synthetic single-property object for each discriminant value collected from
    // filtered discriminator parents so that child schemas carry the narrowed literal type.
    for (const { propertyName, value } of filteredDiscriminantValues) {
      allOfMembers.push(createDiscriminantNode({ propertyName, value }))
    }

    // Merge consecutive anonymous object members within the synthetic portion — see `mergeAdjacentObjects`.
    return createSchema({
      type: 'intersection',
      members: [...mergeAdjacentObjects(allOfMembers.slice(0, syntheticStart)), ...mergeAdjacentObjects(allOfMembers.slice(syntheticStart))],
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `oneOf` / `anyOf` schema into a `UnionSchemaNode`.
   *
   * Both keywords are treated identically and their members are concatenated.
   * When sibling `properties` are present, each union member is individually
   * intersected with the shared properties node — the common OAS pattern for
   * adding required fields next to a discriminated union.
   */
  function convertUnion({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    function pickDiscriminatorPropertyNode(node: SchemaNode, propertyName: string): SchemaNode | undefined {
      const objectNode = narrowSchema(node, 'object')
      const discriminatorProperty = objectNode?.properties?.find((property) => property.name === propertyName)

      if (!discriminatorProperty) {
        return undefined
      }

      return createSchema({
        type: 'object',
        primitive: 'object',
        properties: [discriminatorProperty],
      })
    }

    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    const unionBase = {
      ...renderSchemaBase(schema, name, nullable, defaultValue),
      discriminatorPropertyName: isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
    }
    const discriminator = isDiscriminator(schema) ? schema.discriminator : undefined
    const sharedPropertiesNode = schema.properties
      ? (() => {
          const { oneOf: _oneOf, anyOf: _anyOf, ...schemaWithoutUnion } = schema
          // Strip discriminator so convertObject won't re-apply the full mapping enum.
          const memberBaseSchema: SchemaObject = discriminator
            ? (Object.fromEntries(Object.entries(schemaWithoutUnion).filter(([key]) => key !== 'discriminator')) as SchemaObject)
            : schemaWithoutUnion
          // Convert shared properties once to avoid duplicate enum naming
          // (e.g. StatusEnum appearing twice and getting a numeric suffix).
          return convertSchema({ schema: memberBaseSchema, name }, rawOptions)
        })()
      : undefined

    if (sharedPropertiesNode || discriminator?.mapping) {
      const members = unionMembers.map((s) => {
        const ref = isReference(s) ? s.$ref : undefined
        const discriminatorValue = findDiscriminator(discriminator?.mapping, ref)
        const memberNode = convertSchema({ schema: s as SchemaObject }, rawOptions)

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
        ...renderSchemaBase(schema, name, nullable, defaultValue),
        members: [unionNode, sharedPropertiesNode],
      })
    }

    return createSchema({
      type: 'union',
      ...unionBase,
      members: simplifyUnion(unionMembers.map((s) => convertSchema({ schema: s as SchemaObject }, rawOptions))),
    })
  }

  /**
   * Converts an OAS 3.1 `const` schema into a null scalar or a single-value `EnumSchemaNode`.
   * `const: null` maps to a null scalar; any other value becomes a one-item enum for a precise literal type.
   */
  function convertConst({ schema, name, nullable, defaultValue }: SchemaContext): SchemaNode {
    const constValue = schema.const

    if (constValue === null) {
      // Do not propagate `nullable` here: the type is already `null`, so marking it
      // nullable too would cause the printer to emit `null | null`.
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
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a format-annotated schema into a special-type `SchemaNode` (date/time, uuid, email, blob, etc.).
   * Returns `undefined` when the format should fall through to string handling (`dateType: false`).
   */
  function convertFormat({ schema, name, nullable, defaultValue, options }: SchemaContext): SchemaNode | undefined {
    const base = renderSchemaBase(schema, name, nullable, defaultValue)

    // int64 is option-dependent so it can't live in the static formatMap.
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

    // date-time / date / time are option-dependent and can't live in the static formatMap.
    if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
      const dateType = getDateType(options, schema.format)
      if (!dateType) return undefined // dateType: false → fall through to string

      if (dateType.type === 'datetime') {
        return createSchema({ ...base, primitive: 'string' as const, type: 'datetime', offset: dateType.offset, local: dateType.local })
      }
      return createSchema({ ...base, primitive: 'string' as const, type: dateType.type, representation: dateType.representation })
    }

    const specialType = formatToSchemaType(schema.format!)
    if (!specialType) return undefined

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
   *
   * Handles `{ type: 'array', enum }` by normalising the enum into `items`, strips `null` from
   * enum values (OAS 3.0 nullable convention), and uses `x-enumNames` / `x-enum-varnames` extensions
   * to produce named enum variants. Numeric and boolean enums always use the const-map form.
   */
  function convertEnum({ schema, name, nullable, type, rawOptions }: SchemaContext): SchemaNode {
    // Malformed schema: `{ type: 'array', enum: [...] }` — normalize by moving the enum into items.
    if (type === 'array') {
      return convertSchema({ schema: normalizeArrayEnum(schema), name }, rawOptions)
    }

    // `null` in enum values is the OAS 3.0 convention for a nullable enum.
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

    // x-enumNames / x-enum-varnames: named variants with explicit labels take priority.
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

    // Plain string enum (default path).
    return createSchema({
      ...enumBase,
      enumValues: [...new Set(filteredValues)],
    })
  }

  /**
   * Converts an object-like schema into an `ObjectSchemaNode`.
   *
   * When a `discriminator` is present, the discriminator property is replaced with an enum of the
   * mapping keys for a precise literal-union type. Property optionality follows OAS semantics:
   * required → `required: true`; optional nullable → `nullish: true`; optional non-nullable → `optional: true`.
   */
  function convertObject({ schema, name, nullable, defaultValue, rawOptions, options }: SchemaContext): SchemaNode {
    const properties: Array<PropertyNode> = schema.properties
      ? Object.entries(schema.properties).map(([propName, propSchema]) => {
          const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
          const resolvedPropSchema = propSchema as SchemaObject
          const propNullable = isNullable(resolvedPropSchema)

          const resolvedChildName = childName(name, propName)
          const propNode = convertSchema({ schema: resolvedPropSchema, name: resolvedChildName }, rawOptions)
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
      additionalPropertiesNode = convertSchema({ schema: additionalProperties as SchemaObject }, rawOptions)
    } else if (additionalProperties === false) {
      additionalPropertiesNode = undefined
    } else if (additionalProperties) {
      additionalPropertiesNode = createSchema({ type: resolveTypeOption(options.unknownType) })
    }

    const rawPatternProperties = 'patternProperties' in schema ? schema.patternProperties : undefined

    const patternProperties = rawPatternProperties
      ? Object.fromEntries(
          Object.entries(rawPatternProperties).map(([pattern, patternSchema]) => [
            pattern,
            patternSchema === true || (typeof patternSchema === 'object' && Object.keys(patternSchema).length === 0)
              ? createSchema({ type: resolveTypeOption(options.unknownType) })
              : convertSchema({ schema: patternSchema as SchemaObject }, rawOptions),
          ]),
        )
      : undefined

    const objectNode: SchemaNode = createSchema({
      type: 'object',
      primitive: 'object',
      properties,
      additionalProperties: additionalPropertiesNode,
      patternProperties,
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })

    // When a discriminator is present, replace the discriminator property's schema
    // with an enum of the mapping keys for a precise literal-union type.
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
   *
   * Each `prefixItems` element becomes a positional slot. A sibling `items` schema becomes the
   * rest element; when absent, a rest `any` is emitted (JSON Schema: additional items are allowed).
   */
  function convertTuple({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext): SchemaNode {
    const tupleItems = (schema.prefixItems ?? []).map((item) => convertSchema({ schema: item as SchemaObject }, rawOptions))
    const rest = schema.items ? convertSchema({ schema: schema.items as SchemaObject }, rawOptions) : createSchema({ type: 'any' })

    return createSchema({
      type: 'tuple',
      primitive: 'array',
      items: tupleItems,
      rest,
      min: schema.minItems,
      max: schema.maxItems,
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'array'` schema into an `ArraySchemaNode`.
   *
   * When the items schema is an inline enum, a name is derived from the parent array name +
   * `enumSuffix` so generators can emit a standalone enum declaration.
   */
  function convertArray({ schema, name, nullable, defaultValue, rawOptions, options }: SchemaContext): SchemaNode {
    const rawItems = schema.items as SchemaObject | undefined
    // When the items schema contains an inline enum, derive a named identifier
    // so generators can emit a standalone enum declaration.
    const itemName = rawItems?.enum?.length && name ? enumPropName(undefined, name, options.enumSuffix) : undefined
    const items = rawItems ? [convertSchema({ schema: rawItems, name: itemName }, rawOptions)] : []

    return createSchema({
      type: 'array',
      primitive: 'array',
      items,
      min: schema.minItems,
      max: schema.maxItems,
      unique: schema.uniqueItems ?? undefined,
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'string'` schema (without a special format) into a `StringSchemaNode`.
   */
  function convertString({ schema, name, nullable, defaultValue }: SchemaContext): SchemaNode {
    return createSchema({
      type: 'string',
      primitive: 'string',
      min: schema.minLength,
      max: schema.maxLength,
      pattern: schema.pattern,
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'number'` or `type: 'integer'` schema into the corresponding `SchemaNode`.
   */
  function convertNumeric({ schema, name, nullable, defaultValue }: SchemaContext, type: 'number' | 'integer'): SchemaNode {
    return createSchema({
      type,
      primitive: type,
      min: schema.minimum,
      max: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `type: 'boolean'` schema into a `BooleanSchemaNode`.
   */
  function convertBoolean({ schema, name, nullable, defaultValue }: SchemaContext): SchemaNode {
    return createSchema({
      type: 'boolean',
      primitive: 'boolean',
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts an explicit `type: 'null'` or `const: null` schema into a `NullSchemaNode`.
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
  function convertSchema({ schema, name }: { schema: SchemaObject; name?: string }, rawOptions?: Partial<ParserOptions>): SchemaNode {
    const options: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...rawOptions }
    // Flatten keyword-only allOf fragments (no $ref, no structural keys) into the parent
    // schema before parsing, so simple annotation patterns don't produce needless intersections.
    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema && flattenedSchema !== schema) {
      return convertSchema({ schema: flattenedSchema, name }, rawOptions)
    }

    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    // Normalize OAS 3.1 multi-type array to a single type string for the dispatch below.
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    const ctx: SchemaContext = { schema, name, nullable, defaultValue, type, rawOptions, options }

    // $ref — pointer to another definition.
    // In OAS 3.0 siblings of $ref are technically ignored, but Kubb intentionally preserves them
    // so that annotations like `pattern`, `description`, and `nullable` are reflected in generated code.
    if (isReference(schema)) return convertRef(ctx)

    // Composition keywords
    if (schema.allOf?.length) return convertAllOf(ctx)
    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    if (unionMembers.length) return convertUnion(ctx)

    // OAS 3.1 const — a single fixed value, semantically equivalent to a one-item enum.
    // `const: undefined` falls through to the empty-type fallback.
    if ('const' in schema && schema.const !== undefined) return convertConst(ctx)

    // Format-based special types take precedence over `type`.
    // `convertFormat` returns undefined when format should fall through to string (dateType: false).
    // see https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
    if (schema.format) {
      const formatResult = convertFormat(ctx)
      if (formatResult) return formatResult
    }

    // OAS 3.1: `contentMediaType: 'application/octet-stream'` on a string schema signals binary data.
    if (schema.type === 'string' && schema.contentMediaType === 'application/octet-stream') {
      return createSchema({ type: 'blob', primitive: 'string', ...renderSchemaBase(schema, name, nullable, defaultValue) })
    }

    // OAS 3.1: `type` may be an array — e.g. `["string", "integer", "null"]`.
    // `null` in the array is the 3.1 equivalent of `nullable: true`; strip it and set the flag.
    // When 2+ non-null types remain, produce a union; when exactly 1 non-null type remains, fall through.
    if (Array.isArray(schema.type) && schema.type.length > 1) {
      const nonNullTypes = schema.type.filter((t) => t !== 'null') as string[]
      const arrayNullable = schema.type.includes('null') || nullable || undefined

      if (nonNullTypes.length > 1) {
        return createSchema({
          type: 'union',
          members: nonNullTypes.map((t) => convertSchema({ schema: { ...schema, type: t } as SchemaObject, name }, rawOptions)),
          ...renderSchemaBase(schema, name, arrayNullable, defaultValue),
        })
      }
    }

    // Infer type from constraints when no explicit type is provided.
    // minLength / maxLength / pattern → string; minimum / maximum → number.
    // Note: minItems/maxItems do NOT infer array — arrays require an `items` key.
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

    const emptyType = resolveTypeOption(options.emptySchemaType)
    return createSchema({ type: emptyType as ScalarSchemaType, name, title: schema.title, description: schema.description })
  }

  /**
   * Converts a dereferenced OAS parameter object into a `ParameterNode`.
   * Falls back to `unknownType` when the parameter has no `schema`.
   */
  function parseParameter(options: ParserOptions, param: Record<string, unknown>): ParameterNode {
    const required = (param['required'] as boolean | undefined) ?? false

    const schema: SchemaNode = param['schema']
      ? convertSchema({ schema: param['schema'] as SchemaObject }, options)
      : createSchema({ type: resolveTypeOption(options.unknownType) })

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
   * Converts an OAS `Operation` into an `OperationNode`, resolving parameters,
   * request body, and all response codes.
   */
  function parseOperation(options: ParserOptions, oas: Oas, operation: Operation): OperationNode {
    const parameters: Array<ParameterNode> = oas.getParameters(operation).map((param) => parseParameter(options, param as unknown as Record<string, unknown>))

    const requestBodySchema = oas.getRequestSchema(operation)
    const requestBodySchemaNode = requestBodySchema ? convertSchema({ schema: requestBodySchema }, options) : undefined

    const requestBodyDescription =
      operation.schema.requestBody && !isReference(operation.schema.requestBody)
        ? (operation.schema.requestBody as { description?: string }).description
        : undefined

    const requestBodyKeysToOmit = requestBodySchema?.properties
      ? Object.entries(requestBodySchema.properties)
          .filter(([, prop]) => !isReference(prop) && (prop as { readOnly?: boolean }).readOnly)
          .map(([key]) => key)
      : undefined

    const requestBody = requestBodySchemaNode
      ? {
          description: requestBodyDescription,
          schema: requestBodySchemaNode,
          keysToOmit: requestBodyKeysToOmit?.length ? requestBodyKeysToOmit : undefined,
        }
      : undefined

    const responses: Array<ResponseNode> = operation.getResponseStatusCodes().map((statusCode) => {
      const responseObj = operation.getResponseByStatusCode(statusCode)
      const responseSchema = oas.getResponseSchema(operation, statusCode)

      const schema =
        responseSchema && Object.keys(responseSchema).length > 0
          ? convertSchema({ schema: responseSchema }, options)
          : createSchema({ type: resolveTypeOption(options.emptySchemaType) })

      const description = typeof responseObj === 'object' && responseObj !== null && !Array.isArray(responseObj) ? responseObj.description : undefined

      const rawContent =
        typeof responseObj === 'object' && responseObj !== null && !Array.isArray(responseObj)
          ? (responseObj as { content?: Record<string, unknown> }).content
          : undefined

      const mediaType = rawContent ? toMediaType(Object.keys(rawContent)[0] ?? '') : toMediaType(operation.contentType ?? '')

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

    return createOperation({
      operationId: operation.getOperationId(),
      method: operation.method.toUpperCase() as HttpMethod,
      path: new URLPath(operation.path).URL,
      tags: operation.getTags().map((tag) => tag.name),
      summary: operation.getSummary() || undefined,
      description: operation.getDescription() || undefined,
      deprecated: operation.isDeprecated() || undefined,
      parameters,
      requestBody,
      responses,
    })
  }

  /**
   * Converts the entire spec (wrapped in a `Oas` instance) into a `RootNode`.
   */
  function parse<TOptions extends Partial<ParserOptions> = object>(options?: TOptions): RootNode {
    const mergedOptions: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...options }

    const schemas: Array<SchemaNode> = Object.entries(schemaObjects).map(([name, schemaObject]) =>
      convertSchema({ schema: schemaObject as SchemaObject, name }, mergedOptions),
    )

    const paths = oas.getPaths()

    const operations: Array<OperationNode> = Object.entries(paths).flatMap(([_path, methods]) =>
      Object.entries(methods)
        .map(([, operation]) => (operation ? parseOperation(mergedOptions, oas, operation) : null))
        .filter((op): op is OperationNode => op !== null),
    )

    return createRoot({ schemas, operations })
  }

  const resolveRefs = (
    node: SchemaNode,
    resolveName: (ref: string) => string | undefined,
    resolveEnumName?: (name: string) => string | undefined,
  ): SchemaNode => resolveNames({ node, nameMapping, resolveName, resolveEnumName })

  return {
    parse,
    convertSchema,
    resolveRefs,
    nameMapping,
  } as OasParser
}
