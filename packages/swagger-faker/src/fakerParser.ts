export const fakerKeywords = {
  any: 'any',
  unknown: 'unknown',
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

export const fakerKeywordMapper = {
  any: 'undefined',
  unknown: 'unknown',
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
} as const satisfies Record<FakerKeyword, string>

type FakerMetaBase<T> = {
  keyword: FakerKeyword
  args: T
}

type FakerMetaUnknown = { keyword: typeof fakerKeywords.unknown }

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
  | { keyword: string }
  | FakerMetaUnknown
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
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function fakerKeywordSorter(a: FakerMeta, b: FakerMeta) {
  if (b.keyword === 'null') {
    return -1
  }

  return 0
}

function joinItems(items: string[]): string {
  switch (items.length) {
    case 0:
      return 'undefined'
    case 1:
      return items[0]!
    default:
      return `${fakerKeywordMapper.union}([${items.join(',')}])`
  }
}

export function parseFakerMeta(
  item: FakerMeta,
  { mapper = fakerKeywordMapper, withOverride }: { mapper?: Record<FakerKeyword, string>; withOverride?: boolean } = {},
): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args } = (item || {}) as FakerMetaBase<unknown>
  const value = mapper[keyword]

  if (keyword === fakerKeywords.tuple || keyword === fakerKeywords.array || keyword === fakerKeywords.union) {
    return `${value}(${
      Array.isArray(args) ? `[${args.map((item) => parseFakerMeta(item as FakerMeta, { mapper })).join(',')}]` : parseFakerMeta(args as FakerMeta)
    }) as any`
  }

  if (keyword === fakerKeywords.and) {
    return `${value}({},${
      Array.isArray(args) ? `${args.map((item) => parseFakerMeta(item as FakerMeta, { mapper })).join(',')}` : parseFakerMeta(args as FakerMeta)
    })`
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
        const name = item[0]
        const schema = item[1] as FakerMeta[]
        return `"${name}": ${
          joinItems(
            schema
              .sort(fakerKeywordSorter)
              .map((item) => parseFakerMeta(item, { mapper })),
          )
        }`
      })
      .join(',')

    return `{${argsObject}}`
  }

  // custom type
  if (keyword === fakerKeywords.ref) {
    if (withOverride) {
      return `${args as string}(override)`
    }
    return `${args as string}()`
  }

  if (keyword === fakerKeywords.null || keyword === fakerKeywords.undefined || keyword === fakerKeywords.any) {
    return value
  }

  if (keyword in mapper) {
    const options = JSON.stringify(args)
    return `${value}(${options ?? ''})`
  }

  return '""'
}

export function fakerParser(
  items: FakerMeta[],
  options: { seed?: number | number[]; mapper?: Record<FakerKeyword, string>; name: string; typeName?: string | null },
): string {
  const fakerText = joinItems(
    items.map((item) => parseFakerMeta(item, { mapper: { ...fakerKeywordMapper, ...options.mapper }, withOverride: true })),
  )

  let fakerDefaultOverride: '' | '[]' | '{}' = ''
  let fakerTextWithOverride = fakerText

  if (fakerText.startsWith('{')) {
    fakerDefaultOverride = '{}'
    fakerTextWithOverride = `{
  ...${fakerText},
  ...override
}`
  }

  if (fakerText.startsWith(fakerKeywordMapper.array)) {
    fakerDefaultOverride = '[]'
    fakerTextWithOverride = `[
      ...${fakerText},
      ...override
    ]`
  }

  return `
export function ${options.name}(${
    fakerDefaultOverride ? `override: Partial<${options.typeName}> = ${fakerDefaultOverride}` : `override?: Partial<${options.typeName}>`
  })${options.typeName ? `: NonNullable<${options.typeName}>` : ''} {
  ${options.seed ? `faker.seed(${JSON.stringify(options.seed)})` : ''}
  return ${fakerTextWithOverride};
}
  `
}
