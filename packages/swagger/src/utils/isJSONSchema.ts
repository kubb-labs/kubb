import { isSchema } from 'oas/rmoas.types'

import type { SchemaObject } from 'oas/rmoas.types'

export function isJSONSchema(
  obj?: unknown,
): obj is SchemaObject {
  return !!obj && isSchema(obj)
}
