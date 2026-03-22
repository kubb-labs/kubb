import { URLPath } from '@internals/utils'
import { createOperation, createParameter, createResponse, createRoot, createSchema, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type {
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
import { DEFAULT_PARSER_OPTIONS, knownMediaTypes } from './constants.ts'
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
import { applyEnumName, resolveChildName, resolveEnumPropName } from './naming.ts'
import type { NamingConfig } from './naming.ts'
import type { Oas } from './oas/Oas.ts'
import type { contentType, Operation, SchemaObject } from './oas/types.ts'
import { flattenSchema, isNullable, isReference } from './oas/utils.ts'
import type { ParserOptions } from './types.ts'


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
 */
type SchemaNodeMap<TDateType extends ParserOptions['dateType'] = 'string'> = [
  [{ $ref: string }, RefSchemaNode],
  [{ allOf: ReadonlyArray<unknown>; properties: object }, IntersectionSchemaNode],
  [{ allOf: readonly [unknown, unknown, ...unknown[]] }, IntersectionSchemaNode],
  [{ allOf: ReadonlyArray<unknown> }, SchemaNode],
  [{ oneOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ anyOf: ReadonlyArray<unknown> }, UnionSchemaNode],
  [{ const: null }, ScalarSchemaNode],
  [{ const: string | number | boolean }, EnumSchemaNode],
  [{ type: ReadonlyArray<string> }, UnionSchemaNode],
  [{ type: 'array'; enum: ReadonlyArray<unknown> }, import('@kubb/ast/types').ArraySchemaNode],
  [{ enum: ReadonlyArray<unknown> }, EnumSchemaNode],
  [{ type: 'object' }, ObjectSchemaNode],
  [{ additionalProperties: boolean | {} }, ObjectSchemaNode],
  [{ type: 'array' }, import('@kubb/ast/types').ArraySchemaNode],
  [{ items: object }, import('@kubb/ast/types').ArraySchemaNode],
  [{ prefixItems: ReadonlyArray<unknown> }, import('@kubb/ast/types').ArraySchemaNode],
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
 * Pre-computed per-schema context passed to every converter function.
 * Grouping these values avoids repeating the same derivations across all converters.
 */
export type SchemaContext = {
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
 * Shared dependencies injected into converter functions.
 * Replaces closure-based access to parser internals.
 */
export type ConverterDeps = {
  oas: { get: <T>(ref: string) => T | null }
  isLegacyNaming: boolean
  convertSchema: (params: { schema: SchemaObject; name?: string }, options?: Partial<ParserOptions>) => SchemaNode
  resolveChildName: (parentName: string | undefined, propName: string) => string | undefined
  resolveEnumPropName: (parentName: string | undefined, propName: string, enumSuffix: string) => string
  applyEnumName: (propNode: SchemaNode, parentName: string | undefined, propName: string, enumSuffix: string) => SchemaNode
  resolveTypeOption: (value: 'any' | 'unknown' | 'void') => ScalarSchemaType
  renderSchemaBase: (params: { schema: SchemaObject; name: string | undefined; nullable: true | undefined; defaultValue: unknown }) => object
  getDateType: (
    options: ParserOptions,
    format: 'date-time' | 'date' | 'time',
  ) => { type: 'datetime'; offset?: boolean; local?: boolean } | { type: 'date' | 'time'; representation: 'date' | 'string' } | undefined
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
   * `resolveName`. Pass a no-op (`(n) => n`) to skip resolution.
   *
   * The optional `resolveEnumName` callback is called for inline `enum` nodes.
   */
  resolveRefs: (node: SchemaNode, resolveName: (ref: string) => string | undefined, resolveEnumName?: (name: string) => string | undefined) => SchemaNode
  /**
   * Map from original `$ref` paths to their collision-resolved schema names.
   */
  nameMapping: Map<string, string>
}


/**
 * Looks up the Kubb `SchemaType` for a given OAS `format` string.
 * Returns `undefined` for formats not in `formatMap`.
 */
export function formatToSchemaType(format: string, map: Record<string, SchemaType>): SchemaType | undefined {
  return map[format]
}

/**
 * Maps an OAS primitive type string to its `PrimitiveSchemaType` equivalent.
 */
export function getPrimitiveType(type: string | undefined): PrimitiveSchemaType {
  if (type === 'number' || type === 'integer' || type === 'bigint') return type
  if (type === 'boolean') return 'boolean'
  return 'string'
}

/**
 * Narrows a raw content-type string to the `MediaType` union recognized by Kubb.
 */
function toMediaType(contentType: string): MediaType | undefined {
  return knownMediaTypes.has(contentType as MediaType) ? (contentType as MediaType) : undefined
}

/**
 * Collects property keys that should be excluded via `Omit<>` based on a boolean flag.
 * Used to filter `readOnly` keys from request bodies and `writeOnly` keys from responses.
 */
function getKeysToOmit(
  schema: SchemaObject | undefined,
  flag: 'readOnly' | 'writeOnly',
): Array<string> | undefined {
  if (!schema?.properties) return undefined

  const keys = Object.entries(schema.properties)
    .filter(([, prop]) => !isReference(prop) && (prop as Record<string, boolean>)[flag])
    .map(([key]) => key)

  return keys.length ? keys : undefined
}

/**
 * Extracts the raw `SchemaObject` from an OAS parameter, handling three source formats:
 * 1. Direct `schema` key (OAS 3.0+)
 * 2. `content` map with first entry's schema (OAS 3.1 style)
 * 3. Inline schema properties at the parameter level (OAS 2.0)
 */
function extractParameterSchema(param: Record<string, unknown>): SchemaObject | undefined {
  if (param['schema']) {
    return param['schema'] as SchemaObject
  }

  if (param['content']) {
    const contentMap = param['content'] as Record<string, { schema?: SchemaObject }>
    const firstEntry = Object.values(contentMap)[0]
    return firstEntry?.schema
  }

  if (param['type'] || param['enum']) {
    const { name: _name, in: _in, required: _req, description: _desc, ...inlineSchema } = param
    return inlineSchema as SchemaObject
  }

  return undefined
}


/**
 * Creates an OAS parser that converts an OpenAPI/Swagger spec into the `@kubb/ast` tree.
 *
 * This is the **kubb-parser** stage of the compilation lifecycle:
 *   OpenAPI / Swagger  →  Kubb AST
 *
 * No code is generated here; the resulting tree is consumed by downstream plugins.
 *
 * @example
 * ```ts
 * const parser = createOasParser(oas)
 * const root = parser.parse({ emptySchemaType: 'unknown' })
 * ```
 */
export function createOasParser(oas: Oas, { contentType, collisionDetection }: OasParserOptions = {}): OasParser {
  const { schemas: schemaObjects, nameMapping } = oas.getSchemas({ contentType, collisionDetection })

  const isLegacyNaming = collisionDetection === false

  const namingConfig: NamingConfig = {
    isLegacyNaming,
    usedEnumNames: {},
  }


  function resolveTypeOption(value: 'any' | 'unknown' | 'void'): ScalarSchemaType {
    if (value === 'any') return schemaTypes.any
    if (value === 'void') return schemaTypes.void
    return schemaTypes.unknown
  }

  function getDateType(
    options: ParserOptions,
    format: 'date-time' | 'date' | 'time',
  ): { type: 'datetime'; offset?: boolean; local?: boolean } | { type: 'date' | 'time'; representation: 'date' | 'string' } | undefined {
    if (!options.dateType) return undefined

    if (format === 'date-time') {
      if (options.dateType === 'date') return { type: 'date', representation: 'date' }
      if (options.dateType === 'stringOffset') return { type: 'datetime', offset: true }
      if (options.dateType === 'stringLocal') return { type: 'datetime', local: true }
      return { type: 'datetime', offset: false }
    }

    if (format === 'date') {
      return { type: 'date', representation: options.dateType === 'date' ? 'date' : 'string' }
    }

    return { type: 'time', representation: options.dateType === 'date' ? 'date' : 'string' }
  }

  function renderSchemaBase({ schema, name, nullable, defaultValue }: { schema: SchemaObject; name: string | undefined; nullable: true | undefined; defaultValue: unknown }) {
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


  const deps: ConverterDeps = {
    oas,
    isLegacyNaming,
    convertSchema,
    resolveChildName: (parentName, propName) => resolveChildName({ config: namingConfig, parentName, propName }),
    resolveEnumPropName: (parentName, propName, enumSuffix) => resolveEnumPropName({ config: namingConfig, parentName, propName, enumSuffix }),
    applyEnumName: (propNode, parentName, propName, enumSuffix) => applyEnumName({ config: namingConfig, propNode, parentName, propName, enumSuffix }),
    resolveTypeOption,
    renderSchemaBase,
    getDateType,
  }


  /**
   * Converts an OAS `SchemaObject` into a `SchemaNode`.
   *
   * Dispatch order (first match wins):
   * 1. `$ref` pointer
   * 2. `allOf` composition
   * 3. `oneOf` / `anyOf` union
   * 4. `const` literal (OAS 3.1)
   * 5. `format`-based special type
   * 6. OAS 3.1 `contentMediaType` blob
   * 7. OAS 3.1 multi-type array → union or fallthrough
   * 8. Constraint-inferred type
   * 9. `enum` values
   * 10. Object / array / tuple / scalar by `type`
   * 11. Empty schema fallback
   */
  function convertSchema({ schema, name }: { schema: SchemaObject; name?: string }, options?: Partial<ParserOptions>): SchemaNode {
    const mergedOptions: ParserOptions = { ...DEFAULT_PARSER_OPTIONS, ...options }

    const flattenedSchema = flattenSchema(schema)
    if (flattenedSchema && flattenedSchema !== schema) {
      return convertSchema({ schema: flattenedSchema, name }, options)
    }

    const nullable = isNullable(schema) || undefined
    const defaultValue = schema.default === null && nullable ? undefined : schema.default
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    const ctx: SchemaContext = { schema, name, nullable, defaultValue, type, options, mergedOptions }

    if (isReference(schema)) return convertRef(deps, ctx)
    if (schema.allOf?.length) return convertAllOf(deps, ctx)
    if ([...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].length) return convertUnion(deps, ctx)
    if ('const' in schema && schema.const !== undefined) return convertConst(deps, ctx)

    if (schema.format) {
      const formatResult = convertFormat(deps, ctx)
      if (formatResult) return formatResult
    }

    if (schema.type === 'string' && schema.contentMediaType === 'application/octet-stream') {
      return createSchema({ type: 'blob', primitive: 'string', ...renderSchemaBase({ schema, name, nullable, defaultValue }) })
    }

    if (Array.isArray(schema.type) && schema.type.length > 1) {
      const nonNullTypes = schema.type.filter((t) => t !== 'null') as Array<string>
      const arrayNullable = schema.type.includes('null') || nullable || undefined

      if (nonNullTypes.length > 1) {
        return createSchema({
          type: 'union',
          members: nonNullTypes.map((t) => convertSchema({ schema: { ...schema, type: t } as SchemaObject, name }, options)),
          ...renderSchemaBase({ schema, name, nullable: arrayNullable, defaultValue }),
        })
      }
    }

    if (!type) {
      if (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined) {
        return convertString(deps, ctx)
      }
      if (schema.minimum !== undefined || schema.maximum !== undefined) {
        return convertNumeric(deps, ctx, 'number')
      }
    }

    if (schema.enum?.length) return convertEnum(deps, ctx)
    if (type === 'object' || schema.properties || schema.additionalProperties || 'patternProperties' in schema) return convertObject(deps, ctx)
    if ('prefixItems' in schema) return convertTuple(deps, ctx)
    if (type === 'array' || 'items' in schema) return convertArray(deps, ctx)
    if (type === 'string') return convertString(deps, ctx)
    if (type === 'number') return convertNumeric(deps, ctx, 'number')
    if (type === 'integer') return convertNumeric(deps, ctx, 'integer')
    if (type === 'boolean') return convertBoolean(deps, ctx)
    if (type === 'null') return convertNull(deps, ctx)

    const emptyType = resolveTypeOption(mergedOptions.emptySchemaType)
    return createSchema({ type: emptyType as ScalarSchemaType, name, title: schema.title, description: schema.description })
  }

  /**
   * Converts a single dereferenced OAS parameter object into a `ParameterNode`.
   * When the parameter has no `schema`, falls back to `unknownType`.
   * When the schema is a `$ref`, it is converted via `convertRef` (through `convertSchema`)
   * so that the referenced type (e.g. `TestId`) is used instead of falling back to `any`.
   *
   * OAS 3.1 allows parameters to define their schema via `content` instead of a top-level
   * `schema`.  When `content` is present we extract the schema from the first media-type entry.
   */
  function parseParameter(options: ParserOptions, param: Record<string, unknown>): ParameterNode {
    const required = (param['required'] as boolean | undefined) ?? false
    const rawSchema = extractParameterSchema(param)
    const paramName = param['name'] as string

    const schema: SchemaNode = rawSchema ? convertSchema({ schema: rawSchema }, options) : createSchema({ type: resolveTypeOption(options.unknownType) })

    return createParameter({
      name: paramName,
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

    const requestBody = requestBodySchemaNode
      ? {
          schema: requestBodySchemaNode,
          keysToOmit: getKeysToOmit(requestBodySchema, 'readOnly'),
          description: (operation.schema.requestBody as { description?: string } | undefined)?.description,
        }
      : undefined

    const responses: Array<ResponseNode> = operation.getResponseStatusCodes().map((statusCode) => {
      // `oas.getResponseSchema` mutates `operation.schema.responses` to dereference any $ref response
      // objects. We must call it before reading `responseObj` so that all response entries are
      // dereferenced and `responseObj.description` is available even for the first status code.
      const responseSchema = oas.getResponseSchema(operation, statusCode)
      const responseObj = operation.getResponseByStatusCode(statusCode)

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

      return createResponse({
        statusCode: statusCode as StatusCode,
        description,
        schema,
        mediaType,
        keysToOmit: getKeysToOmit(responseSchema, 'writeOnly'),
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

    const schemas: Array<SchemaNode> = Object.entries(schemaObjects).map(([name, schemaObject]) => {
      const so = schemaObject as SchemaObject
      // In legacy mode, top-level enum schemas get the enum suffix appended to their name
      // (e.g. "ZoningDistrictClassCategory" → "ZoningDistrictClassCategoryEnum").
      const schemaName = isLegacyNaming && so.enum?.length ? resolveEnumPropName({ config: namingConfig, parentName: undefined, propName: name, enumSuffix: mergedOptions.enumSuffix }) : name
      return convertSchema({ schema: so, name: schemaName }, mergedOptions)
    })

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
