import jsonpointer from 'jsonpointer'
import BaseOas from 'oas'
import type { Operation } from 'oas/operation'
import type { MediaTypeObject, OASDocument, ResponseObject, SchemaObject, User } from 'oas/types'
import { matchesMimeType } from 'oas/utils'
import OASNormalize from 'oas-normalize'
import type { OpenAPIV3 } from 'openapi-types'
import type { OasTypes } from './index.ts'
import type { contentType } from './types.ts'
import { isDiscriminator, isReference, STRUCTURAL_KEYS } from './utils.ts'

type Options = {
  contentType?: contentType
  discriminator?: 'strict' | 'inherit'
}

export class Oas<const TOAS = unknown> extends BaseOas {
  #options: Options = {
    discriminator: 'strict',
  }
  document: TOAS = undefined as unknown as TOAS

  constructor({ oas, user }: { oas: TOAS | OASDocument | string; user?: User }) {
    if (typeof oas === 'string') {
      oas = JSON.parse(oas)
    }

    super(oas as OASDocument, user)

    this.document = oas as TOAS
  }

  setOptions(options: Options) {
    this.#options = {
      ...this.#options,
      ...options,
    }

    if (this.#options.discriminator === 'inherit') {
      this.#applyDiscriminatorInheritance()
    }
  }

  get options(): Options {
    return this.#options
  }

  get($ref: string): any | null {
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

  #setDiscriminator(schema: OasTypes.SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject }): void {
    const { mapping = {}, propertyName } = schema.discriminator

    if (this.#options.discriminator === 'inherit') {
      Object.entries(mapping).forEach(([mappingKey, mappingValue]) => {
        if (mappingValue) {
          const childSchema = this.get(mappingValue)
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

  getDiscriminator(schema: OasTypes.SchemaObject): OpenAPIV3.DiscriminatorObject | undefined {
    if (!isDiscriminator(schema)) {
      return undefined
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
    const getDiscriminatorValue = (schemaObj: SchemaObject): string | undefined => {
      // Check extension properties first (e.g., x-linode-ref-name)
      // Only check if propertyName starts with 'x-' to avoid conflicts with standard properties
      if (propertyName.startsWith('x-')) {
        const extensionValue = (schemaObj as Record<string, unknown>)[propertyName]
        if (extensionValue && typeof extensionValue === 'string') {
          return extensionValue
        }
      }

      // Check if property has const value
      const propertySchema = schemaObj.properties?.[propertyName] as SchemaObject
      if ('const' in propertySchema && propertySchema?.const !== undefined) {
        return String(propertySchema.const)
      }

      // Check if property has single enum value
      if (propertySchema?.enum?.length === 1) {
        return String(propertySchema.enum[0])
      }

      // Fallback to title if available
      return schemaObj.title
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
            const refSchema: OpenAPIV3.SchemaObject = this.get(schemaItem.$ref)
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
          const inlineSchema = schemaItem as OpenAPIV3.SchemaObject
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
  dereferenceWithRef(schema?: unknown) {
    if (isReference(schema)) {
      return {
        ...schema,
        ...this.get(schema.$ref),
        $ref: schema.$ref,
      }
    }

    return schema
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

    const visit = (schema?: SchemaObject | OpenAPIV3.ReferenceObject | null) => {
      if (!schema || typeof schema !== 'object') {
        return
      }

      if (isReference(schema)) {
        visit(this.get(schema.$ref) as OpenAPIV3.SchemaObject)
        return
      }

      const schemaObject = schema as OpenAPIV3.SchemaObject

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
      let availablecontentType: string | undefined
      const contentTypes = Object.keys(responseBody.content)
      contentTypes.forEach((mt: string) => {
        if (!availablecontentType && matchesMimeType.json(mt)) {
          availablecontentType = mt
        }
      })

      if (!availablecontentType) {
        contentTypes.forEach((mt: string) => {
          if (!availablecontentType) {
            availablecontentType = mt
          }
        })
      }

      if (availablecontentType) {
        return [availablecontentType, responseBody.content[availablecontentType]!, ...(responseBody.description ? [responseBody.description] : [])]
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
          operation.schema.responses![key] = this.get($ref)
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
        const property = pathParameters.content?.[contentType]?.schema ?? (pathParameters.schema as SchemaObject)
        const required = [...(schema.required || []), pathParameters.required ? pathParameters.name : undefined].filter(Boolean)

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
          }
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
        }
      },
      { type: 'object', required: [], properties: {} } as SchemaObject,
    )
  }

  async valdiate() {
    const oasNormalize = new OASNormalize(this.api, {
      enablePaths: true,
      colorizeErrors: true,
    })

    return oasNormalize.validate({
      parser: {
        validate: {
          errors: {
            colorize: true,
          },
        },
      },
    })
  }

  flattenSchema(schema?: SchemaObject): SchemaObject | undefined {
    if (!schema?.allOf || schema.allOf.length === 0) {
      return schema
    }

    // Never touch ref-based or structural composition
    if (schema.allOf.some((item) => isReference(item))) {
      return schema
    }

    const isPlainFragment = (item: SchemaObject) => !Object.keys(item).some((key) => STRUCTURAL_KEYS.has(key))

    // Only flatten keyword-only fragments
    if (!schema.allOf.every((item) => isPlainFragment(item as SchemaObject))) {
      return schema
    }

    const merged: SchemaObject = { ...schema }
    delete merged.allOf

    for (const fragment of schema.allOf as SchemaObject[]) {
      for (const [key, value] of Object.entries(fragment)) {
        if (merged[key as keyof typeof merged] === undefined) {
          merged[key as keyof typeof merged] = value
        }
      }
    }

    return merged
  }
}
