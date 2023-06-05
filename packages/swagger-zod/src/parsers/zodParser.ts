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

type ZodMetaBase<T> = {
  keyword: ZodKeyword
  args: T
}

type ZodMetaAny = { keyword: 'any' }
type ZodMetaNull = { keyword: 'null' }
type ZodMetaUndefined = { keyword: 'undefined' }

type ZodMetaNumber = { keyword: 'number' }
type ZodMetaInteger = { keyword: 'integer' }

type ZodMetaString = { keyword: 'string' }

type ZodMetaBoolean = { keyword: 'boolean' }

type ZodMetaDescribe = { keyword: 'describe'; args?: string }
type ZodMetaMin = { keyword: 'min'; args?: number }

type ZodMetaMax = { keyword: 'max'; args?: number }
type ZodMetaMatches = { keyword: 'matches'; args?: string }
type ZodMetaOptional = { keyword: 'optional' }

type ZodMetaObject = { keyword: 'object'; args?: { [x: string]: ZodMeta[] } }

type ZodMetaCatchall = { keyword: 'catchall'; args?: ZodMeta[] }

type ZodMetaRef = { keyword: 'ref'; args?: string }

type ZodMetaUnion = { keyword: 'union'; args?: ZodMeta[] }

type ZodMetaAnd = { keyword: 'and'; args?: ZodMeta[] }

type ZodMetaEnum = { keyword: 'enum'; args?: Array<string | number> }

type ZodMetaArray = { keyword: 'array'; args?: ZodMeta[] }

type ZodMetaTuple = { keyword: 'tuple'; args?: ZodMeta[] }
type ZodMetaLazy = { keyword: 'lazy' }

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

/**
 *
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function zodKeywordSorter(a: ZodMeta, b: ZodMeta) {
  if (b.keyword === 'null') {
    return -1
  }

  return 0
}

export function parseZodMeta(item: ZodMeta): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args = '' } = (item || {}) as ZodMetaBase<any>
  const value = zodKeywords[keyword]

  if (keyword === 'tuple') {
    return `${value}(${Array.isArray(args) ? `[${args.map(parseZodMeta).join(',')}]` : parseZodMeta(args)})`
  }

  if (keyword === 'array') {
    return `${value}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args)})`
  }
  if (keyword === 'union') {
    return `${Array.isArray(args) ? `${value}([${args.map(parseZodMeta).join(',')}])` : parseZodMeta(args)}`
  }

  if (keyword === 'catchall') {
    return `${value}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args)})`
  }

  if (keyword === 'and') {
    if (Array.isArray(args)) {
      return `${args
        .map(parseZodMeta)
        .map((item) => `${value}(${item})`)
        .join('')}`
    }

    return `${value}(${parseZodMeta(args)})`
  }

  if (keyword === 'object') {
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
    // use of z.lazy because we need to import from files x or we use the type as a self reference
    return `${zodKeywords.lazy}(() => ${args})`
  }

  if (keyword in zodKeywords) {
    return `${value}(${args})`
  }

  return '""'
}

export function zodParser(items: ZodMeta[], name: string): string {
  if (!items.length) {
    return `export const ${name} = '';`
  }

  return `export const ${name} = ${items.map(parseZodMeta).join('')};`
}
