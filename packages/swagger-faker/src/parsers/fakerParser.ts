export const fakerKeywords = {
  any: 'any',
  number: 'number',
  integer: 'integer',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
  array: 'array',
  tuple: 'tuple',
  enum: 'enum',
  union: 'union',
  /* intersection */
  and: 'and',

  // custom ones
  object: 'object',
  ref: 'ref',
  catchall: 'catchall',
  matches: 'matches',
} as const

export type FakerKeyword = keyof typeof fakerKeywords

export const fakerKeywordMapper: Record<FakerKeyword, string> = {
  any: 'undefined',
  number: 'faker.number.float',
  integer: 'faker.number.int',
  string: 'faker.string.alpha',
  boolean: 'faker.datatype.boolean',
  undefined: 'undefined',
  null: 'null',
  array: 'faker.helpers.arrayElement',
  tuple: 'faker.helpers.arrayElement',
  enum: 'faker.helpers.arrayElement',
  union: 'faker.helpers.arrayElement',
  /* intersection */
  and: 'faker.helpers.arrayElement',

  // custom ones
  object: 'object',
  ref: 'ref',
  catchall: 'catchall',
  matches: 'faker.helpers.fromRegExp',
} as const

type FakerMetaBase<T> = {
  keyword: FakerKeyword
  args: T
}

type FakerMetaAny = { keyword: typeof fakerKeywords.any }
type FakerMetaNull = { keyword: typeof fakerKeywords.null }
type FakerMetaUndefined = { keyword: typeof fakerKeywords.undefined }

type FakerMetaNumber = { keyword: typeof fakerKeywords.number; args?: { min?: number; max?: number } }
type FakerMetaInteger = { keyword: typeof fakerKeywords.integer; args?: { min?: number; max?: number } }

type FakerMetaString = { keyword: typeof fakerKeywords.string; args?: { min?: number; max?: number } }

type FakerMetaBoolean = { keyword: typeof fakerKeywords.boolean }

type FakerMetaMatches = { keyword: typeof fakerKeywords.matches; args?: string }

type FakerMetaObject = { keyword: typeof fakerKeywords.object; args?: { [x: string]: FakerMeta[] } }

type FakerMetaCatchall = { keyword: typeof fakerKeywords.catchall; args?: FakerMeta[] }

type FakerMetaRef = { keyword: typeof fakerKeywords.ref; args?: string }

type FakerMetaUnion = { keyword: typeof fakerKeywords.union; args?: FakerMeta[] }

type FakerMetaAnd = { keyword: typeof fakerKeywords.and; args?: FakerMeta[] }

type FakerMetaEnum = { keyword: typeof fakerKeywords.enum; args?: Array<string | number> }

type FakerMetaArray = { keyword: typeof fakerKeywords.array; args?: FakerMeta[] }

type FakerMetaTuple = { keyword: typeof fakerKeywords.tuple; args?: FakerMeta[] }

export type FakerMeta =
  | FakerMetaAny
  | FakerMetaNull
  | FakerMetaUndefined
  | FakerMetaNumber
  | FakerMetaInteger
  | FakerMetaString
  | FakerMetaBoolean
  | FakerMetaMatches
  | FakerMetaObject
  | FakerMetaCatchall
  | FakerMetaRef
  | FakerMetaUnion
  | FakerMetaAnd
  | FakerMetaEnum
  | FakerMetaArray
  | FakerMetaTuple

/**
 *
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function fakerKeywordSorter(a: FakerMeta, b: FakerMeta) {
  if (b.keyword === 'null') {
    return -1
  }

  return 0
}

export function parseFakerMeta(item: FakerMeta): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args = {} } = (item || {}) as FakerMetaBase<any>
  const value = fakerKeywordMapper[keyword]

  if (keyword === fakerKeywords.tuple || keyword === fakerKeywords.array || keyword === fakerKeywords.union || keyword === fakerKeywords.and) {
    return `${value}(${Array.isArray(args) ? `[${args.map(parseFakerMeta).join(',')}]` : parseFakerMeta(args)})`
  }

  if (keyword === fakerKeywords.enum) {
    return `${value}(${Array.isArray(args) ? `[${args.join(',')}]` : parseFakerMeta(args)})`
  }

  if (keyword === fakerKeywords.catchall) {
    throw new Error('catchall is not implemented')
  }

  if (keyword === fakerKeywords.object) {
    if (!args) {
      args = '{}'
    }
    const argsObject = Object.entries(args)
      .filter((item) => {
        const schema = item[1] as FakerMeta[]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const key = item[0] as string
        const schema = item[1] as FakerMeta[]
        return `"${key}": ${schema.sort(fakerKeywordSorter).map(parseFakerMeta).join('')}`
      })
      .join(',')

    return `{${argsObject}}`
  }

  // custom type
  if (keyword === fakerKeywords.ref) {
    return `${args}()`
  }

  if (keyword === fakerKeywords.null || keyword === fakerKeywords.undefined || keyword === fakerKeywords.any) {
    return value
  }

  if (keyword in fakerKeywords) {
    return `${value}(${JSON.stringify(args)})`
  }

  return '""'
}

export function fakerParser(items: FakerMeta[], name: string): string {
  if (!items.length) {
    return `
      export function ${name}() {
        return '';
      }
    `
  }

  return `
    export function ${name}() {
      return ${items.map(parseFakerMeta).join('')};
    }
  `
}
