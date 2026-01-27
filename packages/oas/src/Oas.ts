import jsonpointer from 'jsonpointer'
import BaseOas from 'oas'
import { matchesMimeType } from 'oas/utils'
import type { contentType, DiscriminatorObject, Document, MediaTypeObject, Operation, ReferenceObject, ResponseObject, SchemaObject } from './types.ts'
import {
  extractSchemaFromContent,
  flattenSchema,
  isDiscriminator,
  isReference,
  legacyResolve,
  resolveCollisions,
  type SchemaWithMetadata,
  sortSchemas,
  validate,
} from './utils.ts'

type OasOptions = {
  contentType?: contentType
  discriminator?: 'strict' | 'inherit'
  /**
   * Resolve name collisions when schemas from different components share the same name (case-insensitive).
   * @default false
   */
  collisionDetection?: boolean
}

export class Oas extends BaseOas {
  #options: OasOptions = {
    discriminator: 'strict',
  }
  document: Document

  constructor(document: Document) {
    super(document, undefined)

    this.document = document
  }

  setOptions(options: OasOptions) {
    this.#options = {
      ...this.#options,
      ...options,
    }

    if (this.#options.discriminator === 'inherit') {
      this.#applyDiscriminatorInheritance()
    }
  }

  get options(): OasOptions {
    return this.#options
  }

  get<T = unknown>($ref: string): T | null {
    const origRef = $ref
    $ref = $ref.trim()
    if ($ref === '') {
      return null
    }
    if ($ref.startsWith('#')) {
      $ref = globalThis.decodeURIComponent($ref.substring(1))
    } else {
      return null
    }
    const current = jsonpointer.get(this.api, $ref)

    if (!current) {
      throw new Error(`Could not find a definition for ${origRef}.`)
    }
    return current
  }

  getKey($ref: string) {
    const key = $ref.split('/').pop()
    return key === '' ? undefined : key
  }
  set($ref: string, value: unknown) {
    $ref = $ref.trim()
    if ($ref === '') {
      return false
    }
    if ($ref.startsWith('#')) {
      $ref = globalThis.decodeURIComponent($ref.substring(1))

      jsonpointer.set(this.api, $ref, value)
    }
  }

  #setDiscriminator(schema: SchemaObject & { discriminator: DiscriminatorObject }): void {
    const { mapping = {}, propertyName } = schema.discriminator

    if (this.#options.discriminator === 'inherit') {
      Object.entries(mapping).forEach(([mappingKey, mappingValue]) => {
        if (mappingValue) {
          const childSchema = this.get<any>(mappingValue)
          if (!childSchema) {
            return
          }

          if (!childSchema.properties) {
            childSchema.properties = {}
          }

          const property = childSchema.properties[propertyName] as SchemaObject

          if (childSchema.properties) {
            childSchema.properties[propertyName] = {
              ...((childSchema.properties ? childSchema.properties[propertyName] : {}) as SchemaObject),
              enum: [...(property?.enum?.filter((value) => value !== mappingKey) ?? []), mappingKey],
            }

            childSchema.required =
              typeof childSchema.required === 'boolean' ? childSchema.required : [...new Set([...(childSchema.required ?? []), propertyName])]

            this.set(mappingValue, childSchema)
          }
        }
      })
    }
  }

  getDiscriminator(schema: SchemaObject | null): DiscriminatorObject | null {
    if (!isDiscriminator(schema) || !schema) {
      return null
    }

    const { mapping = {}, propertyName } = schema.discriminator

    /**
     * Helper to extract discriminator value from a schema.
     * Checks in order:
     * 1. Extension property matching propertyName (e.g., x-linode-ref-name)
     * 2. Property with const value
     * 3. Property with single enum value
     * 4. Title as fallback
     */
    const getDiscriminatorValue = (schema: SchemaObject | null): string | null => {
      if (!schema) {
        return null
      }

      // Check extension properties first (e.g., x-linode-ref-name)
      // Only check if propertyName starts with 'x-' to avoid conflicts with standard properties
      if (propertyName.startsWith('x-')) {
        const extensionValue = (schema as Record<string, unknown>)[propertyName]
        if (extensionValue && typeof extensionValue === 'string') {
          return extensionValue
        }
      }

      // Check if property has const value
      const propertySchema = schema.properties?.[propertyName] as SchemaObject
      if (propertySchema && 'const' in propertySchema && propertySchema.const !== undefined) {
        return String(propertySchema.const)
      }

      // Check if property has single enum value
      if (propertySchema && propertySchema.enum?.length === 1) {
        return String(propertySchema.enum[0])
      }

      // Fallback to title if available
      return schema.title || null
    }

    /**
     * Process oneOf/anyOf items to build mapping.
     * Handles both $ref and inline schemas.
     */
    const processSchemas = (schemas: Array<SchemaObject>, existingMapping: Record<string, string>) => {
      schemas.forEach((schemaItem, index) => {
        if (isReference(schemaItem)) {
          // Handle $ref case
          const key = this.getKey(schemaItem.$ref)

          try {
            const refSchema = this.get<SchemaObject>(schemaItem.$ref)
            const discriminatorValue = getDiscriminatorValue(refSchema)
            const canAdd = key && !Object.values(existingMapping).includes(schemaItem.$ref)

            if (canAdd && discriminatorValue) {
              existingMapping[discriminatorValue] = schemaItem.$ref
            } else if (canAdd) {
              existingMapping[key] = schemaItem.$ref
            }
          } catch (_error) {
            // If we can't resolve the reference, skip it and use the key as fallback
            if (key && !Object.values(existingMapping).includes(schemaItem.$ref)) {
              existingMapping[key] = schemaItem.$ref
            }
          }
        } else {
          // Handle inline schema case
          const inlineSchema = schemaItem as SchemaObject
          const discriminatorValue = getDiscriminatorValue(inlineSchema)

          if (discriminatorValue) {
            // Create a synthetic ref for inline schemas using index
            // The value points to the inline schema itself via a special marker
            existingMapping[discriminatorValue] = `#kubb-inline-${index}`
          }
        }
      })
    }

    // Process oneOf schemas
    if (schema.oneOf) {
      processSchemas(schema.oneOf as Array<SchemaObject>, mapping)
    }

    // Process anyOf schemas
    if (schema.anyOf) {
      processSchemas(schema.anyOf as Array<SchemaObject>, mapping)
    }

    return {
      ...schema.discriminator,
      mapping,
    }
  }

  // TODO add better typing
  dereferenceWithRef<T = unknown>(schema?: T): T {
    if (isReference(schema)) {
      return {
        ...schema,
        ...this.get(schema.$ref),
        $ref: schema.$ref,
      }
    }

    return schema as T
  }

  #applyDiscriminatorInheritance() {
    const components = this.api.components
    if (!components?.schemas) {
      return
    }

    const visited = new WeakSet<object>()
    const enqueue = (value: unknown) => {
      if (!value) {
        return
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          enqueue(item)
        }
        return
      }

      if (typeof value === 'object') {
        visit(value as SchemaObject)
      }
    }

    const visit = (schema?: SchemaObject | ReferenceObject | null) => {
      if (!schema || typeof schema !== 'object') {
        return
      }

      if (isReference(schema)) {
        visit(this.get(schema.$ref) as SchemaObject)
        return
      }

      const schemaObject = schema as SchemaObject

      if (visited.has(schemaObject as object)) {
        return
      }

      visited.add(schemaObject as object)

      if (isDiscriminator(schemaObject)) {
        this.#setDiscriminator(schemaObject)
      }

      if ('allOf' in schemaObject) {
        enqueue(schemaObject.allOf)
      }
      if ('oneOf' in schemaObject) {
        enqueue(schemaObject.oneOf)
      }
      if ('anyOf' in schemaObject) {
        enqueue(schemaObject.anyOf)
      }
      if ('not' in schemaObject) {
        enqueue(schemaObject.not)
      }
      if ('items' in schemaObject) {
        enqueue(schemaObject.items)
      }
      if ('prefixItems' in schemaObject) {
        enqueue(schemaObject.prefixItems)
      }

      if (schemaObject.properties) {
        enqueue(Object.values(schemaObject.properties))
      }

      if (schemaObject.additionalProperties && typeof schemaObject.additionalProperties === 'object') {
        enqueue(schemaObject.additionalProperties)
      }
    }

    for (const schema of Object.values(components.schemas)) {
      visit(schema as SchemaObject)
    }
  }

  /**
   * Oas does not have a getResponseBody(contentType)
   */
  #getResponseBodyFactory(responseBody: boolean | ResponseObject): (contentType?: string) => MediaTypeObject | false | [string, MediaTypeObject, ...string[]] {
    function hasResponseBody(res = responseBody): res is ResponseObject {
      return !!res
    }

    return (contentType) => {
      if (!hasResponseBody(responseBody)) {
        return false
      }

      if (isReference(responseBody)) {
        // If the request body is still a `$ref` pointer we should return false because this library
        // assumes that you've run dereferencing beforehand.
        return false
      }

      if (!responseBody.content) {
        return false
      }

      if (contentType) {
        if (!(contentType in responseBody.content)) {
          return false
        }

        return responseBody.content[contentType]!
      }

      // Since no media type was supplied we need to find either the first JSON-like media type that
      // we've got, or the first available of anything else if no JSON-like media types are present.
      let availableContentType: string | undefined
      const contentTypes = Object.keys(responseBody.content)
      contentTypes.forEach((mt: string) => {
        if (!availableContentType && matchesMimeType.json(mt)) {
          availableContentType = mt
        }
      })

      if (!availableContentType) {
        contentTypes.forEach((mt: string) => {
          if (!availableContentType) {
            availableContentType = mt
          }
        })
      }

      if (availableContentType) {
        return [availableContentType, responseBody.content[availableContentType]!, ...(responseBody.description ? [responseBody.description] : [])]
      }

      return false
    }
  }

  getResponseSchema(operation: Operation, statusCode: string | number): SchemaObject {
    if (operation.schema.responses) {
      Object.keys(operation.schema.responses).forEach((key) => {
        const schema = operation.schema.responses![key]
        const $ref = isReference(schema) ? schema.$ref : undefined

        if (schema && $ref) {
          operation.schema.responses![key] = this.get<any>($ref)
        }
      })
    }

    const getResponseBody = this.#getResponseBodyFactory(operation.getResponseByStatusCode(statusCode))

    const { contentType } = this.#options
    const responseBody = getResponseBody(contentType)

    if (responseBody === false) {
      // return empty object because response will always be defined(request does not need a body)
      return {}
    }

    const schema = Array.isArray(responseBody) ? responseBody[1].schema : responseBody.schema

    if (!schema) {
      // return empty object because response will always be defined(request does not need a body)

      return {}
    }

    return this.dereferenceWithRef(schema)
  }

  getRequestSchema(operation: Operation): SchemaObject | undefined {
    const { contentType } = this.#options

    if (operation.schema.requestBody) {
      operation.schema.requestBody = this.dereferenceWithRef(operation.schema.requestBody)
    }

    const requestBody = operation.getRequestBody(contentType)

    if (requestBody === false) {
      return undefined
    }

    const schema = Array.isArray(requestBody) ? requestBody[1].schema : requestBody.schema

    if (!schema) {
      return undefined
    }

    return this.dereferenceWithRef(schema)
  }

  getParametersSchema(operation: Operation, inKey: 'path' | 'query' | 'header'): SchemaObject | null {
    const { contentType = operation.getContentType() } = this.#options
    const params = operation
      .getParameters()
      .map((schema) => {
        return this.dereferenceWithRef(schema)
      })
      .filter((v) => v.in === inKey)

    if (!params.length) {
      return null
    }

    return params.reduce(
      (schema, pathParameters) => {
        const property = (pathParameters.content?.[contentType]?.schema ?? (pathParameters.schema as SchemaObject)) as SchemaObject | null
        const required =
          typeof schema.required === 'boolean'
            ? schema.required
            : [...(schema.required || []), pathParameters.required ? pathParameters.name : undefined].filter(Boolean)

        // Handle explode=true with style=form for object with additionalProperties
        // According to OpenAPI spec, when explode is true, object properties are flattened
        const getDefaultStyle = (location: string): string => {
          if (location === 'query') return 'form'
          if (location === 'path') return 'simple'
          return 'simple'
        }
        const style = pathParameters.style || getDefaultStyle(inKey)
        const explode = pathParameters.explode !== undefined ? pathParameters.explode : style === 'form'

        if (
          inKey === 'query' &&
          style === 'form' &&
          explode === true &&
          property?.type === 'object' &&
          property?.additionalProperties &&
          !property?.properties
        ) {
          // When explode is true for an object with only additionalProperties,
          // flatten it to the root level by merging additionalProperties with existing schema.
          // This preserves other query parameters while allowing dynamic key-value pairs.
          return {
            ...schema,
            description: pathParameters.description || schema.description,
            deprecated: schema.deprecated,
            example: property.example || schema.example,
            additionalProperties: property.additionalProperties,
          } as SchemaObject
        }

        return {
          ...schema,
          description: schema.description,
          deprecated: schema.deprecated,
          example: schema.example,
          required,
          properties: {
            ...schema.properties,
            [pathParameters.name]: {
              description: pathParameters.description,
              ...property,
            },
          },
        } as SchemaObject
      },
      { type: 'object', required: [], properties: {} } as SchemaObject,
    )
  }

  async validate() {
    return validate(this.api)
  }

  flattenSchema(schema: SchemaObject | null): SchemaObject | null {
    return flattenSchema(schema)
  }

  /**
   * Get schemas from OpenAPI components (schemas, responses, requestBodies).
   * Returns schemas in dependency order along with name mapping for collision resolution.
   */
  getSchemas(options: { contentType?: contentType; includes?: Array<'schemas' | 'responses' | 'requestBodies'>; collisionDetection?: boolean } = {}): {
    schemas: Record<string, SchemaObject>
    nameMapping: Map<string, string>
  } {
    const contentType = options.contentType ?? this.#options.contentType
    const includes = options.includes ?? ['schemas', 'requestBodies', 'responses']
    const shouldResolveCollisions = options.collisionDetection ?? this.#options.collisionDetection ?? false

    const components = this.getDefinition().components
    const schemasWithMeta: SchemaWithMetadata[] = []

    // Collect schemas from components
    if (includes.includes('schemas')) {
      const componentSchemas = (components?.schemas as Record<string, SchemaObject>) || {}
      for (const [name, schema] of Object.entries(componentSchemas)) {
        schemasWithMeta.push({ schema, source: 'schemas', originalName: name })
      }
    }

    if (includes.includes('responses')) {
      const responses = components?.responses || {}
      for (const [name, response] of Object.entries(responses)) {
        const responseObject = response as ResponseObject
        const schema = extractSchemaFromContent(responseObject.content, contentType)
        if (schema) {
          schemasWithMeta.push({ schema, source: 'responses', originalName: name })
        }
      }
    }

    if (includes.includes('requestBodies')) {
      const requestBodies = components?.requestBodies || {}
      for (const [name, request] of Object.entries(requestBodies)) {
        const requestObject = request as { content?: Record<string, unknown> }
        const schema = extractSchemaFromContent(requestObject.content, contentType)
        if (schema) {
          schemasWithMeta.push({ schema, source: 'requestBodies', originalName: name })
        }
      }
    }

    // Apply collision resolution only if enabled
    const { schemas, nameMapping } = shouldResolveCollisions ? resolveCollisions(schemasWithMeta) : legacyResolve(schemasWithMeta)

    return {
      schemas: sortSchemas(schemas),
      nameMapping,
    }
  }
}
