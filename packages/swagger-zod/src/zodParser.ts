export const zodKeywords = {
  any: 'any',
  number: 'number',
  integer: 'integer',
  object: 'object',
  lazy: 'lazy',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  nullable: 'nullable',
  null: 'null',
  nullish: 'nullish',
  array: 'array',
  tuple: 'tuple',
  enum: 'enum',
  union: 'union',
  literal: 'literal',
  datetime: 'datetime',
  email: 'email',
  uuid: 'uuid',
  url: 'url',
  /* intersection */
  default: 'default',
  and: 'and',
  describe: 'describe',
  min: 'min',
  max: 'max',
  optional: 'optional',
  catchall: 'catchall',
  readOnly: 'readOnly',

  // custom ones
  ref: 'ref',
  matches: 'matches',
} as const

export type ZodKeyword = keyof typeof zodKeywords

export const zodKeywordMapper: Record<ZodKeyword, string> = {
  any: 'z.any',
  number: 'z.number',
  integer: 'z.number',
  object: 'z.object',
  lazy: 'z.lazy',
  string: 'z.string',
  boolean: 'z.boolean',
  undefined: 'z.undefined',
  nullable: '.nullable',
  null: 'z.null',
  nullish: '.nullish',
  array: 'z.array',
  tuple: 'z.tuple',
  enum: 'z.enum',
  union: 'z.union',
  literal: 'z.literal',
  datetime: '.datetime',
  email: '.email',
  uuid: '.uuid',
  url: '.url',
  /* intersection */
  default: '.default',
  and: '.and',
  describe: '.describe',
  min: '.min',
  max: '.max',
  optional: '.optional',
  catchall: '.catchall',
  readOnly: '.readonly',

  // custom ones
  ref: 'ref',
  matches: '.regex',
} as const

type ZodMetaBase<T> = {
  keyword: ZodKeyword
  args: T
}

type ZodMetaUnknown = { keyword: string }

type ZodMetaAny = { keyword: typeof zodKeywords.any }
type ZodMetaNull = { keyword: typeof zodKeywords.null }

type ZodMetaNullish = { keyword: typeof zodKeywords.nullish }
type ZodMetaUndefined = { keyword: typeof zodKeywords.undefined }

type ZodMetaNumber = { keyword: typeof zodKeywords.number }
type ZodMetaInteger = { keyword: typeof zodKeywords.integer }

type ZodMetaString = { keyword: typeof zodKeywords.string }

type ZodMetaBoolean = { keyword: typeof zodKeywords.boolean }

type ZodMetaDescribe = { keyword: typeof zodKeywords.describe; args?: string }
type ZodMetaMin = { keyword: typeof zodKeywords.min; args?: number }

type ZodMetaMax = { keyword: typeof zodKeywords.max; args?: number }
type ZodMetaMatches = { keyword: typeof zodKeywords.matches; args?: string }
type ZodMetaOptional = { keyword: typeof zodKeywords.optional }

type ZodMetaObject = { keyword: typeof zodKeywords.object; args?: { [x: string]: ZodMeta[] } }

type ZodMetaCatchall = { keyword: typeof zodKeywords.catchall; args?: ZodMeta[] }

/**
 * If external, `.schema` will be added
 */
type ZodMetaRef = { keyword: typeof zodKeywords.ref; args?: { name: string; external?: boolean } }

type ZodMetaUnion = { keyword: typeof zodKeywords.union; args?: ZodMeta[] }
type ZodMetaLiteral = { keyword: typeof zodKeywords.literal; args: string | number }

type ZodMetaAnd = { keyword: typeof zodKeywords.and; args?: ZodMeta[] }

type ZodMetaEnum = { keyword: typeof zodKeywords.enum; args?: Array<string | number> }

type ZodMetaArray = { keyword: typeof zodKeywords.array; args?: ZodMeta[] }

type ZodMetaTuple = { keyword: typeof zodKeywords.tuple; args?: ZodMeta[] }
type ZodMetaLazy = { keyword: typeof zodKeywords.lazy }
type ZodMetaDefault = { keyword: typeof zodKeywords.default; args?: string | number | boolean }

type ZodMetaDatetime = { keyword: typeof zodKeywords.datetime }

type ZodMetaEmail = { keyword: typeof zodKeywords.email }

type ZodMetaUuid = { keyword: typeof zodKeywords.uuid }

type ZodMetaUrl = { keyword: typeof zodKeywords.url }
type ZodMetaReadOnly = { keyword: typeof zodKeywords.readOnly }

export type ZodMeta =
  | ZodMetaUnknown
  | ZodMetaAny
  | ZodMetaNull
  | ZodMetaNullish
  | ZodMetaUndefined
  | ZodMetaInteger
  | ZodMetaNumber
  | ZodMetaString
  | ZodMetaBoolean
  | ZodMetaLazy
  | ZodMetaDescribe
  | ZodMetaMin
  | ZodMetaMax
  | ZodMetaMatches
  | ZodMetaOptional
  | ZodMetaObject
  | ZodMetaCatchall
  | ZodMetaRef
  | ZodMetaUnion
  | ZodMetaAnd
  | ZodMetaEnum
  | ZodMetaArray
  | ZodMetaTuple
  | ZodMetaDefault
  | ZodMetaDatetime
  | ZodMetaEmail
  | ZodMetaUuid
  | ZodMetaLiteral
  | ZodMetaUrl
  | ZodMetaReadOnly

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function zodKeywordSorter(a: ZodMeta, b: ZodMeta): 1 | -1 | 0 {
  if (b.keyword === zodKeywords.null) {
    return -1
  }

  return 0
}

export function parseZodMeta(item: ZodMeta, mapper: Record<ZodKeyword, string> = zodKeywordMapper): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args = '' } = (item || {}) as ZodMetaBase<unknown>
  const value = mapper[keyword]

  if (keyword === zodKeywords.tuple) {
    return `${value}(${Array.isArray(args) ? `[${args.map((item) => parseZodMeta(item as ZodMeta, mapper)).join(',')}]` : parseZodMeta(args as ZodMeta)})`
  }

  if (keyword === zodKeywords.enum) {
    return `${value}(${Array.isArray(args) ? `[${args.join(',')}]` : parseZodMeta(args as ZodMeta)})`
  }

  if (keyword === zodKeywords.array) {
    return `${value}(${Array.isArray(args) ? `${args.map((item) => parseZodMeta(item as ZodMeta, mapper)).join('')}` : parseZodMeta(args as ZodMeta)})`
  }
  if (keyword === zodKeywords.union) {
    // zod union type needs at least 2 items
    if (Array.isArray(args) && args.length === 1) {
      return parseZodMeta(args[0] as ZodMeta)
    }
    if (Array.isArray(args) && !args.length) {
      return ''
    }

    return `${Array.isArray(args) ? `${value}([${args.map((item) => parseZodMeta(item as ZodMeta, mapper)).join(',')}])` : parseZodMeta(args as ZodMeta)}`
  }

  if (keyword === zodKeywords.catchall) {
    return `${value}(${Array.isArray(args) ? `${args.map((item) => parseZodMeta(item as ZodMeta, mapper)).join('')}` : parseZodMeta(args as ZodMeta)})`
  }

  if (keyword === zodKeywords.and && Array.isArray(args)) {
    return `${
      args
        .map((item) => parseZodMeta(item as ZodMeta, mapper))
        .filter(Boolean)
        .map((item, index) => (index === 0 ? item : `${value}(${item})`))
        .join('')
    }`
  }

  if (keyword === zodKeywords.object) {
    if (!args) {
      args = '{}'
    }
    const argsObject = Object.entries(args as ZodMeta)
      .filter((item) => {
        const schema = item[1] as ZodMeta[]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schema = item[1] as ZodMeta[]
        return `"${name}": ${
          schema
            .sort(zodKeywordSorter)
            .map((item) => parseZodMeta(item, mapper))
            .join('')
        }`
      })
      .join(',')

    args = `{${argsObject}}`
  }

  // custom type
  if (keyword === zodKeywords.ref) {
    // use of z.lazy because we need to import from files x or we use the type as a self reference, external will add `.schema`
    const refArgs = args as ZodMetaRef['args']

    if (refArgs?.external) {
      return `${mapper.lazy}(() => ${refArgs?.name}).schema`
    }

    return `${mapper.lazy}(() => ${refArgs?.name})`
  }

  if (keyword === zodKeywords.default && args === undefined) {
    return ''
  }

  if (keyword in mapper) {
    return `${value}(${args as string})`
  }

  return '""'
}

export function zodParser(items: ZodMeta[], options: { keysToOmit?: string[]; mapper?: Record<ZodKeyword, string>; name: string }): string {
  if (!items.length) {
    return `export const ${options.name} = '';`
  }

  if (options.keysToOmit?.length) {
    const omitText = `.omit({ ${options.keysToOmit.map((key) => `${key}: true`).join(',')} })`
    return `export const ${options.name} = ${items.map((item) => parseZodMeta(item, { ...zodKeywordMapper, ...options.mapper })).join('')}${omitText};`
  }

  return `export const ${options.name} = ${items.map((item) => parseZodMeta(item, { ...zodKeywordMapper, ...options.mapper })).join('')};`
}
