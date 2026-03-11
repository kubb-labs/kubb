import type {
  ArraySchemaNode,
  CompositeSchemaNode,
  EnumSchemaNode,
  HttpMethod,
  MediaType,
  ObjectSchemaNode,
  OperationNode,
  ParameterLocation,
  ParameterNode,
  PropertyNode,
  RefSchemaNode,
  ResponseNode,
  RootNode,
  ScalarSchemaNode,
  SchemaNode,
  SchemaType,
  SpecialSchemaType,
  StatusCode,
} from '@internals/ast'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema, schemaTypes } from '@internals/ast'
import type { Oas, Operation, SchemaObject } from '@kubb/oas'
import { isNullable, isReference } from '@kubb/oas'

/** Distributive `Omit` that correctly distributes over union types. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/**
 * Single source of truth: ordered list of `[shape, SchemaNode]` pairs.
 * `InferSchemaNode` walks this tuple in order and returns the node type of the first matching entry.
 */
type SchemaNodeMap = [
  [{ $ref: string }, RefSchemaNode],
  [{ allOf: ReadonlyArray<unknown> }, CompositeSchemaNode | SchemaNode],
  [{ oneOf: ReadonlyArray<unknown> }, CompositeSchemaNode],
  [{ anyOf: ReadonlyArray<unknown> }, CompositeSchemaNode],
  [{ const: null }, ScalarSchemaNode],
  [{ const: string | number | boolean }, EnumSchemaNode],
  [{ enum: ReadonlyArray<unknown> }, EnumSchemaNode],
  [{ type: 'object' }, ObjectSchemaNode],
  [{ type: 'array' }, ArraySchemaNode],
  [{ type: string }, ScalarSchemaNode],
]

type InferSchemaNode<T extends SchemaObject, Entries extends ReadonlyArray<[object, SchemaNode]> = SchemaNodeMap> = Entries extends [
  infer Head extends [object, SchemaNode],
  ...infer Tail extends ReadonlyArray<[object, SchemaNode]>,
]
  ? T extends Head[0]
    ? Head[1]
    : InferSchemaNode<T, Tail>
  : SchemaNode

type Options = {
  dateType: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  integerType: 'number' | 'bigint'
  unknownType: 'any' | 'unknown' | 'void'
  emptySchemaType: 'any' | 'unknown' | 'void'
}

const DEFAULT_OPTIONS: Options = {
  dateType: 'string',
  integerType: 'number',
  unknownType: 'unknown',
  emptySchemaType: 'unknown',
}

const FORMAT_MAP: Record<string, SpecialSchemaType> = {
  'date-time': 'datetime',
  date: 'date',
  time: 'time',
  uuid: 'uuid',
  email: 'email',
  uri: 'url',
  url: 'url',
  binary: 'blob',
  byte: 'blob',
}

function formatToSchemaType(format: string): SpecialSchemaType | undefined {
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
export function createOasParser(userOptions?: Partial<Options>) {
  const options: Options = { ...DEFAULT_OPTIONS, ...userOptions }

  function getEmptyType(emptySchemaType: Options['emptySchemaType']): SchemaType {
    if (emptySchemaType === 'any') {
      return schemaTypes.any
    }
    if (emptySchemaType === 'void') {
      return schemaTypes.void
    }

    return schemaTypes.unknown
  }

  function convertSchema<T extends SchemaObject>(schema: T, name?: string): InferSchemaNode<T>
  function convertSchema(schema: SchemaObject, name?: string): SchemaNode {
    const emptyType = getEmptyType(options.emptySchemaType)
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
          pattern: schema.pattern ?? memberNode.pattern,
        } as DistributiveOmit<SchemaNode, 'kind'>)
      }

      return createSchema({
        type: 'intersection',
        name,
        members: schema.allOf.map((s) => convertSchema(s as SchemaObject)),
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
      return createSchema({
        type: 'union',
        name,
        members: unionMembers.map((s) => convertSchema(s as SchemaObject)),
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

    // OAS 3.1 const — a single fixed value, semantically equivalent to a one-item enum.
    // `const: null` maps to the null scalar; `const: undefined` falls through to the empty-type fallback.
    if ('const' in schema) {
      const constValue = schema.const

      if (constValue === null) {
        return createSchema({ type: 'null', name, title: schema.title, description: schema.description, deprecated: schema.deprecated, nullable })
      }

      if (constValue !== undefined) {
        return createSchema({
          type: 'enum',
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

    // Enum
    if (schema.enum?.length) {
      // `null` in enum values is the OAS 3.0 convention for a nullable enum.
      // Detect it, set the nullable flag, and strip it from the actual enum values.
      const nullInEnum = schema.enum.includes(null)
      const filteredEnumValues = nullInEnum ? schema.enum.filter((v) => v !== null) : schema.enum
      const enumNullable = nullable || nullInEnum || undefined
      const enumDefault = schema.default === null && enumNullable ? undefined : schema.default

      return createSchema({
        type: 'enum',
        name,
        enumValues: filteredEnumValues as Array<string | number | boolean | null>,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        nullable: enumNullable,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: enumDefault,
        example: schema.example,
      })
    }

    // Format-based special types (takes precedence over primitive `type`)
    if (schema.format) {
      const specialType = formatToSchemaType(schema.format)

      if (specialType) {
        return createSchema({
          type: specialType,
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
    }

    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    // Object
    if (type === 'object' || schema.properties) {
      const properties: Array<PropertyNode> = schema.properties
        ? Object.entries(schema.properties).map(([propName, propSchema]) => {
            const required = Array.isArray(schema.required) ? schema.required.includes(propName) : false
            const resolvedSchema = propSchema as SchemaObject
            const propNullable = isNullable(resolvedSchema)

            return createProperty({
              name: propName,
              schema: {
                ...convertSchema(resolvedSchema),
                nullable: propNullable || undefined,
                optional: !required && !propNullable ? true : undefined,
                nullish: !required && propNullable ? true : undefined,
              },
              required,
            })
          })
        : []

      return createSchema({
        type: 'object',
        name,
        properties,
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

    // Array
    if (type === 'array') {
      const rawSchema = schema as unknown as { items?: SchemaObject }
      const items = rawSchema.items ? [convertSchema(rawSchema.items)] : []
      return createSchema({
        type: 'array',
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
        default: defaultValue,
        example: schema.example,
      })
    }

    // String
    if (type === 'string') {
      // OAS 3.1: `contentMediaType: 'application/octet-stream'` signals binary data — format overrides type.
      if (schema.contentMediaType === 'application/octet-stream') {
        return createSchema({
          type: 'blob',
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

      return createSchema({
        type: 'string',
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

    // Number — float/double formats are still number; format overrides type per JSON Schema spec.
    if (type === 'number') {
      return createSchema({
        type: schema.format === 'float' || schema.format === 'double' ? 'number' : 'number',
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

    // Integer — int64 may map to bigint depending on the integerType option.
    if (type === 'integer') {
      const integerSchemaType = schema.format === 'int64' && options.integerType === 'bigint' ? 'bigint' : 'integer'

      return createSchema({
        type: integerSchemaType,
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
        name,
        title: schema.title,
        description: schema.description,
        deprecated: schema.deprecated,
        nullable,
      })
    }

    // Fallback
    return createSchema({ type: emptyType, name, title: schema.title, description: schema.description })
  }

  function convertParameter(param: Record<string, unknown>): ParameterNode {
    const schema =
      param['schema'] && !isReference(param['schema'] as object) ? convertSchema(param['schema'] as SchemaObject) : createSchema({ type: 'any' })

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
  function buildAst(oas: Oas): RootNode {
    const { schemas: schemaObjects } = oas.getSchemas()

    const schemas: Array<SchemaNode> = Object.entries(schemaObjects).map(([name, schemaObject]) => convertSchema(schemaObject, name))

    const paths = oas.getPaths()

    const operations: Array<OperationNode> = Object.entries(paths).flatMap(([, methods]) =>
      Object.entries(methods)
        .map(([, operation]) => (operation ? convertOperation(oas, operation as Operation) : null))
        .filter((op): op is OperationNode => op !== null),
    )

    return createRoot({ schemas, operations })
  }

  return { buildAst, convertSchema }
}
