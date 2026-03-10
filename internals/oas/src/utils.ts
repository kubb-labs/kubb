import type { OpenAPIV2 } from 'openapi-types'
import { isPlainObject } from 'remeda'

export function isOpenApiV2Document(doc: any): doc is OpenAPIV2.Document {
  return doc && isPlainObject(doc) && !('openapi' in doc)
}
