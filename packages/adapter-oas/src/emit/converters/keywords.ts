import type { ast } from '@kubb/kit'
import { keywordKeys } from '../../constants.ts'
import type { SchemaObject } from '../../types.ts'
import type { ConvertContext } from '../parseSchema.ts'

type Subschema = SchemaObject | boolean

/**
 * The JSON Schema 2020-12 keywords read by {@link convertKeywords}. `SchemaObject` unions several
 * JSON Schema drafts that type these differently, so they are read through this view.
 */
type KeywordsObject = {
  not?: Subschema
  if?: Subschema
  then?: Subschema
  else?: Subschema
  dependentRequired?: Record<string, Array<string>>
  dependentSchemas?: Record<string, Subschema>
  propertyNames?: Subschema
  contains?: Subschema
  minContains?: number
  maxContains?: number
  unevaluatedProperties?: Subschema
  unevaluatedItems?: Subschema
}

const subschemaKeys = ['not', 'if', 'then', 'else', 'propertyNames', 'contains', 'unevaluatedProperties', 'unevaluatedItems'] as const

/**
 * Parses a subschema. `required` names without a matching property (as in `not: { required: ['a', 'b'] }`)
 * are added as untyped properties, since `convertObject` only keeps `required` for listed properties.
 * Skipped under `additionalProperties: false` or a non-object `type`, where a synthetic property
 * would change the constraint.
 */
function parseSubschema(subschema: Subschema, parse: ConvertContext['parse']): ast.SchemaNode | boolean {
  if (typeof subschema === 'boolean') return subschema
  const { required } = subschema
  const missing = Array.isArray(required) ? required.filter((key) => !subschema.properties?.[key]) : []
  const isObject = !subschema.type || subschema.type === 'object'
  if (!missing.length || !isObject || subschema.additionalProperties === false) return parse({ schema: subschema })

  const properties = { ...subschema.properties, ...Object.fromEntries(missing.map((key) => [key, {}])) }
  return parse({ schema: { ...subschema, type: 'object', properties } })
}

/**
 * Reads the JSON Schema applicator keywords on `schema` (`not`, `if`/`then`/`else`,
 * `dependentRequired`, `dependentSchemas`, `propertyNames`, `contains`/`minContains`/`maxContains`,
 * `unevaluatedProperties`/`unevaluatedItems`). Returns `undefined` when none is set, so nodes
 * without them keep their current shape.
 */
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

/**
 * Returns `schema` without the keywords {@link convertKeywords} reads. The parser attaches them to
 * the outer node only, so converters that re-parse the parent schema (multi-type members, union
 * base properties, `allOf` siblings) don't copy them onto every member.
 */
export function omitKeywords(schema: SchemaObject): SchemaObject {
  return Object.fromEntries(Object.entries(schema).filter(([key]) => !keywordKeySet.has(key))) as SchemaObject
}
