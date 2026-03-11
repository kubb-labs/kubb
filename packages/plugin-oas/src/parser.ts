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
} from '@internals/ast'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema, schemaTypes } from '@internals/ast'
import { pascalCase } from '@internals/utils'
import type { Oas, Operation, SchemaObject } from '@kubb/oas'
import { flattenSchema, isDiscriminator, isNullable, isReference } from '@kubb/oas'

/** Distributive `Omit` that correctly distributes over union types. */
type DistributiveOmit<TValue, TKey extends PropertyKey> = TValue extends unknown ? Omit<TValue, TKey> : never

/** Maps each `dateType` option value to the AST node produced by `format: 'date-time'`. */
type DateTimeNodeByDateType = {
  date: DateSchemaNode
  string: DatetimeSchemaNode
  stringOffset: DatetimeSchemaNode
  stringLocal: DatetimeSchemaNode
  false: StringSchemaNode
}

/** Resolves the AST node produced by `format: 'date-time'` based on the `dateType` option. */
type ResolveDateTimeNode<TDateType extends Options['dateType']> = DateTimeNodeByDateType[TDateType extends keyof DateTimeNodeByDateType ? TDateType : 'string']

/**
 * Single source of truth: ordered list of `[shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the node type of the first matching entry.
 * Parameterized over `TDateType` so `format: 'date-time'` resolves to the correct node based on the option.
 */
type SchemaNodeMap<TDateType extends Options['dateType'] = Options['dateType']> = [
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
  TDateType extends Options['dateType'] = Options['dateType'],
  TEntries extends ReadonlyArray<[object, SchemaNode]> = SchemaNodeMap<TDateType>,
> = TEntries extends [infer TEntry extends [object, SchemaNode], ...infer TRest extends ReadonlyArray<[object, SchemaNode]>]
  ? TSchema extends TEntry[0]
    ? TEntry[1]
    : InferSchemaNode<TSchema, TDateType, TRest>
  : SchemaNode

type Options = {
  dateType: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  integerType: 'number' | 'bigint'
  unknownType: 'any' | 'unknown' | 'void'
  emptySchemaType: 'any' | 'unknown' | 'void'
  /**
   * Suffix appended to derived enum names when building property schema names.
   * @default `'enum'`
   */
  enumSuffix: string
}

const DEFAULT_OPTIONS: Options = {
  dateType: 'string',
  integerType: 'number',
  unknownType: 'any',
  emptySchemaType: 'any',
  enumSuffix: 'enum',
}

const FORMAT_MAP: Record<string, SchemaType> = {
  uuid: 'uuid',
  email: 'email',
  'idn-email': 'email',
  uri: 'url',
  'uri-reference': 'url',
  url: 'url',
  ipv4: 'url',
  ipv6: 'url',
  hostname: 'url',
  'idn-hostname': 'url',
  binary: 'blob',
  byte: 'blob',
  // Numeric formats — format is more specific than type, so these override type.
  // see https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
  int32: 'integer',
  float: 'number',
  double: 'number',
}

function formatToSchemaType(format: string): SchemaType | undefined {
  return FORMAT_MAP[format]
}

function extractRefName($ref: string): string {
  return $ref.split('/').at(-1) ?? $ref
}

function toMediaType(contentType: string): MediaType | undefined {
  const known: Array<MediaType> = [
    'application/json',
    'application/xml',
    'application/x-www-form-urlencoded',
    'application/octet-stream',
    'application/pdf',
    'application/zip',
    'application/graphql',
    'multipart/form-data',
    'text/plain',
    'text/html',
    'text/csv',
    'text/xml',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'video/mp4',
  ]
  return known.includes(contentType as MediaType) ? (contentType as MediaType) : undefined
}

/** The public interface returned by `createOasParser`, typed over the resolved `dateType` option. */
type OasParser<TDateType extends Options['dateType']> = {
  buildAst: (oas: Oas) => RootNode
  convertSchema: <TFormat extends string, TSchema extends SchemaObject & { format?: TFormat }>(
    schema: TSchema,
    name?: string,
  ) => InferSchemaNode<TSchema, TDateType>
}

type ParserConfig = {
  /** Optional OAS instance used for dereferencing `$ref` schemas in `allOf` required-key resolution and circular reference detection. */
  oas?: Oas
}

/**
 * Creates a scope-bound OAS parser that converts an OpenAPI/Swagger spec into
 * the `@internals/ast` tree. All helpers close over the resolved `options` so
 * callers never have to thread them through manually.
 *
 * This is the **kubb-parser** stage of the compilation lifecycle:
 *   OpenAPI / Swagger  →  Kubb AST
 *
 * No code is generated here; the resulting tree is spec-agnostic and can
 * be consumed by any downstream plugin (plugin-ts, plugin-zod, …).
 *
 * @example
 * ```ts
 * const parser = createOasParser({ emptySchemaType: 'unknown' })
 * const root = parser.buildAst(oas)
 * const node = parser.convertSchema(schemaObject, 'Pet')
 * ```
 */
export function createOasParser(): OasParser<'string'>
export function createOasParser<TOptions extends Partial<Options>>(
  userOptions: TOptions,
  config?: ParserConfig,
): OasParser<TOptions extends { dateType: Options['dateType'] } ? TOptions['dateType'] : (typeof DEFAULT_OPTIONS)['dateType']>
export function createOasParser<TOptions extends Partial<Options>>(userOptions?: TOptions, config?: ParserConfig) {
  const options: Options = { ...DEFAULT_OPTIONS, ...userOptions }
  const oas = config?.oas

  function getUnknownType() {
    if (options.unknownType === 'any') {
      return schemaTypes.any
    }
    if (options.unknownType === 'void') {
      return schemaTypes.void
    }

    return schemaTypes.unknown
  }

  function getEmptySchemaType() {
    if (options.emptySchemaType === 'any') {
      return schemaTypes.any
    }
    if (options.emptySchemaType === 'void') {
      return schemaTypes.void
    }

    return schemaTypes.unknown
  }

  /**
   * Resolves the AST type and datetime modifiers for a date/time format, honoring the `dateType` option.
   * Returns `undefined` when `dateType` is `false`, meaning the format should fall through to `string`.
   */
  function getDateType(
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

  function convertSchema<TFormat extends string, TSchema extends SchemaObject & { format?: TFormat }>(
    schema: TSchema,
    name?: string,
  ): InferSchemaNode<TSchema, TOptions extends { dateType: Options['dateType'] } ? TOptions['dateType'] : (typeof DEFAULT_OPTIONS)['dateType']>
  function convertSchema(schema: SchemaObject, name?: string): SchemaNode {
    // Flatten keyword-only allOf fragments (no $ref, no structural keys) into the parent
    // schema before parsing, so simple annotation patterns don't produce needless intersections.
    const flattenedSchema = flattenSchema(schema as unknown as Parameters<typeof flattenSchema>[0]) as SchemaObject | null
    if (flattenedSchema && flattenedSchema !== (schema as unknown)) {
      return convertSchema(flattenedSchema, name)
    }

    const emptyType = getEmptySchemaType()
    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default

    // $ref — the schema is a pointer to another definition
    if (isReference(schema)) {
      // In OAS 3.0 siblings of $ref are technically ignored, but Kubb intentionally
      // preserves them so that annotations like `pattern`, `description`, and `nullable`
      // that authors place next to a $ref are reflected in generated JSDoc / type modifiers.
      // Cast back to SchemaObject to access sibling properties alongside $ref.
      const schemaObject = schema as unknown as SchemaObject & { $ref: string }

      return createSchema({
        type: 'ref',
        name,
        ref: extractRefName(schemaObject.$ref),
        nullable,
        description: schemaObject.description,
        deprecated: schemaObject.deprecated,
        readOnly: schemaObject.readOnly,
        writeOnly: schemaObject.writeOnly,
        pattern: schemaObject.type === 'string' ? schemaObject.pattern : undefined,
        example: schemaObject.example,
        default: defaultValue,
      })
    }

    // Composition: allOf → intersection
    if (schema.allOf?.length) {
      // Single-member allOf without direct properties: flatten to the member type and merge
      // outer-schema metadata. This is the common OAS 3.0 pattern for annotating a $ref or
      // a primitive with extra constraints (e.g. `allOf: [{ type: 'string', nullable: true }]`).
      if (schema.allOf.length === 1 && !schema.properties) {
        const [memberSchema] = schema.allOf as SchemaObject[]
        const memberNode = convertSchema(memberSchema!)
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
      const allOfMembers: SchemaNode[] = (schema.allOf as SchemaObject[])
        .filter((item) => {
          if (!isReference(item) || !name || !oas) {
            return true
          }
          const deref = oas.get<SchemaObject>((item as { $ref: string }).$ref)
          if (!deref || !isDiscriminator(deref)) {
            return true
          }
          const parentUnion = (deref as SchemaObject).oneOf ?? (deref as SchemaObject).anyOf
          if (!parentUnion) {
            return true
          }
          const childRef = `#/components/schemas/${name}`
          const inOneOf = parentUnion.some((oneOfItem) => isReference(oneOfItem) && (oneOfItem as { $ref: string }).$ref === childRef)
          const inMapping = Object.values((deref as SchemaObject & { discriminator: { mapping?: Record<string, string> } }).discriminator.mapping ?? {}).some(
            (v) => v === childRef,
          )
          return !inOneOf && !inMapping
        })
        .map((s) => convertSchema(s as SchemaObject))

      // When `required` lists keys not present in the outer `properties`, resolve them from
      // the allOf member schemas and inject them as extra intersection members.
      if (Array.isArray(schema.required) && schema.required.length) {
        const outerKeys = schema.properties ? new Set(Object.keys(schema.properties)) : new Set<string>()
        const missingRequired = schema.required.filter((key) => !outerKeys.has(key))

        if (missingRequired.length) {
          // Dereference each allOf member: use `oas.get()` when available, skip bare $refs otherwise.
          const resolvedMembers = (schema.allOf as SchemaObject[]).flatMap((item) => {
            if (!isReference(item)) {
              return [item]
            }
            if (oas) {
              const deref = oas.get<SchemaObject>(item.$ref)
              return deref && !isReference(deref) ? [deref as SchemaObject] : []
            }
            return []
          })

          for (const key of missingRequired) {
            for (const resolved of resolvedMembers) {
              if (resolved.properties?.[key]) {
                allOfMembers.push(convertSchema({ properties: { [key]: resolved.properties[key] }, required: [key] } as SchemaObject))
                break
              }
            }
          }
        }
      }

      // When the allOf schema also has sibling `properties`, append the properties schema
      // as an additional intersection member.
      if (schema.properties) {
        const { allOf: _allOf, ...schemaWithoutAllOf } = schema as SchemaObject & { allOf?: unknown[] }
        allOfMembers.push(convertSchema(schemaWithoutAllOf as SchemaObject))
      }

      return createSchema({
        type: 'intersection',
        name,
        members: allOfMembers,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        nullable,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
      })
    }

    // Composition: oneOf / anyOf → union
    const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    if (unionMembers.length) {
      const unionBase = {
        name,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        nullable,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
        discriminatorPropertyName: isDiscriminator(schema) ? schema.discriminator.propertyName : undefined,
      }

      // When the union schema also has sibling `properties`, each member is intersected with
      // the properties schema — matching the OAS pattern of adding shared fields alongside oneOf.
      if (schema.properties) {
        const { oneOf: _oneOf, anyOf: _anyOf, ...schemaWithoutUnion } = schema as SchemaObject & { oneOf?: unknown[]; anyOf?: unknown[] }
        const propertiesNode = convertSchema(schemaWithoutUnion as SchemaObject)

        return createSchema({
          type: 'union',
          ...unionBase,
          members: unionMembers.map((s) =>
            createSchema({
              type: 'intersection',
              members: [convertSchema(s as SchemaObject), propertiesNode],
            }),
          ),
        })
      }

      return createSchema({
        type: 'union',
        ...unionBase,
        members: unionMembers.map((s) => convertSchema(s as SchemaObject)),
      })
    }

    // OAS 3.1 const — a single fixed value, semantically equivalent to a one-item enum.
    // `const: null` maps to the null scalar; `const: undefined` falls through to the empty-type fallback.
    if ('const' in schema) {
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

      if (constValue !== undefined) {
        const constPrimitive = typeof constValue === 'number' ? 'number' : typeof constValue === 'boolean' ? 'boolean' : ('string' as const)
        return createSchema({
          type: 'enum',
          primitive: constPrimitive,
          name,
          enumValues: [constValue as string | number | boolean],
          title: schema.title,
          description: schema.description,
          deprecated: schema.deprecated,
          nullable,
          readOnly: schema.readOnly,
          writeOnly: schema.writeOnly,
          default: defaultValue,
          example: schema.example,
        })
      }
    }

    // Format-based special types (takes precedence over primitive `type`).
    // see https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
    if (schema.format) {
      // int64 is option-dependent so it can't live in the static FORMAT_MAP.
      if (schema.format === 'int64') {
        return createSchema({
          type: options.integerType === 'bigint' ? 'bigint' : 'integer',
          primitive: 'integer',
          name,
          nullable,
          title: schema.title,
          description: schema.description,
          deprecated: schema.deprecated,
          readOnly: schema.readOnly,
          writeOnly: schema.writeOnly,
          default: defaultValue,
          example: schema.example,
          min: schema.minimum,
          max: schema.maximum,
          exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
          exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
        })
      }

      // date-time / date / time are option-dependent and can't live in the static FORMAT_MAP.
      if (schema.format === 'date-time' || schema.format === 'date' || schema.format === 'time') {
        const dateType = getDateType(schema.format)

        if (dateType) {
          const base = {
            name,
            primitive: 'string' as const,
            nullable,
            title: schema.title,
            description: schema.description,
            deprecated: schema.deprecated,
            readOnly: schema.readOnly,
            writeOnly: schema.writeOnly,
            default: defaultValue,
            example: schema.example,
          }

          if (dateType.type === 'datetime') {
            return createSchema({ ...base, type: 'datetime', offset: dateType.offset, local: dateType.local })
          }
          return createSchema({ ...base, type: dateType.type, representation: dateType.representation })
        }
        // dateType: false — fall through to string type below
      } else {
        const specialType = formatToSchemaType(schema.format)

        if (specialType) {
          const specialPrimitive: PrimitiveSchemaType =
            specialType === 'number' || specialType === 'integer' || specialType === 'bigint' ? specialType : 'string'
          const base = {
            name,
            primitive: specialPrimitive,
            nullable,
            title: schema.title,
            description: schema.description,
            deprecated: schema.deprecated,
            readOnly: schema.readOnly,
            writeOnly: schema.writeOnly,
            default: defaultValue,
            example: schema.example,
          }

          if (specialType === 'number' || specialType === 'integer' || specialType === 'bigint') {
            return createSchema({ ...base, type: specialType })
          }
          return createSchema({ ...base, type: specialType as ScalarSchemaType })
        }
      }
    }

    // OAS 3.1: `contentMediaType: 'application/octet-stream'` on a string schema signals binary data.
    if (schema.type === 'string' && (schema as SchemaObject & { contentMediaType?: string }).contentMediaType === 'application/octet-stream') {
      return createSchema({
        type: 'blob',
        primitive: 'string',
        name,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
      })
    }

    // OAS 3.1: `type` may be an array of types — e.g. `["string", "integer", "null"]`.
    // `null` in the array is the 3.1 equivalent of `nullable: true`; strip it and set the flag.
    // When 2+ non-null types remain, produce a union node covering each type individually.
    // When exactly 1 non-null type remains, fall through to the normal single-type branches below.
    if (Array.isArray(schema.type) && schema.type.length > 1) {
      const nonNullTypes = schema.type.filter((t) => t !== 'null') as string[]
      const arrayNullable = schema.type.includes('null') || nullable || undefined

      if (nonNullTypes.length > 1) {
        return createSchema({
          type: 'union',
          name,
          members: nonNullTypes.map((t) => convertSchema({ ...schema, type: t } as SchemaObject)),
          nullable: arrayNullable,
          title: schema.title,
          description: schema.description,
          deprecated: schema.deprecated,
          readOnly: schema.readOnly,
          writeOnly: schema.writeOnly,
          default: defaultValue,
          example: schema.example,
        })
      }
    }

    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    // Infer type from constraints when no explicit type is provided.
    // minLength / maxLength / pattern → string; minimum / maximum → number.
    // Note: minItems/maxItems do NOT infer array — arrays require an items key and are handled above.
    if (!type) {
      if (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined) {
        return createSchema({
          type: 'string',
          primitive: 'string',
          name,
          nullable,
          title: schema.title,
          description: schema.description,
          deprecated: schema.deprecated,
          readOnly: schema.readOnly,
          writeOnly: schema.writeOnly,
          default: defaultValue,
          example: schema.example,
          min: schema.minLength,
          max: schema.maxLength,
          pattern: schema.pattern,
        })
      }

      if (schema.minimum !== undefined || schema.maximum !== undefined) {
        return createSchema({
          type: 'number',
          primitive: 'number',
          name,
          nullable,
          title: schema.title,
          description: schema.description,
          deprecated: schema.deprecated,
          readOnly: schema.readOnly,
          writeOnly: schema.writeOnly,
          default: defaultValue,
          example: schema.example,
          min: schema.minimum,
          max: schema.maximum,
          exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
          exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
        })
      }
    }

    // Enum
    if (schema.enum?.length) {
      // Malformed schema: `{ type: 'array', enum: [...] }` — normalize by moving the enum into items.
      // This pattern is technically invalid OAS but appears in some real-world specs.
      if (type === 'array') {
        const rawSchema = schema as unknown as { items?: SchemaObject; enum?: unknown[] }
        const isItemsObject = typeof rawSchema.items === 'object' && !Array.isArray(rawSchema.items)
        const normalizedItems = { ...(isItemsObject ? rawSchema.items : {}), enum: schema.enum } as SchemaObject
        const { enum: _enum, ...schemaWithoutEnum } = schema as SchemaObject & { enum?: unknown[] }
        return convertSchema({ ...schemaWithoutEnum, items: normalizedItems } as SchemaObject, name)
      }

      // `null` in enum values is the OAS 3.0 convention for a nullable enum.
      // Detect it, set the nullable flag, and strip it from the actual enum values.
      const nullInEnum = schema.enum.includes(null)
      const filteredValues = (nullInEnum ? schema.enum.filter((v) => v !== null) : schema.enum) as Array<string | number | boolean>
      const enumNullable = nullable || nullInEnum || undefined
      const enumDefault = schema.default === null && enumNullable ? undefined : schema.default

      const enumPrimitive: PrimitiveSchemaType = type === 'number' || type === 'integer' ? type : type === 'boolean' ? 'boolean' : 'string'

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
      const extensionKey = (['x-enumNames', 'x-enum-varnames'] as const).find((key) => key in schema)
      if (extensionKey) {
        const rawNames = (schema as Record<string, unknown>)[extensionKey] as Array<string | number>
        const uniqueNames = [...new Set(rawNames)]
        const enumType = type === 'number' || type === 'integer' ? ('number' as const) : type === 'boolean' ? ('boolean' as const) : ('string' as const)

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

    // Object — also triggered by additionalProperties or patternProperties without explicit type.
    if (type === 'object' || schema.properties || schema.additionalProperties || 'patternProperties' in schema) {
      // When a discriminator is present, override the discriminator property's schema to use
      // an enum of the mapping keys, so generators can produce a precise literal-union type.
      const resolvedSchema: SchemaObject = isDiscriminator(schema)
        ? Object.keys(schema.properties ?? {}).reduce<SchemaObject>((acc, propName) => {
            if (acc.properties?.[propName] && propName === schema.discriminator.propertyName) {
              const existing = acc.properties[propName] as SchemaObject
              return {
                ...acc,
                properties: {
                  ...acc.properties,
                  [propName]: {
                    ...existing,
                    enum: schema.discriminator.mapping ? Object.keys(schema.discriminator.mapping) : undefined,
                  },
                },
              } as SchemaObject
            }
            return acc
          }, schema as SchemaObject)
        : schema

      const properties: Array<PropertyNode> = resolvedSchema.properties
        ? Object.entries(resolvedSchema.properties).map(([propName, propSchema]) => {
            const required = Array.isArray(resolvedSchema.required) ? resolvedSchema.required.includes(propName) : !!resolvedSchema.required
            const resolvedPropSchema = propSchema as SchemaObject
            const propNullable = isNullable(resolvedPropSchema)

            const enumNameParts = [name, propName, options.enumSuffix]
            const derivedPropName = name ? pascalCase(enumNameParts.filter(Boolean).join(' ')) : undefined

            return createProperty({
              name: propName,
              schema: {
                ...convertSchema(resolvedPropSchema, derivedPropName),
                nullable: propNullable || undefined,
                optional: !required && !propNullable ? true : undefined,
                nullish: !required && propNullable ? true : undefined,
              },
              required,
            })
          })
        : []

      const additionalProperties = resolvedSchema.additionalProperties
      const additionalPropertiesNode =
        additionalProperties === true
          ? (true as const)
          : additionalProperties && Object.keys(additionalProperties).length > 0
            ? convertSchema(additionalProperties as SchemaObject)
            : additionalProperties === false
              ? undefined
              : additionalProperties
                ? createSchema({ type: getUnknownType() })
                : undefined

      const rawPatternProperties =
        'patternProperties' in resolvedSchema
          ? (resolvedSchema as unknown as { patternProperties?: Record<string, SchemaObject> }).patternProperties
          : undefined

      const patternProperties = rawPatternProperties
        ? Object.fromEntries(
            Object.entries(rawPatternProperties).map(([pattern, patternSchema]) => [
              pattern,
              (patternSchema as unknown) === true || Object.keys(patternSchema as object).length === 0
                ? createSchema({ type: getUnknownType() })
                : convertSchema(patternSchema as SchemaObject),
            ]),
          )
        : undefined

      return createSchema({
        type: 'object',
        primitive: 'object',
        name,
        properties,
        additionalProperties: additionalPropertiesNode,
        patternProperties,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
      })
    }

    // Tuple — OAS 3.1 / JSON Schema: `prefixItems` defines positional item schemas.
    // `items` (when also present) describes the schema for additional items beyond the prefix.
    if ('prefixItems' in schema) {
      const rawSchema = schema as unknown as { prefixItems: SchemaObject[]; items?: SchemaObject }
      const tupleItems = rawSchema.prefixItems.map((item) => convertSchema(item))
      const rest = rawSchema.items ? convertSchema(rawSchema.items) : undefined
      const min = schema.minItems
      const max = schema.maxItems

      return createSchema({
        type: 'tuple',
        primitive: 'array',
        name,
        items: tupleItems,
        rest,
        min,
        max,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
      })
    }

    // Array — also triggered when `items` is present without an explicit `type: 'array'`.
    if (type === 'array' || 'items' in schema) {
      const rawSchema = schema as unknown as { items?: SchemaObject }
      const items = rawSchema.items ? [convertSchema(rawSchema.items)] : []
      return createSchema({
        type: 'array',
        primitive: 'array',
        name,
        items,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        min: schema.minItems,
        max: schema.maxItems,
        unique: schema.uniqueItems ?? undefined,
        default: defaultValue,
        example: schema.example,
      })
    }

    // String
    if (type === 'string') {
      return createSchema({
        type: 'string',
        primitive: 'string',
        name,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
        min: schema.minLength,
        max: schema.maxLength,
        pattern: schema.pattern,
      })
    }

    // Number
    if (type === 'number') {
      return createSchema({
        type: 'number',
        primitive: 'number',
        name,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
        min: schema.minimum,
        max: schema.maximum,
        exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
        exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      })
    }

    // Integer
    if (type === 'integer') {
      return createSchema({
        type: 'integer',
        primitive: 'integer',
        name,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
        min: schema.minimum,
        max: schema.maximum,
        exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
        exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
      })
    }

    // Boolean
    if (type === 'boolean') {
      return createSchema({
        type: 'boolean',
        primitive: 'boolean',
        name,
        nullable,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: defaultValue,
        example: schema.example,
      })
    }

    // Null
    if (type === 'null') {
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

    // Fallback
    return createSchema({ type: emptyType as ScalarSchemaType, name, title: schema.title, description: schema.description })
  }

  function convertParameter(param: Record<string, unknown>): ParameterNode {
    const schema =
      param['schema'] && !isReference(param['schema'] as object) ? convertSchema(param['schema'] as SchemaObject) : createSchema({ type: getUnknownType() })

    return createParameter({
      name: param['name'] as string,
      in: param['in'] as ParameterLocation,
      schema,
      required: (param['required'] as boolean | undefined) ?? false,
    })
  }

  function convertOperation(oas: Oas, operation: Operation): OperationNode {
    const parameters: Array<ParameterNode> = operation.getParameters().map((param) => {
      const dereferenced = oas.dereferenceWithRef(param) as unknown as Record<string, unknown>

      return convertParameter(dereferenced)
    })

    const requestBodySchema = oas.getRequestSchema(operation)
    const requestBody = requestBodySchema ? convertSchema(requestBodySchema) : undefined

    const responses: Array<ResponseNode> = operation.getResponseStatusCodes().map((statusCode) => {
      const responseObj = operation.getResponseByStatusCode(statusCode)
      const responseSchema = oas.getResponseSchema(operation, statusCode)

      const schema = responseSchema && Object.keys(responseSchema).length > 0 ? convertSchema(responseSchema) : undefined

      const description = typeof responseObj === 'object' && responseObj !== null && !Array.isArray(responseObj) ? responseObj.description : undefined

      const rawContent =
        typeof responseObj === 'object' && responseObj !== null && !Array.isArray(responseObj)
          ? (responseObj as { content?: Record<string, unknown> }).content
          : undefined

      const mediaType = rawContent ? toMediaType(Object.keys(rawContent)[0] ?? '') : toMediaType(operation.contentType)

      return createResponse({
        statusCode: statusCode as StatusCode,
        description,
        schema,
        mediaType,
      })
    })

    return createOperation({
      operationId: operation.getOperationId(),
      method: operation.method.toUpperCase() as HttpMethod,
      path: operation.path,
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
   * a `RootNode` — the top-level node of the `@internals/ast` tree.
   */
  function buildAst(oasInstance: Oas): RootNode {
    // Create a parser with oas bound for dereferencing ($ref resolution in allOf, circular-ref detection).
    // When createOasParser was called without an oas config, we bind it lazily here at buildAst time.
    const oasAwareConvertSchema = oas ? convertSchema : createOasParser(userOptions as TOptions, { oas: oasInstance }).convertSchema

    const { schemas: schemaObjects } = oasInstance.getSchemas()

    const schemas: Array<SchemaNode> = Object.entries(schemaObjects).map(([name, schemaObject]) => oasAwareConvertSchema(schemaObject as SchemaObject, name))

    const paths = oasInstance.getPaths()

    const operations: Array<OperationNode> = Object.entries(paths).flatMap(([, methods]) =>
      Object.entries(methods)
        .map(([, operation]) => (operation ? convertOperation(oasInstance, operation) : null))
        .filter((op): op is OperationNode => op !== null),
    )

    return createRoot({ schemas, operations })
  }

  return { buildAst, convertSchema } as OasParser<any>
}

/**
 * Converts a single `SchemaObject` to a Kubb AST `SchemaNode` using default parser options.
 *
 * For full control over options (e.g. `dateType`, `unknownType`) use `createOasParser` instead.
 *
 * @example
 * ```ts
 * const node = convertSchema(schemaObject, 'Pet')
 * ```
 */
export function convertSchema<TFormat extends string, TSchema extends SchemaObject & { format?: TFormat }>(
  schema: TSchema,
  name?: string,
): InferSchemaNode<TSchema, (typeof DEFAULT_OPTIONS)['dateType']> {
  return createOasParser().convertSchema(schema, name) as InferSchemaNode<TSchema, (typeof DEFAULT_OPTIONS)['dateType']>
}
