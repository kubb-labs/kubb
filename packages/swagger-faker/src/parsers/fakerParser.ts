export const fakerKeywords = {
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

export type FakerKeyword = keyof typeof fakerKeywords

type FakerMetaBase<T> = {
  keyword: FakerKeyword
  args: T
}

type FakerMetaAny = { keyword: 'any' }
type FakerMetaNull = { keyword: 'null' }
type FakerMetaUndefined = { keyword: 'undefined' }

type FakerMetaNumber = { keyword: 'number'; args?: { min?: number; max?: number } }
type FakerMetaInteger = { keyword: 'integer'; args?: { min?: number; max?: number } }

type FakerMetaString = { keyword: 'string'; args?: { min?: number; max?: number } }

type FakerMetaBoolean = { keyword: 'boolean' }

type FakerMetaMatches = { keyword: 'matches'; args?: string }

type FakerMetaObject = { keyword: 'object'; args?: { [x: string]: FakerMeta[] } }

type FakerMetaCatchall = { keyword: 'catchall'; args?: FakerMeta[] }

type FakerMetaRef = { keyword: 'ref'; args?: string }

type FakerMetaUnion = { keyword: 'union'; args?: FakerMeta[] }

type FakerMetaAnd = { keyword: 'and'; args?: FakerMeta[] }

type FakerMetaEnum = { keyword: 'enum'; args?: Array<string | number> }

type FakerMetaArray = { keyword: 'array'; args?: FakerMeta[] }

type FakerMetaTuple = { keyword: 'tuple'; args?: FakerMeta[] }

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
  const value = fakerKeywords[keyword]

  if (keyword === 'tuple' || keyword === 'array' || keyword === 'union' || keyword === 'and') {
    return `${value}(${Array.isArray(args) ? `[${args.map(parseFakerMeta).join(',')}]` : parseFakerMeta(args)})`
  }

  if (keyword === 'enum') {
    return `${value}(${Array.isArray(args) ? `[${args.join(',')}]` : parseFakerMeta(args)})`
  }

  if (keyword === 'catchall') {
    throw new Error('catchall is not implemented')
  }

  if (keyword === 'object') {
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
  if (keyword === 'ref') {
    return `${args}()`
  }

  if (keyword === 'null' || keyword === 'undefined' || keyword === 'any') {
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
