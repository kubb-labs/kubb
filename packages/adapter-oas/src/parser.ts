import { getUniqueName, pascalCase, URLPath } from '@internals/utils'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type {
  ArraySchemaNode,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
  HttpMethod,
  IntersectionSchemaNode,
  MediaType,
  NumberSchemaNode,
  ObjectSchemaNode,
  OperationNode,
  ParameterLocation,
  ParameterNode,
  PrimitiveSchemaType,
  PropertyNode,
  RefSchemaNode,
  ResponseNode,
  RootNode,
  ScalarSchemaNode,
  ScalarSchemaType,
  SchemaNode,
  SchemaType,
  StatusCode,
  StringSchemaNode,
  TimeSchemaNode,
  UnionSchemaNode,
} from '@kubb/ast/types'
import { DEFAULT_PARSER_OPTIONS, enumExtensionKeys, formatMap, knownMediaTypes } from './constants.ts'
import type { Oas } from './oas/Oas.ts'
import type { contentType, Operation, ReferenceObject, SchemaObject } from './oas/types.ts'
import { flattenSchema, isDiscriminator, isNullable, isReference } from './oas/utils.ts'
import type { ParserOptions } from './types.ts'
import { applyDiscriminatorEnum, extractRefName, mergeAdjacentAnonymousObjects, simplifyUnionMembers } from './utils.ts'

/**
 * Distributive `Omit` — correctly distributes over union types so that
 * `Omit<A | B, 'kind'>` produces `Omit<A, 'kind'> | Omit<B, 'kind'>`
 * rather than `Omit<A | B, 'kind'>`.
 */
type DistributiveOmit<TValue, TKey extends PropertyKey> = TValue extends unknown ? Omit<TValue, TKey> : never

/**
 * Maps each `dateType` option value to the AST node produced by `format: 'date-time'`.
 */
type DateTimeNodeByDateType = {
  date: DateSchemaNode
  string: DatetimeSchemaNode
  stringOffset: DatetimeSchemaNode
  stringLocal: DatetimeSchemaNode
  false: StringSchemaNode
}

/**
 * Resolves the AST node produced by `format: 'date-time'` based on the `dateType` option.
 */
type ResolveDateTimeNode<TDateType extends ParserOptions['dateType']> = DateTimeNodeByDateType[TDateType extends keyof DateTimeNodeByDateType
  ? TDateType
  : 'string']

/**
 * Single source of truth: ordered list of `[shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the node type of the first matching entry.
 * Parameterized over `TDateType` so `format: 'date-time'` resolves to the correct node based on the option.
 */
type SchemaNodeMap<TDateType extends ParserOptions['dateType'] = 'string'> = [
  [{ $ref: string }, RefSchemaNode],
  // allOf with sibling `properties` always produces an intersection (shared props are appended as a member).
  [{ allOf: ReadonlyArray<unknown>; properties: object }, IntersectionSchemaNode],
  // allOf with 2+ members always produces an intersection.
  [{ allOf: readonly [unknown, unknown, ...unknown[]] }, IntersectionSchemaNode],
  // Single-member allOf without sibling `properties` flattens to the member type.
  [{ allOf: ReadonlyArray<unknown> }, SchemaNode],
  [{ oneOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ anyOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ const: null }, ScalarSchemaNode],
  [{ const: string | number | boolean }, EnumSchemaNode],
  // OAS 3.1 multi-type array: `{ type: ['string', 'integer'] }` → union node.
  [{ type: ReadonlyArray<string> }, UnionSchemaNode],
  // `{ type: 'array', enum }` is normalized at runtime: enum moves into items → array node.
  [{ type: 'array'; enum: ReadonlyArray<unknown> }, ArraySchemaNode],
  [{ enum: ReadonlyArray<unknown> }, EnumSchemaNode],
  [{ type: 'object' }, ObjectSchemaNode],
  [{ additionalProperties: boolean | {} }, ObjectSchemaNode],
  [{ type: 'array' }, ArraySchemaNode],
  [{ items: object }, ArraySchemaNode],
  [{ prefixItems: ReadonlyArray<unknown> }, ArraySchemaNode],
  // Format entries with explicit type — placed before generic type entries so format wins.
  [{ type: string; format: 'date-time' }, ResolveDateTimeNode<TDateType>],
  [{ type: string; format: 'date' }, DateSchemaNode],
  [{ type: string; format: 'time' }, TimeSchemaNode],
  [{ format: 'date-time' }, ResolveDateTimeNode<TDateType>],
  [{ format: 'date' }, DateSchemaNode],
  [{ format: 'time' }, TimeSchemaNode],
  [{ type: 'string' }, StringSchemaNode],
  [{ type: 'number' }, NumberSchemaNode],
  [{ type: 'integer' }, NumberSchemaNode],
  [{ type: 'bigint' }, NumberSchemaNode],
  [{ type: string }, ScalarSchemaNode],
  // Inferred scalar types from constraints when no explicit type is present.
  [{ minLength: number }, StringSchemaNode],
  [{ maxLength: number }, StringSchemaNode],
  [{ pattern: string }, StringSchemaNode],
  [{ minimum: number }, NumberSchemaNode],
  [{ maximum: number }, NumberSchemaNode],
]

export type InferSchemaNode<
  TSchema extends SchemaObject,
  TDateType extends ParserOptions['dateType'] = 'string',
  TEntries extends ReadonlyArray<[object, SchemaNode]> = SchemaNodeMap<TDateType>,
> = TEntries extends [infer TEntry extends [object, SchemaNode], ...infer TRest extends ReadonlyArray<[object, SchemaNode]>]
  ? TSchema extends TEntry[0]
    ? TEntry[1]
    : InferSchemaNode<TSchema, TDateType, TRest>
  : SchemaNode

/**
 * Construction-time options for `createOasParser`.
 */
export type OasParserOptions = {
  contentType?: contentType
  collisionDetection?: boolean
}

/**
 * Looks up the Kubb `SchemaType` for a given OAS `format` string.
 * Returns `undefined` for formats not in `formatMap` (e.g. `int64`, `date-time`),
 * which are handled separately because their output depends on parser options.
 */
function formatToSchemaType(format: string): SchemaType | undefined {
  return formatMap[format as keyof typeof formatMap]
}

/**
 * Maps an OAS primitive type string to its `PrimitiveSchemaType` equivalent.
 * Numeric types (`number`, `integer`, `bigint`) are returned unchanged;
 * `boolean` maps to `'boolean'`; everything else defaults to `'string'`.
 */
function getPrimitiveType(type: string | undefined): PrimitiveSchemaType {
  if (type === 'number' || type === 'integer' || type === 'bigint') return type
  if (type === 'boolean') return 'boolean'
  return 'string'
}

/**
 * Narrows a raw content-type string to the `MediaType` union recognized by Kubb.
 * Returns `undefined` for content types not present in `KNOWN_MEDIA_TYPES`.
 */
function toMediaType(contentType: string): MediaType | undefined {
  return knownMediaTypes.has(contentType as MediaType) ? (contentType as MediaType) : undefined
}

/**
 * Pre-computed per-schema context passed to every `convert*` branch handler.
 * Grouping these values avoids repeating the same derivations across all branches.
 */
type SchemaContext = {
  schema: SchemaObject
  name: string | undefined
  nullable: true | undefined
  defaultValue: unknown
  /**
   * Normalized single type string (first element when OAS 3.1 multi-type array).
   */
  type: string | undefined
  options: Partial<ParserOptions> | undefined
  mergedOptions: ParserOptions
}

/**
 * The public interface returned by `createOasParser`.
 */
export type OasParser = {
  /**
   * Converts an OpenAPI/Swagger spec (wrapped in a Kubb `Oas` instance) into
   * a `RootNode` — the top-level node of the `@kubb/ast` tree.
   */
  parse: <TOptions extends Partial<ParserOptions> = object>(options?: TOptions) => RootNode
  convertSchema: <TFormat extends string, TSchema extends SchemaObject & { format?: TFormat }, TOptions extends Partial<ParserOptions> = object>(
    params: { schema: TSchema; name?: string },
    options?: TOptions,
  ) => InferSchemaNode<TSchema, TOptions extends { dateType: ParserOptions['dateType'] } ? TOptions['dateType'] : 'string'>
  /**
   * Walks `node` and replaces each `ref` value with the name returned by
   * `resolveName`. The callback receives the full `$ref` path (e.g. `#/components/schemas/Order`)
   * when available, falling back to the short name. Pass a no-op (`(n) => n`) to skip resolution.
   *
   * The optional `resolveEnumName` callback is called for inline `enum` nodes and should return
   * the transformed name to use (e.g. with a plugin `transformers.name` applied).
   */
  resolveRefs: (node: SchemaNode, resolveName: (ref: string) => string | undefined, resolveEnumName?: (name: string) => string | undefined) => SchemaNode

  /**
   * Map from original `$ref` paths to their collision-resolved schema names.
   * e.g. `'#/components/schemas/Order'` → `'OrderSchema'`
   *
   * Pass this to the standalone `getImports()` to resolve imports without holding
   * a reference to the full parser or OAS instance.
   */
  nameMapping: Map<string, string>
}

/**
 * Creates an OAS parser that converts an OpenAPI/Swagger spec into
 * the `@kubb/ast` tree.
 *
 * Options are passed per-call to `parse` or `convertSchema` rather than
 * at construction time, keeping the factory lightweight.
 *
 * This is the **kubb-parser** stage of the compilation lifecycle:
 *   OpenAPI / Swagger  →  Kubb AST
 *
 * No code is generated here; the resulting tree is spec-agnostic and can
 * be consumed by any downstream plugin (plugin-ts, plugin-zod, …).
 *
 * @example
 * ```ts
 * const parser = createOasParser(oas)
 * const root = parser.parse({ emptySchemaType: 'unknown' })
 * ```
 */
export function createOasParser(oas: Oas, { contentType, collisionDetection }: OasParserOptions = {}): OasParser {
  // Map from original component paths to resolved schema names (after collision resolution)
  // e.g., { '#/components/schemas/Order': 'OrderSchema', '#/components/responses/Product': 'ProductResponse' }
  const { schemas: schemaObjects, nameMapping } = oas.getSchemas({ contentType, collisionDetection })

  // Legacy enum name deduplication: tracks used enum names and appends numeric suffixes
  // (e.g. ParamsStatusEnum, ParamsStatusEnum2) when collisionDetection is disabled.
  const usedEnumNames: Record<string, number> = {}

  // Only apply legacy naming when collisionDetection is explicitly false.
  // When undefined (e.g. direct parser usage without adapter), use the default (new) behavior.
  const isLegacyNaming = collisionDetection === false

  /**
   * Maps an `'any' | 'unknown' | 'void'` option string to the corresponding `SchemaType` constant.
   * Used for both `unknownType` (unannotated schemas) and `emptySchemaType` (empty `{}` schemas).
   */
  function resolveTypeOption(value: 'any' | 'unknown' | 'void'): ScalarSchemaType {
    if (value === 'any') return schemaTypes.any
    if (value === 'void') return schemaTypes.void
    return schemaTypes.unknown
  }

  /**
   * Resolves the AST type and datetime modifiers for a date/time format, honoring the `dateType` option.
   * Returns `undefined` when `dateType` is `false`, meaning the format should fall through to `string`.
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
   * Shared metadata fields included in every `createSchema` call.
   * Centralizes the common properties so sub-handlers don't repeat them.
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
   * Converts a `$ref` schema pointer into a `RefSchemaNode`.
   *
   * In OAS 3.0 siblings of `$ref` are technically ignored by the spec, but Kubb intentionally
   * preserves them so that annotations like `pattern`, `description`, and `nullable` are
   * reflected in generated JSDoc and type modifiers.
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
   * Converts a `allOf` schema into either a flattened member node (single-member `allOf`)
   * or an `IntersectionSchemaNode` (multi-member `allOf`).
   *
   * Single-member `allOf` without sibling structural keys is the common OAS 3.0 pattern for
   * annotating a `$ref` or primitive with extra constraints; it is flattened to avoid
   * producing needless intersection wrappers.
   *
   * The flatten path is skipped when the outer schema carries structural keys that cannot be
   * merged into annotation fields: `properties`, `required`, or `additionalProperties`.
   * Those cases must become an intersection so the constraints are preserved.
   *
   * Circular references through discriminator parents are detected and skipped to prevent
   * infinite recursion during code generation.
   */
  function convertAllOf({ schema, name, nullable, defaultValue, options }: SchemaContext): SchemaNode {
    if (
      schema.allOf!.length === 1 &&
      !schema.properties &&
      !(Array.isArray(schema.required) && schema.required.length) &&
      schema.additionalProperties === undefined
    ) {
      const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
      const memberNode = convertSchema({ schema: memberSchema! as SchemaObject }, options)
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
        return !inOneOf && !inMapping
      })
      .map((s) => convertSchema({ schema: s as SchemaObject }, options))

    // Track where allOf-derived members end so only the synthetic members added below
    // (injected required-key objects + outer-properties object) are candidates for merging.
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
              allOfMembers.push(convertSchema({ schema: { properties: { [key]: resolved.properties[key] }, required: [key] } as SchemaObject }, options))
              break
            }
          }
        }
      }
    }

    if (schema.properties) {
      const { allOf: _allOf, ...schemaWithoutAllOf } = schema
      allOfMembers.push(convertSchema({ schema: schemaWithoutAllOf }, options))
    }

    // Merge consecutive anonymous object members within the synthetic portion — see `mergeAdjacentAnonymousObjects`.
    return createSchema({
      type: 'intersection',
      members: [...allOfMembers.slice(0, syntheticStart), ...mergeAdjacentAnonymousObjects(allOfMembers.slice(syntheticStart))],
      ...renderSchemaBase(schema, name, nullable, defaultValue),
    })
  }

  /**
   * Converts a `oneOf` / `anyOf` schema into a `UnionSchemaNode`.
   *
   * Both keywords are treated identically — their members are concatenated into a single union.
   * When sibling `properties` are present alongside `oneOf`/`anyOf`, each union member is
   * individually intersected with the shared properties node to match the OAS pattern of
   * adding common fields next to a discriminated union.
   */
  function convertUnion({ schema, name, nullable, defaultValue, options }: SchemaContext): SchemaNode {
    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    const unionBase = {
      ...renderSchemaBase(schema, name, nullable, defaultValue),
      discriminatorPropertyName: isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
    }

    if (schema.properties) {
      const { oneOf: _oneOf, anyOf: _anyOf, ...schemaWithoutUnion } = schema
      const discriminator = isDiscriminator(schema) ? schema.discriminator : undefined

      // Strip discriminator so convertObject won't re-apply the full mapping enum.
      const memberBaseSchema: SchemaObject = discriminator
        ? (Object.fromEntries(Object.entries(schemaWithoutUnion).filter(([key]) => key !== 'discriminator')) as SchemaObject)
        : schemaWithoutUnion

      // Convert shared properties once to avoid duplicate enum naming
      // (e.g. StatusEnum appearing twice and getting a numeric suffix).
      const sharedPropertiesNode = convertSchema({ schema: memberBaseSchema, name: isLegacyNaming ? undefined : name }, options)

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
            members: [convertSchema({ schema: s as SchemaObject }, options), propertiesNode],
          })
        }),
      })
    }

    return createSchema({
      type: 'union',
      ...unionBase,
      members: simplifyUnionMembers(unionMembers.map((s) => convertSchema({ schema: s as SchemaObject }, options))),
    })
  }

  /**
   * Converts an OAS 3.1 `const` schema into either a null scalar or a single-value `EnumSchemaNode`.
   * `const: null` maps to a null scalar; any other value becomes a one-item enum so that generators
   * can produce a precise literal type.
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
        nullable,
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
   * Handles `format`-based special types (date/time, uuid, email, blob, etc.).
   * Returns `undefined` when the format should fall through to string handling
   * (i.e. `format: 'date-time'` with `dateType: false`).
   */
  function convertFormat({ schema, name, nullable, defaultValue, mergedOptions }: SchemaContext): SchemaNode | undefined {
    const base = renderSchemaBase(schema, name, nullable, defaultValue)

    // int64 is option-dependent so it can't live in the static formatMap.
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

    // date-time / date / time are option-dependent and can't live in the static formatMap.
    if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
      const dateType = getDateType(mergedOptions, schema.format)
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
   * Handles several edge cases:
   * - `{ type: 'array', enum }` (technically invalid OAS) — the enum is normalized into `items`.
   * - `null` in enum values (OAS 3.0 nullable enum convention) — stripped and reflected as `nullable`.
   * - `x-enumNames` / `x-enum-varnames` vendor extensions — produce named enum variants with explicit labels.
   * - Numeric and boolean enums require a const-map representation because most generators cannot
   *   use string-enum syntax for non-string values.
   */
  function convertEnum({ schema, name, nullable, type, options }: SchemaContext): SchemaNode {
    // Malformed schema: `{ type: 'array', enum: [...] }` — normalize by moving the enum into items.
    if (type === 'array') {
      const isItemsObject = typeof schema.items === 'object' && !Array.isArray(schema.items)
      const normalizedItems: SchemaObject = { ...(isItemsObject ? (schema.items as SchemaObject) : {}), enum: schema.enum }
      const { enum: _enum, ...schemaWithoutEnum } = schema
      return convertSchema({ schema: { ...schemaWithoutEnum, items: normalizedItems } as SchemaObject, name }, options)
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
    if (extensionKey) {
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

    // Number / integer enum — must use a const map since most generators can't use string-enum for numbers.
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

    // Boolean enum — same const-map approach as numeric.
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

    // Plain string enum (default path).
    return createSchema({
      ...enumBase,
      enumValues: [...new Set(filteredValues)],
    })
  }

  /**
   * Converts an object-like schema (`type: 'object'`, `properties`, `additionalProperties`,
   * or `patternProperties`) into an `ObjectSchemaNode`.
   *
   * When a `discriminator` is present, the discriminator property's schema is replaced with an
   * enum of the mapping keys so generators can produce a precise literal-union type for it.
   *
   * Property optionality follows OAS semantics:
   * - required + not nullable → `required: true`
   * - not required + not nullable → `optional: true`
   * - not required + nullable → `nullish: true`
   */
  /**
   * Builds the propagation name for a child property during recursive schema conversion.
   *
   * - **Legacy naming** (`isLegacyNaming`): only the immediate property key is used
   *   (e.g. `Params` for property `params`), keeping nested names short.
   * - **Default naming**: the parent name is prepended so the full path is encoded
   *   (e.g. `OrderParams` when parent is `Order`).
   */
  function resolveChildName(parentName: string | undefined, propName: string): string | undefined {
    if (isLegacyNaming) {
      return pascalCase(propName)
    }
    return parentName ? pascalCase([parentName, propName].join(' ')) : undefined
  }

  /**
   * Derives the final name for an enum property schema node.
   *
   * The raw name always includes the enum suffix (e.g. `StatusEnum`).
   * In legacy mode an additional deduplication step appends a numeric suffix
   * when the same name has already been used (e.g. `ParamsStatusEnum2`).
   */
  function resolveEnumPropName(parentName: string | undefined, propName: string, enumSuffix: string): string {
    const raw = pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
    return isLegacyNaming ? getUniqueName(raw, usedEnumNames) : raw
  }

  /**
   * Given a freshly-converted property schema, returns the node with a correct
   * `name` attached — or stripped — depending on whether the node is a named
   * enum, a boolean const-enum (always inlined), or a regular schema.
   */
  function applyEnumName(propNode: SchemaNode, parentName: string | undefined, propName: string, enumSuffix: string): SchemaNode {
    const enumNode = narrowSchema(propNode, 'enum')

    // Boolean-primitive enum nodes (e.g. `const: false`) are always inlined as
    // literal types and must not receive a named identifier.
    if (enumNode?.primitive === 'boolean') {
      return { ...propNode, name: undefined }
    }

    if (enumNode) {
      return { ...propNode, name: resolveEnumPropName(parentName, propName, enumSuffix) }
    }

    return propNode
  }

  function convertObject({ schema, name, nullable, defaultValue, options, mergedOptions }: SchemaContext): SchemaNode {
    const properties: Array<PropertyNode> = schema.properties
      ? Object.entries(schema.properties).map(([propName, propSchema]) => {
          const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
          const resolvedPropSchema = propSchema as SchemaObject
          const propNullable = isNullable(resolvedPropSchema)

          const childName = resolveChildName(name, propName)
          const propNode = convertSchema({ schema: resolvedPropSchema, name: childName }, options)
          const schemaNode = applyEnumName(propNode, name, propName, mergedOptions.enumSuffix)

          return createProperty({
            name: propName,
            schema: {
              ...schemaNode,
              nullable: propNullable || undefined,
              optional: !required && !propNullable ? true : undefined,
              nullish: !required && propNullable ? true : undefined,
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
      additionalPropertiesNode = convertSchema({ schema: additionalProperties as SchemaObject }, options)
    } else if (additionalProperties === false) {
      additionalPropertiesNode = undefined
    } else if (additionalProperties) {
      additionalPropertiesNode = createSchema({ type: resolveTypeOption(mergedOptions.unknownType) })
    }

    const rawPatternProperties = 'patternProperties' in schema ? schema.patternProperties : undefined

    const patternProperties = rawPatternProperties
      ? Object.fromEntries(
          Object.entries(rawPatternProperties).map(([pattern, patternSchema]) => [
            pattern,
            patternSchema === true || (typeof patternSchema === 'object' && Object.keys(patternSchema).length === 0)
              ? createSchema({ type: resolveTypeOption(mergedOptions.unknownType) })
              : convertSchema({ schema: patternSchema as SchemaObject }, options),
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
      const enumName = name ? resolveEnumPropName(name, discPropName, mergedOptions.enumSuffix) : undefined
      return applyDiscriminatorEnum({ node: objectNode, propertyName: discPropName, values, enumName })
    }

    return objectNode
  }

  /**
   * Converts an OAS 3.1 `prefixItems` tuple into a `TupleSchemaNode`.
   *
   * Each `prefixItems` element maps to a positional tuple slot. An optional `items` schema
   * after the prefix items is mapped to the rest parameter of the tuple.
   */
  function convertTuple({ schema, name, nullable, defaultValue, options }: SchemaContext): SchemaNode {
    const tupleItems = (schema.prefixItems ?? []).map((item) => convertSchema({ schema: item as SchemaObject }, options))
    const rest = schema.items ? convertSchema({ schema: schema.items as SchemaObject }, options) : undefined

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
   * When the items schema is an inline enum, a name derived from the parent array's name and
   * `enumSuffix` is forwarded so generators can emit a named enum declaration.
   */
  function convertArray({ schema, name, nullable, defaultValue, options, mergedOptions }: SchemaContext): SchemaNode {
    const rawItems = schema.items as SchemaObject | undefined
    // When the items schema contains an inline enum, derive a named identifier
    // so generators can emit a standalone enum declaration.
    const itemName = rawItems?.enum?.length && name ? resolveEnumPropName(undefined, name, mergedOptions.enumSuffix) : undefined
    const items = rawItems ? [convertSchema({ schema: rawItems, name: itemName }, options)] : []

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
   * Central dispatcher: converts an OAS `SchemaObject` into a `SchemaNode`.
   *
   * Dispatch order (first match wins):
   * 1. `$ref` pointer
   * 2. `allOf` composition
   * 3. `oneOf` / `anyOf` union
   * 4. `const` literal (OAS 3.1)
   * 5. `format`-based special type (date/time, uuid, blob, …)
   * 6. OAS 3.1 `contentMediaType: 'application/octet-stream'` blob
   * 7. OAS 3.1 multi-type array → union or fallthrough
   * 8. Constraint-inferred type (minLength/maxLength → string; minimum/maximum → number)
   * 9. `enum` values
   * 10. Object / array / tuple / scalar by `type`
   * 11. Empty schema fallback (`emptySchemaType` option)
   */
  function convertSchema({ schema, name }: { schema: SchemaObject; name?: string }, options?: Partial<ParserOptions>): SchemaNode {
    const mergedOptions: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...options }
    // Flatten keyword-only allOf fragments (no $ref, no structural keys) into the parent
    // schema before parsing, so simple annotation patterns don't produce needless intersections.
    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema && flattenedSchema !== schema) {
      return convertSchema({ schema: flattenedSchema, name }, options)
    }

    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    // Normalize OAS 3.1 multi-type array to a single type string for the dispatch below.
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    const ctx: SchemaContext = { schema, name, nullable, defaultValue, type, options, mergedOptions }

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
          members: nonNullTypes.map((t) => convertSchema({ schema: { ...schema, type: t } as SchemaObject, name }, options)),
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

    const emptyType = resolveTypeOption(mergedOptions.emptySchemaType)
    return createSchema({ type: emptyType as ScalarSchemaType, name, title: schema.title, description: schema.description })
  }

  /**
   * Converts a single dereferenced OAS parameter object into a `ParameterNode`.
   * When the parameter has no `schema` or its schema is a `$ref`, falls back to `unknownType`.
   */
  function parseParameter(options: ParserOptions, param: Record<string, unknown>): ParameterNode {
    const required = (param['required'] as boolean | undefined) ?? false

    const schema: SchemaNode =
      param['schema'] && !isReference(param['schema'])
        ? convertSchema({ schema: param['schema'] as SchemaObject }, options)
        : createSchema({ type: resolveTypeOption(options.unknownType) })

    return createParameter({
      name: param['name'] as string,
      in: param['in'] as ParameterLocation,
      schema: {
        ...schema,
        description: (param['description'] as string | undefined) ?? schema.description,
        optional: !required || !!schema.optional ? true : undefined,
      },
      required,
    })
  }

  /**
   * Converts an OAS `Operation` into an `OperationNode`, resolving parameters,
   * request body, and all response codes into their AST node equivalents.
   */
  function parseOperation(options: ParserOptions, oas: Oas, operation: Operation): OperationNode {
    const parameters: Array<ParameterNode> = oas.getParameters(operation).map((param) => parseParameter(options, param as unknown as Record<string, unknown>))

    const requestBodySchema = oas.getRequestSchema(operation)
    const requestBodySchemaNode = requestBodySchema ? convertSchema({ schema: requestBodySchema }, options) : undefined

    const requestBodyKeysToOmit = requestBodySchema?.properties
      ? Object.entries(requestBodySchema.properties)
          .filter(([, prop]) => !isReference(prop) && (prop as { readOnly?: boolean }).readOnly)
          .map(([key]) => key)
      : undefined

    const requestBody = requestBodySchemaNode
      ? {
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
   * Converts an OpenAPI/Swagger spec (wrapped in a Kubb `Oas` instance) into
   * a `RootNode` — the top-level node of the `@kubb/ast` tree.
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

  /**
   * Walks a `SchemaNode` tree and resolves all `ref` node names through the provided callbacks.
   *
   * `resolveName` handles all schema types; `resolveEnumName` (when provided) takes precedence
   * for `enum` nodes, enabling a separate naming strategy for enums (e.g. different suffix).
   *
   * Collision-resolved names (from `nameMapping`) are applied before user-supplied resolvers.
   */
  function resolveRefs(node: SchemaNode, resolveName: (ref: string) => string | undefined, resolveEnumName?: (name: string) => string | undefined): SchemaNode {
    return transform(node, {
      schema(schemaNode) {
        const schemaRef = narrowSchema(schemaNode, schemaTypes.ref)

        if (schemaRef && (schemaRef.ref || schemaRef.name)) {
          const rawRef = schemaRef.ref ?? schemaRef.name!
          const resolved = resolveName(nameMapping.get(rawRef) ?? rawRef)
          if (resolved) {
            return { ...schemaNode, name: resolved }
          }
        }

        if (schemaNode.type === 'enum' && schemaNode.name) {
          const resolved = (resolveEnumName ?? resolveName)(schemaNode.name)
          if (resolved) {
            return { ...schemaNode, name: resolved }
          }
        }
      },
    }) as SchemaNode
  }

  return {
    parse,
    convertSchema,
    resolveRefs,
    nameMapping,
  } as OasParser
}
