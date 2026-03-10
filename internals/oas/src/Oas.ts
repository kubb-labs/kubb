import { validate as scalarValidate } from '@scalar/openapi-parser'
import jsonpointer from 'jsonpointer'
import BaseOas from 'oas'
import type { Operation } from 'oas/operation'
import type { OASDocument, MediaTypeObject as OASMediaTypeObject, ResponseObject as OASResponseObject } from 'oas/types'
import { matchesMimeType } from 'oas/utils'
import type { OpenAPIV3 } from 'openapi-types'
import {
  collectExtRefs,
  type contentType,
  deriveNameFromExtRef,
  extractSchemaFromContent,
  isDiscriminator,
  isPathItem,
  isReference,
  legacyResolve,
  type ParameterObject,
  resolveCollisions,
  type SchemaObject,
  type SchemaWithMetadata,
  sortSchemas,
} from './utils.ts'

export const KUBB_INLINE_REF_PREFIX = '#kubb-inline-'

type Document = OASDocument
type ResponseObject = OASResponseObject
type MediaTypeObject = OASMediaTypeObject
type DiscriminatorObject = OpenAPIV3.DiscriminatorObject
type ReferenceObject = OpenAPIV3.ReferenceObject

type OasOptions = {
  contentType?: contentType
  discriminator?: 'strict' | 'inherit'
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
    return current as T
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

    const getDiscriminatorValue = (schema: SchemaObject | null): string | null => {
      if (!schema) {
        return null
      }

      if (propertyName.startsWith('x-')) {
        const extensionValue = (schema as Record<string, unknown>)[propertyName]
        if (extensionValue && typeof extensionValue === 'string') {
          return extensionValue
        }
      }

      const propertySchema = schema.properties?.[propertyName] as SchemaObject
      if (propertySchema && 'const' in propertySchema && propertySchema.const !== undefined) {
        return String(propertySchema.const)
      }

      if (propertySchema && propertySchema.enum?.length === 1) {
        return String(propertySchema.enum[0])
      }

      return schema.title || null
    }

    const processSchemas = (schemas: Array<SchemaObject>, existingMapping: Record<string, string>) => {
      schemas.forEach((schemaItem, index) => {
        if (isReference(schemaItem)) {
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
            if (key && !Object.values(existingMapping).includes(schemaItem.$ref)) {
              existingMapping[key] = schemaItem.$ref
            }
          }
        } else {
          const inlineSchema = schemaItem as SchemaObject
          const discriminatorValue = getDiscriminatorValue(inlineSchema)

          if (discriminatorValue) {
            existingMapping[discriminatorValue] = `${KUBB_INLINE_REF_PREFIX}${index}`
          }
        }
      })
    }

    if (schema.oneOf) {
      processSchemas(schema.oneOf as Array<SchemaObject>, mapping)
    }

    if (schema.anyOf) {
      processSchemas(schema.anyOf as Array<SchemaObject>, mapping)
    }

    return {
      ...schema.discriminator,
      mapping,
    }
  }

  dereferenceWithRef<T = unknown>(schema?: T): T {
    if (isReference(schema)) {
      return {
        ...schema,
        ...this.get((schema as ReferenceObject).$ref),
        $ref: (schema as ReferenceObject).$ref,
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
        visit(this.get((schema as ReferenceObject).$ref) as SchemaObject)
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

  #getResponseBodyFactory(responseBody: boolean | ResponseObject): (contentType?: string) => MediaTypeObject | false | [string, MediaTypeObject, ...string[]] {
    function hasResponseBody(res = responseBody): res is ResponseObject {
      return !!res
    }

    return (contentType) => {
      if (!hasResponseBody(responseBody)) {
        return false
      }

      if (isReference(responseBody)) {
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
        const $ref = isReference(schema) ? (schema as ReferenceObject).$ref : undefined

        if (schema && $ref) {
          operation.schema.responses![key] = this.get<any>($ref)
        }
      })
    }

    const getResponseBody = this.#getResponseBodyFactory(operation.getResponseByStatusCode(statusCode))

    const { contentType } = this.#options
    const responseBody = getResponseBody(contentType)

    if (responseBody === false) {
      return {}
    }

    const schema = Array.isArray(responseBody) ? responseBody[1].schema : responseBody.schema

    if (!schema) {
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
    const { valid, errors } = await scalarValidate(this.api as Document)
    if (!valid) {
      throw new Error(errors?.map((e) => e.message).join('\n'))
    }
    return { valid, errors }
  }

  flattenSchema(schema: SchemaObject | null): SchemaObject | null {
    if (!schema?.allOf || schema.allOf.length === 0) {
      return schema || null
    }

    const STRUCTURAL_KEYS = new Set(['properties', 'items', 'additionalProperties', 'oneOf', 'anyOf', 'allOf', 'not'])

    if (schema.allOf.some((item) => isReference(item))) {
      return schema
    }

    const isPlainFragment = (item: SchemaObject) => !Object.keys(item).some((key) => STRUCTURAL_KEYS.has(key))

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
   * Get schemas from OpenAPI components (schemas, responses, requestBodies, parameters)
   * and bundled external references (x-ext).
   * Returns schemas in dependency order along with name mapping for collision resolution.
   */
  getSchemas(
    options: {
      contentType?: contentType
      includes?: Array<'schemas' | 'responses' | 'requestBodies' | 'parameters' | 'x-ext'>
      collisionDetection?: boolean
    } = {},
  ): {
    schemas: Record<string, SchemaObject>
    nameMapping: Map<string, string>
  } {
    const contentType = options.contentType ?? this.#options.contentType
    const includes = options.includes ?? ['schemas', 'requestBodies', 'responses', 'parameters', 'x-ext']
    const shouldResolveCollisions = options.collisionDetection ?? this.#options.collisionDetection ?? false

    const components = this.getDefinition().components
    const schemasWithMeta: SchemaWithMetadata[] = []

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

    if (includes.includes('parameters')) {
      const parameters = components?.parameters || {}
      for (const [name, parameter] of Object.entries(parameters)) {
        const parameterObject = parameter as ParameterObject
        const schema = parameterObject.schema as SchemaObject | undefined
        // Skip parameters whose schema is a bare $ref — they point to an existing named schema
        if (schema && !('$ref' in schema)) {
          schemasWithMeta.push({ schema, source: 'parameters', originalName: name })
        }
      }
    }

    if (includes.includes('x-ext')) {
      const definition = this.getDefinition() as Record<string, unknown>
      const extUrls = definition['x-ext-urls'] as Record<string, string> | undefined

      const hashToUrl = new Map<string, string>()
      if (extUrls) {
        for (const [hash, url] of Object.entries(extUrls)) {
          hashToUrl.set(hash, url as string)
        }
      }

      const extRefs = collectExtRefs(definition)
      const seen = new Set<string>()

      for (const ref of extRefs) {
        if (seen.has(ref)) continue
        seen.add(ref)

        const hashMatch = ref.match(/^#\/x-ext\/([^/]+)/)
        if (!hashMatch) continue
        const hash = hashMatch[1]!
        const url = hashToUrl.get(hash)

        let schema: SchemaObject | null = null
        try {
          schema = this.get<SchemaObject>(ref)
        } catch {
          continue
        }

        if (!schema || isReference(schema)) continue

        if (isPathItem(schema)) continue

        const name = deriveNameFromExtRef(ref, url)
        schemasWithMeta.push({
          schema,
          source: 'x-ext',
          originalName: name,
          refPath: ref,
        })
      }
    }

    const { schemas, nameMapping } = shouldResolveCollisions ? resolveCollisions(schemasWithMeta) : legacyResolve(schemasWithMeta)

    return {
      schemas: sortSchemas(schemas),
      nameMapping,
    }
  }
}
