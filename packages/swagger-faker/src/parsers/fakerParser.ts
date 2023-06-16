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
  datetime: 'datetime',
  email: 'email',
  uuid: 'uuid',
  url: 'url',
  /* intersection */
  and: 'and',

  // custom ones
  object: 'object',
  ref: 'ref',
  catchall: 'catchall',
  matches: 'matches',
  firstName: 'firstName',
  lastName: 'lastName',
  password: 'password',
  phone: 'phone',
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
  array: 'faker.helpers.arrayElements',
  tuple: 'faker.helpers.arrayElements',
  enum: 'faker.helpers.arrayElement<any>',
  union: 'faker.helpers.arrayElement',
  datetime: 'faker.date.anytime',
  uuid: 'faker.string.uuid',
  url: 'faker.internet.url',
  /* intersection */
  and: 'Object.assign',

  // custom ones
  object: 'object',
  ref: 'ref',
  catchall: 'catchall',
  matches: 'faker.helpers.fromRegExp',
  email: 'faker.internet.email',
  firstName: 'faker.person.firstName',
  lastName: 'faker.person.lastName',
  password: 'faker.internet.password',
  phone: 'faker.phone.number',
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
type FakerMetaEmail = { keyword: typeof fakerKeywords.email }

type FakerMetaFirstName = { keyword: typeof fakerKeywords.firstName }

type FakerMetaLastName = { keyword: typeof fakerKeywords.lastName }
type FakerMetaPassword = { keyword: typeof fakerKeywords.password }

type FakerMetaPhone = { keyword: typeof fakerKeywords.phone }

type FakerMetaDatetime = { keyword: typeof fakerKeywords.datetime }

type FakerMetaUuid = { keyword: typeof fakerKeywords.uuid }

type FakerMetaUrl = { keyword: typeof fakerKeywords.url }

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
  | FakerMetaEmail
  | FakerMetaFirstName
  | FakerMetaLastName
  | FakerMetaPassword
  | FakerMetaPhone
  | FakerMetaDatetime
  | FakerMetaUuid
  | FakerMetaUrl
// use example
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
  let { keyword, args } = (item || {}) as FakerMetaBase<unknown>
  const value = fakerKeywordMapper[keyword]

  if (keyword === fakerKeywords.tuple || keyword === fakerKeywords.array || keyword === fakerKeywords.union) {
    return `${value}(${Array.isArray(args) ? `[${args.map(parseFakerMeta).join(',')}]` : parseFakerMeta(args as FakerMeta)}) as any`
  }

  if (keyword === fakerKeywords.and) {
    return `${value}({},${Array.isArray(args) ? `${args.map(parseFakerMeta).join(',')}` : parseFakerMeta(args as FakerMeta)})`
  }

  if (keyword === fakerKeywords.enum) {
    return `${value}(${Array.isArray(args) ? `${args.join(',')}` : parseFakerMeta(args as FakerMeta)})`
  }

  if (keyword === fakerKeywords.catchall) {
    throw new Error('catchall is not implemented')
  }

  if (keyword === fakerKeywords.object) {
    if (!args) {
      args = '{}'
    }
    const argsObject = Object.entries(args as FakerMeta)
      .filter((item) => {
        const schema = item[1] as FakerMeta[]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const key = item[0]
        const schema = item[1] as FakerMeta[]
        return `"${key}": ${schema.sort(fakerKeywordSorter).map(parseFakerMeta).join('')}`
      })
      .join(',')

    return `{${argsObject}}`
  }

  // custom type
  if (keyword === fakerKeywords.ref) {
    return `${args as string}()`
  }

  if (keyword === fakerKeywords.null || keyword === fakerKeywords.undefined || keyword === fakerKeywords.any) {
    return value
  }

  if (keyword in fakerKeywords) {
    const options = JSON.stringify(args)
    return `${value}(${options ?? ''})`
  }

  return '""'
}

export function fakerParser(items: FakerMeta[], options: { name: string; typeName?: string | null }): string {
  if (!items.length) {
    return `
      export function ${options.name}()${options.typeName ? `: ${options.typeName}` : ''} {
        return undefined;
      }
    `
  }

  return `
    export function ${options.name}()${options.typeName ? `: ${options.typeName}` : ''} {
      return ${items.map(parseFakerMeta).join('')};
    }
  `
}
