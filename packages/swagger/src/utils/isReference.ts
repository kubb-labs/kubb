import type { OpenAPIV3 } from 'openapi-types'

export function isReference(obj: OpenAPIV3.ParameterObject | OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): obj is OpenAPIV3.ReferenceObject {
  return obj && '$ref' in obj
}
