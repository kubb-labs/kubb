import type { OpenAPI, OpenAPIV3 } from 'openapi-types'

export function isOpenApiV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return 'openapi' in doc
}
