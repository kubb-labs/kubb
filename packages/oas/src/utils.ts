import { isRef, isSchema } from 'oas/types'
import openapiFormat from 'openapi-format'
import { isObject } from 'remeda'

import type { OASDocument, ParameterObject, SchemaObject } from 'oas/types'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { FormatOptions } from './parser/index.ts'

export function isOpenApiV2Document(doc: any): doc is OpenAPIV2.Document {
  return doc && isObject(doc) && !('openapi' in doc)
}
export function isOpenApiV3Document(doc: any): doc is OpenAPIV3.Document {
  return doc && isObject(doc) && 'openapi' in doc
}

export function isOpenApiV3_1Document(doc: any): doc is OpenAPIV3_1.Document {
  return doc && isObject(doc) && 'openapi' in doc && doc.openapi.startsWith('3.1')
}

export function isJSONSchema(obj?: unknown): obj is SchemaObject {
  return !!obj && isSchema(obj)
}

export function isParameterObject(obj: ParameterObject | SchemaObject): obj is ParameterObject {
  return obj && 'in' in obj
}

export function isReference(obj?: unknown): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj)
}

export function isRequired(schema?: SchemaObject): boolean {
  if (!schema) {
    return false
  }

  return Array.isArray(schema.required) ? !!schema.required?.length : !!schema.required
}

export function isOptional(schema?: SchemaObject): boolean {
  return !isRequired(schema)
}

export async function filterAndSort(data: OASDocument, options: FormatOptions = {}): Promise<OASDocument> {
  const mergedOptions: FormatOptions = {
    sort: options.sort ?? true,
    ['no-sort']: options['no-sort'] ?? false,
    sortSet: {
      root: ['openapi', 'info', 'servers', 'paths', 'components', 'tags', 'x-tagGroups', 'externalDocs'],
      get: ['operationId', 'summary', 'description', 'parameters', 'requestBody', 'responses'],
      post: ['operationId', 'summary', 'description', 'parameters', 'requestBody', 'responses'],
      put: ['operationId', 'summary', 'description', 'parameters', 'requestBody', 'responses'],
      patch: ['operationId', 'summary', 'description', 'parameters', 'requestBody', 'responses'],
      delete: ['operationId', 'summary', 'description', 'parameters', 'requestBody', 'responses'],
      parameters: ['name', 'in', 'description', 'required', 'schema'],
      requestBody: ['description', 'required', 'content'],
      responses: ['description', 'headers', 'content', 'links'],
      content: [],
      components: ['parameters', 'schemas'],
      schema: ['description', 'type', 'items', 'properties', 'format', 'example', 'default'],
      schemas: ['description', 'type', 'items', 'properties', 'format', 'example', 'default'],
      properties: ['description', 'type', 'items', 'format', 'example', 'default', 'enum'],
      ...options.sortSet,
    },
    sortComponentsSet: {
      ...options.sortComponentsSet,
    },
    filterSet: {
      inverseMethods: ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'],
      unusedComponents: options.filterSet ? ['requestBodies', 'schemas', 'parameters', 'responses'] : [],
      ...options.filterSet,
    },
    casingSet: {
      ...options.casingSet,
    },
  }

  const restFilter = await openapiFormat.openapiFilter(data, mergedOptions)
  data = restFilter.data

  const resFormat = await openapiFormat.openapiSort(data, mergedOptions)
  data = resFormat.data

  const resChangeCase = await openapiFormat.openapiChangeCase(data, mergedOptions)
  data = resChangeCase.data

  return data
}
