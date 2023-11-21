import type { OasTypes } from '../types.ts'

export function isRequired(schema?: OasTypes.SchemaObject): boolean {
  if (!schema) {
    return false
  }

  return Array.isArray(schema.required) ? !!schema.required?.length : !!schema.required
}
