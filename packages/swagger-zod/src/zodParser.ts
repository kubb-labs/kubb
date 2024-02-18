export type ZodMetaMapper = {
  object: { keyword: 'object'; args: { entries: { [x: string]: ZodMeta[] }; strict?: boolean } }
  strict: { keyword: 'strict' }
  readOnly: { keyword: 'readOnly' }
  url: { keyword: 'url' }
  uuid: { keyword: 'uuid' }
  email: { keyword: 'email' }
  date: { keyword: 'date' }
  datetime: { keyword: 'datetime' }
  default: { keyword: 'default'; args?: string | number | boolean }
  lazy: { keyword: 'lazy' }
  tuple: { keyword: 'tuple'; args?: ZodMeta[] }
  array: { keyword: 'array'; args?: ZodMeta[] }
  enum: { keyword: 'enum'; args?: Array<string | number> }
  and: { keyword: 'and'; args?: ZodMeta[] }
  literal: { keyword: 'literal'; args: string | number }
  union: { keyword: 'union'; args?: ZodMeta[] }
  ref: { keyword: 'ref'; args?: { name: string } }
  catchall: { keyword: 'catchall'; args?: ZodMeta[] }
  optional: { keyword: 'optional' }
  matches: { keyword: 'matches'; args?: string }
  max: { keyword: 'max'; args?: number }
  min: { keyword: 'min'; args?: number }
  describe: { keyword: 'describe'; args?: string }
  boolean: { keyword: 'boolean' }
  string: { keyword: 'string' }
  integer: { keyword: 'integer' }
  number: { keyword: 'number' }
  undefined: { keyword: 'undefined' }
  nullish: { keyword: 'nullish' }
  nullable: { keyword: 'nullable' }
  null: { keyword: 'null' }
  any: { keyword: 'any' }
  unknown: { keyword: 'unknown' }
}

export const zodKeywords = {
  any: 'any',
  unknown: 'unknown',
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
  date: 'date',
  email: 'email',
  uuid: 'uuid',
  url: 'url',
  strict: 'strict',
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
} satisfies { [K in keyof ZodMetaMapper]: ZodMetaMapper[K]['keyword'] }

export type ZodKeyword = keyof typeof zodKeywords

export const zodKeywordMapper = {
  any: 'z.any',
  unknown: 'z.unknown',
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
  date: 'z.date',
  email: '.email',
  uuid: '.uuid',
  url: '.url',
  strict: '.strict',
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
} satisfies { [K in keyof ZodMetaMapper]: string }

type ZodMetaBase<T> = {
  keyword: ZodKeyword
  args: T
}

export function isKeyword<T extends ZodMeta, K extends keyof ZodMetaMapper>(meta: T, keyword: K): meta is Extract<T, ZodMetaMapper[K]> {
  return meta.keyword === keyword
}

export type ZodMeta =
  | { keyword: string }
  | ZodMetaMapper[keyof ZodMetaMapper]

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function zodKeywordSorter(a: ZodMeta, b: ZodMeta): 1 | -1 | 0 {
  if (b.keyword === zodKeywords.null) {
    return -1
  }

  return 0
}

export function parseZodMeta(item: ZodMeta = {} as ZodMeta, mapper: Record<ZodKeyword, string> = zodKeywordMapper): string {
  const value = mapper[item.keyword as keyof typeof mapper]

  if (isKeyword(item, zodKeywords.tuple)) {
    return `${value}(${Array.isArray(item.args) ? `[${item.args.map((tupleItem) => parseZodMeta(tupleItem, mapper)).join(',')}]` : parseZodMeta(item.args)})`
  }

  if (isKeyword(item, zodKeywords.enum)) {
    return `${value}(${Array.isArray(item.args) ? `[${item.args.join(',')}]` : parseZodMeta(item.args)})`
  }

  if (isKeyword(item, zodKeywords.array)) {
    return `${value}(${Array.isArray(item.args) ? `${item.args.map((arrayItem) => parseZodMeta(arrayItem, mapper)).join('')}` : parseZodMeta(item.args)})`
  }
  if (isKeyword(item, zodKeywords.union)) {
    // zod union type needs at least 2 items
    if (Array.isArray(item.args) && item.args.length === 1) {
      return parseZodMeta(item.args[0] as ZodMeta)
    }
    if (Array.isArray(item.args) && !item.args.length) {
      return ''
    }

    return `${Array.isArray(item.args) ? `${value}([${item.args.map((unionItem) => parseZodMeta(unionItem, mapper)).join(',')}])` : parseZodMeta(item.args)}`
  }

  if (isKeyword(item, zodKeywords.catchall)) {
    return `${value}(${Array.isArray(item.args) ? `${item.args.map((catchAllItem) => parseZodMeta(catchAllItem, mapper)).join('')}` : parseZodMeta(item.args)})`
  }

  if (isKeyword(item, zodKeywords.and)) {
    return `${
      item.args
        ?.filter((item: ZodMeta) => {
          return ![zodKeywords.optional, zodKeywords.describe].includes(item.keyword as typeof zodKeywords.optional | typeof zodKeywords.describe)
        })
        .map((item: ZodMeta) => parseZodMeta(item, mapper))
        .filter(Boolean)
        .map((item, index) => (index === 0 ? item : `${value}(${item})`))
        .join('')
    }`
  }

  if (isKeyword(item, zodKeywords.object)) {
    const argsObject = Object.entries(item.args?.entries || '{}')
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schema = item[1]
        return `"${name}": ${
          schema
            .sort(zodKeywordSorter)
            .map((item) => parseZodMeta(item, mapper))
            .join('')
        }`
      })
      .join(',')

    if (item.args?.strict) {
      return `${value}({${argsObject}}).strict()`
    }

    return `${value}({${argsObject}})`
  }

  // custom type
  if (isKeyword(item, zodKeywords.ref)) {
    return `${mapper.lazy}(() => ${item.args?.name})`
  }

  if (item.keyword in mapper && 'args' in item) {
    return `${value}(${(item as ZodMetaBase<unknown>).args as string})`
  }

  if (item.keyword in mapper) {
    return `${value}()`
  }

  return '""'
}

export function zodParser(
  items: ZodMeta[],
  options: { required?: boolean; keysToOmit?: string[]; mapper?: Record<ZodKeyword, string>; name: string; typeName?: string },
): string {
  if (!items.length) {
    return `export const ${options.name} = '';`
  }

  const constName = `export const ${options.name}`
  const typeName = options.typeName ? ` as z.ZodType<${options.typeName}>` : ''

  if (options.keysToOmit?.length) {
    const omitText = `.schema.and(z.object({ ${options.keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))`
    return `${constName} = ${items.map((item) => parseZodMeta(item, { ...zodKeywordMapper, ...options.mapper })).join('')}${omitText}${typeName};`
  }

  return `${constName} = ${items.map((item) => parseZodMeta(item, { ...zodKeywordMapper, ...options.mapper })).join('')}${typeName};`
}
