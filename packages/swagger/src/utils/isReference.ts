import { isRef } from 'oas/types'

import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export function isReference(
  obj?: unknown,
): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj)
}
