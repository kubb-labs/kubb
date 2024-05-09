import type { Oas, OasTypes, contentType } from '@kubb/oas'

type Mode = 'schemas' | 'responses' | 'requestBodies'

export type GetSchemasProps = {
  oas: Oas
  contentType?: contentType
  includes?: Mode[]
}

export function getSchemas({ oas, contentType, includes = ['schemas', 'requestBodies', 'responses'] }: GetSchemasProps): Record<string, OasTypes.SchemaObject> {
  const components = oas.getDefinition().components

  let schemas: Record<string, OasTypes.SchemaObject> = {}

  if (includes.includes('schemas')) {
    schemas = {
      ...schemas,
      ...((components?.schemas as Record<string, OasTypes.SchemaObject>) || {}),
    }
  }

  const requestBodies = components?.requestBodies || {}
  if (includes.includes('responses')) {
    const responses = components?.responses || {}

    Object.entries(responses).forEach(([name, response]: [string, OasTypes.ResponseObject]) => {
      if (response.content && !schemas[name]) {
        const firstContentType = Object.keys(response.content)[0] || 'application/json'
        schemas[name] = response.content?.[contentType || firstContentType]?.schema as OasTypes.SchemaObject
      }
    })
  }

  if (includes.includes('requestBodies')) {
    Object.entries(requestBodies).forEach(([name, request]: [string, OasTypes.RequestBodyObject]) => {
      if (request.content && !schemas[name]) {
        const firstContentType = Object.keys(request.content)[0] || 'application/json'
        schemas[name] = request.content?.[contentType || firstContentType]?.schema as OasTypes.SchemaObject
      }
    })
  }

  return schemas
}
