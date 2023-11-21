import type { OpenAPI, OpenAPIV3_1 } from 'openapi-types'

export function isOpenApiV3_1Document(doc: OpenAPI.Document): doc is OpenAPIV3_1.Document {
  return 'openapi' in doc && doc.info.version.startsWith('3.1')
}
