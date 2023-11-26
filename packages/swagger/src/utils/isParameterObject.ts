import type { ParameterObject, SchemaObject } from 'oas/types'
export function isParameterObject(obj: ParameterObject | SchemaObject): obj is ParameterObject {
  return obj && 'in' in obj
}
