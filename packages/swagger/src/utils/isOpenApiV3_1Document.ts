import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export function isOpenApiV3_1Document(doc: OpenAPIV3.Document | OpenAPIV3_1.Document): doc is OpenAPIV3_1.Document {
  return 'openapi' in doc && doc.openapi.startsWith('3.1')
}
