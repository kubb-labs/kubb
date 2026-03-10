import type {
  HttpMethod,
  MediaType,
  OperationNode,
  ParameterLocation,
  ParameterNode,
  PropertyNode,
  ResponseNode,
  RootNode,
  SchemaNode,
  SpecialSchemaType,
  StatusCode,
} from '@internals/ast'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema } from '@internals/ast'
import type { Oas, Operation, SchemaObject } from '@kubb/oas'
import { isReference } from '@kubb/oas'

/**
 * Converts an OpenAPI/Swagger spec (wrapped in a Kubb `Oas` instance) into
 * a `RootNode` — the top-level node of the `@internals/ast` tree.
 *
 * This is the **kubb-parser** stage of the compilation lifecycle:
 *   OpenAPI / Swagger  →  Kubb AST
 *
 * No code is generated here; the resulting tree is spec-agnostic and can
 * be consumed by any downstream plugin (plugin-ts, plugin-zod, …).
 */
export function buildAst(oas: Oas): RootNode {
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

function convertParameter(param: Record<string, unknown>): ParameterNode {
  const schema = param['schema'] && !isReference(param['schema'] as object) ? convertSchema(param['schema'] as SchemaObject) : createSchema({ type: 'any' })

  return createParameter({
    name: param['name'] as string,
    in: param['in'] as ParameterLocation,
    schema,
    required: (param['required'] as boolean | undefined) ?? false,
    description: param['description'] as string | undefined,
    deprecated: param['deprecated'] as boolean | undefined,
  })
}

export function convertSchema(schema: SchemaObject, name?: string): SchemaNode {
  // $ref — the schema is a pointer to another definition
  if (isReference(schema)) {
    return createSchema({
      type: 'ref',
      name,
      ref: extractRefName((schema as unknown as { $ref: string }).$ref),
    })
  }

  // Composition: allOf → intersection
  if (schema.allOf?.length) {
    return createSchema({
      type: 'intersection',
      name,
      members: schema.allOf.map((s) => convertSchema(s as SchemaObject)),
      description: schema.description,
      deprecated: schema.deprecated,
      nullable: schema.nullable,
    })
  }

  // Composition: oneOf / anyOf → union
  const unionMembers = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
  if (unionMembers.length) {
    return createSchema({
      type: 'union',
      name,
      members: unionMembers.map((s) => convertSchema(s as SchemaObject)),
      description: schema.description,
      deprecated: schema.deprecated,
      nullable: schema.nullable,
    })
  }

  // Enum
  if (schema.enum?.length) {
    return createSchema({
      type: 'enum',
      name,
      enumValues: schema.enum as Array<string | number | boolean | null>,
      description: schema.description,
      deprecated: schema.deprecated,
      nullable: schema.nullable,
    })
  }

  // Format-based special types (takes precedence over primitive `type`)
  if (schema.format) {
    const specialType = formatToSchemaType(schema.format)
    if (specialType) {
      return createSchema({
        type: specialType,
        name,
        nullable: schema.nullable,
        description: schema.description,
        deprecated: schema.deprecated,
        readOnly: schema.readOnly,
        writeOnly: schema.writeOnly,
        default: schema.default,
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
          const resolvedProp = propSchema as SchemaObject
          return createProperty({
            name: propName,
            schema: convertSchema(resolvedProp),
            required,
            description: resolvedProp.description,
            readOnly: resolvedProp.readOnly,
            writeOnly: resolvedProp.writeOnly,
            deprecated: resolvedProp.deprecated,
          })
        })
      : []

    return createSchema({
      type: 'object',
      name,
      properties,
      nullable: schema.nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      default: schema.default,
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
      nullable: schema.nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      minLength: schema.minItems,
      maxLength: schema.maxItems,
      default: schema.default,
      example: schema.example,
    })
  }

  // String
  if (type === 'string') {
    return createSchema({
      type: 'string',
      name,
      nullable: schema.nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      default: schema.default,
      example: schema.example,
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      pattern: schema.pattern,
    })
  }

  // Number
  if (type === 'number') {
    return createSchema({
      type: 'number',
      name,
      nullable: schema.nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      default: schema.default,
      example: schema.example,
      minimum: schema.minimum,
      maximum: schema.maximum,
      exclusiveMinimum: typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined,
      exclusiveMaximum: typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum : undefined,
    })
  }

  // Integer
  if (type === 'integer') {
    return createSchema({
      type: 'integer',
      name,
      nullable: schema.nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      default: schema.default,
      example: schema.example,
      minimum: schema.minimum,
      maximum: schema.maximum,
    })
  }

  // Boolean
  if (type === 'boolean') {
    return createSchema({
      type: 'boolean',
      name,
      nullable: schema.nullable,
      description: schema.description,
      deprecated: schema.deprecated,
      default: schema.default,
      example: schema.example,
    })
  }

  // Null
  if (type === 'null') {
    return createSchema({ type: 'null', name })
  }

  // Fallback
  return createSchema({ type: 'any', name, description: schema.description })
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
