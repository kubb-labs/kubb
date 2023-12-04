import type { OasTypes } from '../oas/index.ts'

export function isRequired(schema?: OasTypes.SchemaObject): boolean {
  if (!schema) {
    return false
  }

  return Array.isArray(schema.required) ? !!schema.required?.length : !!schema.required
}
