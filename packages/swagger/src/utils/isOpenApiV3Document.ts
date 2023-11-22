import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
export function isOpenApiV3Document(doc: OpenAPIV3.Document | OpenAPIV3_1.Document): doc is OpenAPIV3.Document {
  return doc && 'openapi' in doc
}
