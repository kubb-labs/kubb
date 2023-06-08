export const zodKeywords = {
  any: 'any',
  number: 'number',
  integer: 'integer',
  object: 'object',
  lazy: 'lazy',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
  array: 'array',
  tuple: 'tuple',
  enum: 'enum',
  union: 'union',
  /* intersection */
  default: 'default',
  and: 'and',
  describe: 'describe',
  min: 'min',
  max: 'max',
  optional: 'optional',
  catchall: 'catchall',

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
  null: '.nullable',
  array: 'z.array',
  tuple: 'z.tuple',
  enum: 'z.enum',
  union: 'z.union',
  /* intersection */
  default: '.default',
  and: '.and',
  describe: '.describe',
  min: '.min',
  max: '.max',
  optional: '.optional',
  catchall: '.catchall',

  // custom ones
  ref: 'ref',
  matches: '.regex',
} as const

type ZodMetaBase<T> = {
  keyword: ZodKeyword
  args: T
}

type ZodMetaAny = { keyword: typeof zodKeywords.any }
type ZodMetaNull = { keyword: typeof zodKeywords.null }
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

type ZodMetaRef = { keyword: typeof zodKeywords.ref; args?: string }

type ZodMetaUnion = { keyword: typeof zodKeywords.union; args?: ZodMeta[] }

type ZodMetaAnd = { keyword: typeof zodKeywords.and; args?: ZodMeta[] }

type ZodMetaEnum = { keyword: typeof zodKeywords.enum; args?: Array<string | number> }

type ZodMetaArray = { keyword: typeof zodKeywords.array; args?: ZodMeta[] }

type ZodMetaTuple = { keyword: typeof zodKeywords.tuple; args?: ZodMeta[] }
type ZodMetaLazy = { keyword: typeof zodKeywords.lazy }
type ZodMetaDefault = { keyword: typeof zodKeywords.default; args?: string | number | boolean }

export type ZodMeta =
  | ZodMetaAny
  | ZodMetaNull
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

/**
 *
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function zodKeywordSorter(a: ZodMeta, b: ZodMeta) {
  if (b.keyword === zodKeywords.null) {
    return -1
  }

  return 0
}

export function parseZodMeta(item: ZodMeta): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args = '' } = (item || {}) as ZodMetaBase<any>
  const value = zodKeywordMapper[keyword]

  if (keyword === zodKeywords.tuple) {
    return `${value}(${Array.isArray(args) ? `[${args.map(parseZodMeta).join(',')}]` : parseZodMeta(args as ZodMeta)})`
  }

  if (keyword === zodKeywords.array) {
    return `${value}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args as ZodMeta)})`
  }
  if (keyword === zodKeywords.union) {
    return `${Array.isArray(args) ? `${value}([${args.map(parseZodMeta).join(',')}])` : parseZodMeta(args as ZodMeta)}`
  }

  if (keyword === zodKeywords.catchall) {
    return `${value}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args as ZodMeta)})`
  }

  if (keyword === zodKeywords.and && Array.isArray(args)) {
    return `${args
      .map(parseZodMeta)
      .map((item) => `${value}(${item})`)
      .join('')}`
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
        const key = item[0]
        const schema = item[1] as ZodMeta[]
        return `"${key}": ${schema.sort(zodKeywordSorter).map(parseZodMeta).join('')}`
      })
      .join(',')

    args = `{${argsObject}}`
  }

  // custom type
  if (keyword === zodKeywords.ref) {
    // use of z.lazy because we need to import from files x or we use the type as a self reference
    return `${zodKeywordMapper.lazy}(() => ${args})`
  }

  if (keyword === zodKeywords.default && args === undefined) {
    return ''
  }

  if (keyword in zodKeywords) {
    return `${value}(${args})`
  }

  return '""'
}

export function zodParser(items: ZodMeta[], options: { name: string }): string {
  if (!items.length) {
    return `export const ${options.name} = '';`
  }

  return `export const ${options.name} = ${items.map(parseZodMeta).join('')};`
}
