import { pascalCase } from '@kubb/core/transformers'
import jsonpointer from 'jsonpointer'
import BaseOas from 'oas'
import { matchesMimeType } from 'oas/utils'
import type { contentType, DiscriminatorObject, Document, MediaTypeObject, Operation, ReferenceObject, ResponseObject, SchemaObject } from './types.ts'
import { isDiscriminator, isReference, STRUCTURAL_KEYS } from './utils.ts'

type OasOptions = {
  contentType?: contentType
  discriminator?: 'strict' | 'inherit'
  /**
   * Resolve name collisions when schemas from different components share the same name (case-insensitive).
   * @default false
   */
  resolveNameCollisions?: boolean
}

type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies'

type SchemaWithMetadata = {
  schema: SchemaObject
  source: SchemaSourceMode
  originalName: string
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
    const OASNormalize = await import('oas-normalize').then((m) => m.default)
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

  flattenSchema(schema: SchemaObject | null): SchemaObject | null {
    if (!schema?.allOf || schema.allOf.length === 0) {
      return schema || null
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

  /**
   * Sort schemas topologically so referenced schemas appear first.
   */
  sortSchemas(schemas: Record<string, SchemaObject>): Record<string, SchemaObject> {
    const deps = new Map<string, string[]>()

    for (const [name, schema] of Object.entries(schemas)) {
      deps.set(name, Array.from(this.#collectRefs(schema)))
    }

    const sorted: string[] = []
    const visited = new Set<string>()

    function visit(name: string, stack = new Set<string>()) {
      if (visited.has(name)) {
        return
      }
      if (stack.has(name)) {
        return
      } // circular refs, ignore
      stack.add(name)
      const children = deps.get(name) || []
      for (const child of children) {
        if (deps.has(child)) {
          visit(child, stack)
        }
      }
      stack.delete(name)
      visited.add(name)
      sorted.push(name)
    }

    for (const name of Object.keys(schemas)) {
      visit(name)
    }

    const sortedSchemas: Record<string, SchemaObject> = {}
    for (const name of sorted) {
      sortedSchemas[name] = schemas[name]!
    }
    return sortedSchemas
  }

  /**
   * Get semantic suffix for a schema source.
   */
  #getSemanticSuffix(source: SchemaSourceMode): string {
    switch (source) {
      case 'schemas':
        return 'Schema'
      case 'responses':
        return 'Response'
      case 'requestBodies':
        return 'Request'
    }
  }

  #collectRefs(schema: unknown, refs = new Set<string>()): Set<string> {
    if (Array.isArray(schema)) {
      for (const item of schema) {
        this.#collectRefs(item, refs)
      }
      return refs
    }

    if (schema && typeof schema === 'object') {
      for (const [key, value] of Object.entries(schema)) {
        if (key === '$ref' && typeof value === 'string') {
          const match = value.match(/^#\/components\/schemas\/(.+)$/)
          if (match) {
            refs.add(match[1]!)
          }
        } else {
          this.#collectRefs(value, refs)
        }
      }
    }

    return refs
  }

  /**
   * Resolve name collisions by applying suffixes based on collision type.
   *
   * Strategy:
   * - Same-component collisions (e.g., "Variant" + "variant" both in schemas): numeric suffixes (Variant, Variant2)
   * - Cross-component collisions (e.g., "Pet" in schemas + "Pet" in requestBodies): semantic suffixes (PetSchema, PetRequest)
   */
  #resolveCollisions(schemasWithMeta: SchemaWithMetadata[]): { schemas: Record<string, SchemaObject>; nameMapping: Map<string, string> } {
    const schemas: Record<string, SchemaObject> = {}
    const nameMapping = new Map<string, string>()
    const normalizedNames = new Map<string, SchemaWithMetadata[]>()

    // Group schemas by normalized (PascalCase) name for collision detection
    for (const item of schemasWithMeta) {
      const normalized = pascalCase(item.originalName)
      if (!normalizedNames.has(normalized)) {
        normalizedNames.set(normalized, [])
      }
      normalizedNames.get(normalized)!.push(item)
    }

    // Process each collision group
    for (const [, items] of normalizedNames) {
      if (items.length === 1) {
        // No collision, use original name
        const item = items[0]!
        schemas[item.originalName] = item.schema
        // Map using full $ref path: #/components/{source}/{originalName}
        const refPath = `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, item.originalName)
        continue
      }

      // Multiple schemas normalize to same name - resolve collision
      const sources = new Set(items.map((item) => item.source))

      if (sources.size === 1) {
        // Same-component collision: add numeric suffixes
        // Preserve original order from OpenAPI spec for deterministic behavior
        items.forEach((item, index) => {
          const suffix = index === 0 ? '' : (index + 1).toString()
          const uniqueName = item.originalName + suffix
          schemas[uniqueName] = item.schema
          // Map using full $ref path: #/components/{source}/{originalName}
          const refPath = `#/components/${item.source}/${item.originalName}`
          nameMapping.set(refPath, uniqueName)
        })
      } else {
        // Cross-component collision: add semantic suffixes
        // Preserve original order from OpenAPI spec for deterministic behavior
        items.forEach((item) => {
          const suffix = this.#getSemanticSuffix(item.source)
          const uniqueName = item.originalName + suffix
          schemas[uniqueName] = item.schema
          // Map using full $ref path: #/components/{source}/{originalName}
          const refPath = `#/components/${item.source}/${item.originalName}`
          nameMapping.set(refPath, uniqueName)
        })
      }
    }

    return { schemas, nameMapping }
  }

  /**
   * Extract schema from content object (used by responses and requestBodies).
   * Returns null if the schema is just a $ref (not a unique type definition).
   */
  #extractSchemaFromContent(content: Record<string, unknown> | undefined, preferredContentType?: contentType): SchemaObject | null {
    if (!content) {
      return null
    }
    const firstContentType = Object.keys(content)[0] || 'application/json'
    const targetContentType = preferredContentType || firstContentType
    const contentSchema = content[targetContentType] as { schema?: SchemaObject } | undefined
    const schema = contentSchema?.schema

    // Skip schemas that are just references - they don't define unique types
    if (schema && '$ref' in schema) {
      return null
    }

    return schema || null
  }

  /**
   * Legacy resolution strategy - no collision detection, just use original names.
   * This preserves backward compatibility when resolveNameCollisions is false.
   */
  #legacyResolve(schemasWithMeta: SchemaWithMetadata[]): { schemas: Record<string, SchemaObject>; nameMapping: Map<string, string> } {
    const schemas: Record<string, SchemaObject> = {}
    const nameMapping = new Map<string, string>()

    // Simply use original names without collision detection
    for (const item of schemasWithMeta) {
      schemas[item.originalName] = item.schema
      // Map using full $ref path for consistency
      const refPath = `#/components/${item.source}/${item.originalName}`
      nameMapping.set(refPath, item.originalName)
    }

    return { schemas, nameMapping }
  }

  /**
   * Get schemas from OpenAPI components (schemas, responses, requestBodies).
   * Returns schemas in dependency order along with name mapping for collision resolution.
   */
  getSchemas(options: { contentType?: contentType; includes?: Array<'schemas' | 'responses' | 'requestBodies'>; resolveNameCollisions?: boolean } = {}): {
    schemas: Record<string, SchemaObject>
    nameMapping: Map<string, string>
  } {
    const contentType = options.contentType ?? this.#options.contentType
    const includes = options.includes ?? ['schemas', 'requestBodies', 'responses']
    const shouldResolveCollisions = options.resolveNameCollisions ?? this.#options.resolveNameCollisions ?? false

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
        const schema = this.#extractSchemaFromContent(responseObject.content, contentType)
        if (schema) {
          schemasWithMeta.push({ schema, source: 'responses', originalName: name })
        }
      }
    }

    if (includes.includes('requestBodies')) {
      const requestBodies = components?.requestBodies || {}
      for (const [name, request] of Object.entries(requestBodies)) {
        const requestObject = request as { content?: Record<string, unknown> }
        const schema = this.#extractSchemaFromContent(requestObject.content, contentType)
        if (schema) {
          schemasWithMeta.push({ schema, source: 'requestBodies', originalName: name })
        }
      }
    }

    // Apply collision resolution only if enabled
    const { schemas, nameMapping } = shouldResolveCollisions ? this.#resolveCollisions(schemasWithMeta) : this.#legacyResolve(schemasWithMeta)

    return {
      schemas: this.sortSchemas(schemas),
      nameMapping,
    }
  }
}
