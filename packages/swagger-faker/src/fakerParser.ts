export type FakerMetaMapper = {
  object: { keyword: 'object'; args: { entries: { [x: string]: FakerMeta[] }; strict?: boolean } }
  url: { keyword: 'url' }
  uuid: { keyword: 'uuid' }
  email: { keyword: 'email' }
  firstName: { keyword: 'firstName' }
  lastName: { keyword: 'lastName' }
  phone: { keyword: 'phone' }
  password: { keyword: 'password' }
  datetime: { keyword: 'datetime' }
  tuple: { keyword: 'tuple'; args?: FakerMeta[] }
  array: { keyword: 'array'; args?: FakerMeta[] }
  enum: { keyword: 'enum'; args?: Array<string | number> }
  and: { keyword: 'and'; args?: FakerMeta[] }
  union: { keyword: 'union'; args?: FakerMeta[] }
  ref: { keyword: 'ref'; args?: { name: string } }
  catchall: { keyword: 'catchall'; args?: FakerMeta[] }
  matches: { keyword: 'matches'; args?: string }
  boolean: { keyword: 'boolean' }
  string: { keyword: 'string'; args?: { min?: number; max?: number } }
  integer: { keyword: 'integer'; args?: { min?: number; max?: number } }
  number: { keyword: 'number'; args?: { min?: number; max?: number } }
  undefined: { keyword: 'undefined' }
  null: { keyword: 'null' }
  any: { keyword: 'any' }
  unknown: { keyword: 'unknown' }
}

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
} satisfies { [K in keyof FakerMetaMapper]: FakerMetaMapper[K]['keyword'] }

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
} satisfies { [K in keyof FakerMetaMapper]: string }

type FakerMetaBase<T> = {
  keyword: FakerKeyword
  args: T
}

export type FakerMeta =
  | { keyword: string }
  | FakerMetaMapper[keyof FakerMetaMapper]

export function isKeyword<T extends FakerMeta, K extends keyof FakerMetaMapper>(meta: T, keyword: K): meta is Extract<T, FakerMetaMapper[K]> {
  return meta.keyword === keyword
}

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
  item: FakerMeta = {} as FakerMeta,
  { mapper = fakerKeywordMapper, withOverride }: { mapper?: Record<FakerKeyword, string>; withOverride?: boolean } = {},
): string {
  const value = mapper[item.keyword as keyof typeof mapper]

  if (isKeyword(item, fakerKeywords.tuple) || isKeyword(item, fakerKeywords.array) || isKeyword(item, fakerKeywords.union)) {
    return `${value}(${
      Array.isArray(item.args)
        ? `[${item.args.map((orItem) => parseFakerMeta(orItem, { mapper })).join(',')}]`
        : parseFakerMeta(item.args)
    }) as any`
  }

  if (isKeyword(item, fakerKeywords.and)) {
    return `${value}({},${
      Array.isArray(item.args) ? `${item.args.map((andItem) => parseFakerMeta(andItem, { mapper })).join(',')}` : parseFakerMeta(item.args)
    })`
  }

  if (isKeyword(item, fakerKeywords.enum)) {
    return `${value}(${Array.isArray(item.args) ? `${item.args.join(',')}` : parseFakerMeta(item.args)})`
  }

  if (isKeyword(item, fakerKeywords.catchall)) {
    throw new Error('catchall is not implemented')
  }

  if (isKeyword(item, fakerKeywords.object)) {
    const argsObject = Object.entries(item.args?.entries || '{}')
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schema = item[1]
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
  if (isKeyword(item, fakerKeywords.ref)) {
    if (!item.args?.name) {
      throw new Error(`Name not defined for keyword ${item.keyword}`)
    }

    if (withOverride) {
      return `${item.args.name}(override)`
    }
    return `${item.args.name}()`
  }

  if (isKeyword(item, fakerKeywords.null) || isKeyword(item, fakerKeywords.undefined) || isKeyword(item, fakerKeywords.any)) {
    return value
  }

  if (isKeyword(item, fakerKeywords.matches)) {
    const options = (item as FakerMetaBase<unknown>).args as string
    let regex
    try {
      regex = new RegExp(options)
    } catch (_e) {
      regex = JSON.stringify(options)
    }

    return `${value}(${regex ?? ''})`
  }

  if (item.keyword in mapper) {
    const options = JSON.stringify((item as FakerMetaBase<unknown>).args)
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
    fakerDefaultOverride
      ? `override: NonNullable<Partial<${options.typeName}>> = ${fakerDefaultOverride}`
      : `override?: NonNullable<Partial<${options.typeName}>>`
  })${options.typeName ? `: NonNullable<${options.typeName}>` : ''} {
  ${options.seed ? `faker.seed(${JSON.stringify(options.seed)})` : ''}
  return ${fakerTextWithOverride};
}
  `
}
