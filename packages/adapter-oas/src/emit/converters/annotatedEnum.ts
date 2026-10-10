import type { ast } from '@kubb/kit'
import type { SchemaObject } from '../../types.ts'
import { createNode } from '../createNode.ts'
import type { ConvertContext } from '../parseSchema.ts'

const ANNOTATIONS = new Set(['title', 'description', 'default', 'deprecated', 'readOnly', 'writeOnly', 'example', 'examples', 'xml', 'externalDocs'])
const UNION_KEYS = new Set([...ANNOTATIONS, 'type', 'nullable', 'oneOf', 'anyOf'])
const MEMBER_KEYS = new Set([...ANNOTATIONS, 'type', 'const'])

function hasOnlyKeys(schema: unknown, keys: ReadonlySet<string>): schema is SchemaObject {
  return typeof schema === 'object' && schema !== null && !Array.isArray(schema) && Object.keys(schema).every((key) => keys.has(key) || key.startsWith('x-'))
}

function matchesType(type: SchemaObject['type'], value: string | number): boolean {
  return type === undefined || type === typeof value || (type === 'integer' && typeof value === 'number' && Number.isInteger(value))
}

/** Recognizes annotated const unions only when replacing them cannot discard validation constraints. */
export function convertAnnotatedEnum(context: ConvertContext): ast.SchemaNode | undefined {
  const { schema, document } = context
  if (!document.openapi?.startsWith('3.1.')) return undefined
  if (!hasOnlyKeys(schema, UNION_KEYS) || (schema.oneOf !== undefined && schema.anyOf !== undefined)) return undefined
  const members = schema.oneOf ?? schema.anyOf
  if (!members?.length) return undefined

  const names = new Set<string>()
  const values = new Set<string | number>()
  const namedEnumValues: NonNullable<ast.EnumSchemaNode['namedEnumValues']> = []
  let primitive: 'string' | 'number' | undefined
  for (const member of members) {
    if (!hasOnlyKeys(member, MEMBER_KEYS)) return undefined
    const value = member.const
    if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) return undefined
    if (typeof member.title !== 'string' || !member.title.trim() || names.has(member.title) || values.has(value)) return undefined
    if (!matchesType(schema.type, value) || !matchesType(member.type, value)) return undefined
    const valueType = typeof value === 'number' ? 'number' : 'string'
    if (primitive !== undefined && primitive !== valueType) return undefined
    primitive = valueType
    names.add(member.title)
    values.add(value)
    namedEnumValues.push({ name: member.title, value, primitive: valueType, description: member.description })
  }

  return createNode(context, { type: 'enum', primitive, namedEnumValues })
}
