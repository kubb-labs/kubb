export const zodKeywords = {
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

export type ZodKeyword = keyof typeof zodKeywords
export type ZodKeywords = (typeof zodKeywords)[ZodKeyword]

type ZodMetaBase<T> = {
  keyword: ZodKeywords
  args: T
}

type ZodMetaAny = { keyword: typeof zodKeywords.any }
type ZodMetaNull = { keyword: typeof zodKeywords.null }
type ZodMetaUndefined = { keyword: typeof zodKeywords.undefined }

type ZodMetaNumber = { keyword: typeof zodKeywords.number }

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

export type ZodMeta =
  | ZodMetaAny
  | ZodMetaNull
  | ZodMetaUndefined
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

function parseZodMeta(item: ZodMeta): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args = '' } = (item || {}) as ZodMetaBase<any>

  if (keyword === zodKeywords.tuple) {
    return `${keyword}(${Array.isArray(args) ? `[${args.map(parseZodMeta).join(',')}]` : parseZodMeta(args)})`
  }

  if (keyword === zodKeywords.array) {
    return `${keyword}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args)})`
  }
  if (keyword === zodKeywords.union) {
    return `${zodKeywords.and}(${Array.isArray(args) ? `${keyword}([${args.map(parseZodMeta).join(',')}])` : parseZodMeta(args)})`
  }

  if (keyword === zodKeywords.catchall) {
    return `${keyword}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args)})`
  }

  if (keyword === zodKeywords.and)
    return Array.isArray(args)
      ? `${args
          .map(parseZodMeta)
          .map((item) => `${keyword}(${item})`)
          .join('')}`
      : `${keyword}(${parseZodMeta(args)})`

  if (keyword === zodKeywords.object) {
    if (!args) {
      args = '{}'
    }
    const argsObject = Object.entries(args)
      .filter((item) => {
        const schema = item[1] as ZodMeta[]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const key = item[0] as string
        const schema = item[1] as ZodMeta[]
        return `"${key}": ${schema.sort(zodKeywordSorter).map(parseZodMeta).join('')}`
      })
      .join(',')

    args = `{${argsObject}}`
  }

  // custom type
  if (keyword === zodKeywords.ref) {
    // use of z.lazy because we need to import from files x or we use the type as a self referene
    return `${zodKeywords.lazy}(() => ${args})`
  }

  return `${keyword}(${args})`
}

export function zodParser(items: ZodMeta[]): string {
  if (!items.length) {
    return ''
  }

  return items.map(parseZodMeta).join('')
}
