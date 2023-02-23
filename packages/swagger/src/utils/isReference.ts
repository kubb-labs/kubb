import type { OpenAPIV3 } from 'openapi-types'

export function isReference(obj: any): obj is OpenAPIV3.ReferenceObject {
  return obj && '$ref' in obj
}
