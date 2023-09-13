import type { OpenAPIV3 } from 'openapi-types'
import type { ContentType, Oas } from '../types.ts'
import { Warning } from '@kubb/core'

type Mode = 'schemas' | 'responses' | 'requestBodies'

export type GetSchemasProps = {
  oas: Oas
  contentType?: ContentType
  includes?: Mode[]
}

export function getSchemas({
  oas,
  contentType,
  includes = ['schemas', 'requestBodies', 'responses'],
}: GetSchemasProps): Record<string, OpenAPIV3.SchemaObject> {
  const components = oas.getDefinition().components

  let schemas: Record<string, OpenAPIV3.SchemaObject> = {}

  if (includes.includes('schemas')) {
    schemas = {
      ...schemas,
      ...((components?.schemas as Record<string, OpenAPIV3.SchemaObject>) || {}),
    }
  }

  const requestBodies = components?.requestBodies || {}
  if (includes.includes('responses')) {
    const responses = components?.responses || {}

    Object.entries(responses).forEach(([name, response]: [string, OpenAPIV3.ResponseObject]) => {
      if (response.content && !schemas[name]) {
        const firstContentType = Object.keys(response.content)[0]
        schemas[name] = response.content?.[contentType || firstContentType]?.schema as OpenAPIV3.SchemaObject
      }
    })
  }

  if (includes.includes('requestBodies')) {
    Object.entries(requestBodies).forEach(([name, request]: [string, OpenAPIV3.RequestBodyObject]) => {
      if (request.content && !schemas[name]) {
        const firstContentType = Object.keys(request.content)[0]
        schemas[name] = request.content?.[contentType || firstContentType]?.schema as OpenAPIV3.SchemaObject
      }
    })
  }

  return schemas
}
