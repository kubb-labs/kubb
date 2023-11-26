import { isSchema } from 'oas/types'

import type { SchemaObject } from 'oas/types'

export function isJSONSchema(
  obj?: unknown,
): obj is SchemaObject {
  return !!obj && isSchema(obj)
}
