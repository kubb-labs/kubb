import type { OpenAPIV3 } from 'openapi-types'

export function isParameterObject(obj: OpenAPIV3.ParameterObject | OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): obj is OpenAPIV3.ParameterObject {
  return obj && 'in' in obj
}
