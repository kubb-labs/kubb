import type { ast } from '@kubb/kit'
import { keywordKeys } from '../../constants.ts'
import type { SchemaObject } from '../../types.ts'
import type { ConvertContext } from '../parseSchema.ts'

type Subschema = SchemaObject | boolean

const subschemaKeys = ['not', 'if', 'then', 'else', 'propertyNames', 'contains', 'unevaluatedProperties', 'unevaluatedItems'] as const

// Normalize keyword types across the JSON Schema drafts in SchemaObject.
type KeywordsObject = {
  [key in (typeof subschemaKeys)[number]]?: Subschema
} & {
  dependentRequired?: Record<string, Array<string>>
  dependentSchemas?: Record<string, Subschema>
  minContains?: number
  maxContains?: number
}

// Synthesize missing required properties only for open object schemas, so convertObject keeps them.
function parseSubschema(subschema: Subschema, parse: ConvertContext['parse']): ast.SchemaNode | boolean {
  if (typeof subschema === 'boolean') return subschema
  const { required } = subschema
  const missing = Array.isArray(required) ? required.filter((key) => !subschema.properties?.[key]) : []
  const isObject = !subschema.type || subschema.type === 'object'
  if (!missing.length || !isObject || subschema.additionalProperties === false) return parse({ schema: subschema })

  const properties = { ...subschema.properties, ...Object.fromEntries(missing.map((key) => [key, {}])) }
  return parse({ schema: { ...subschema, type: 'object', properties } })
}

/** Preserves applicator keywords; absent keywords leave the node shape unchanged. */
export function convertKeywords({ schema, parse }: Pick<ConvertContext, 'schema' | 'parse'>): ast.SchemaKeywords | undefined {
  const raw = schema as KeywordsObject
  const keywords: ast.SchemaKeywords = {}

  for (const key of subschemaKeys) {
    const subschema = raw[key]
    if (subschema !== undefined) keywords[key] = parseSubschema(subschema, parse)
  }
  if (raw.dependentSchemas) {
    keywords.dependentSchemas = Object.fromEntries(Object.entries(raw.dependentSchemas).map(([key, value]) => [key, parseSubschema(value, parse)]))
  }
  if (raw.dependentRequired) keywords.dependentRequired = raw.dependentRequired
  if (raw.minContains !== undefined) keywords.minContains = raw.minContains
  if (raw.maxContains !== undefined) keywords.maxContains = raw.maxContains

  return Object.keys(keywords).length ? keywords : undefined
}

const keywordKeySet: ReadonlySet<string> = new Set(keywordKeys)

/** Keeps keywords on the outer node when converters re-parse the parent schema. */
export function omitKeywords(schema: SchemaObject): SchemaObject {
  return Object.fromEntries(Object.entries(schema).filter(([key]) => !keywordKeySet.has(key))) as SchemaObject
}
