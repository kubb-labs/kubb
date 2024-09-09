import transformers from '@kubb/core/transformers'
import { SchemaGenerator, isKeyword, schemaKeywords } from '@kubb/plugin-oas'

import type { Schema, SchemaKeywordBase, SchemaKeywordMapper, SchemaMapper } from '@kubb/plugin-oas'
import type { Options } from '../types.ts'

export const fakerKeywordMapper = {
  any: () => 'undefined',
  unknown: () => 'unknown',
  number: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.number.float({ min: ${min}, max: ${max} })`
    }

    if (min !== undefined) {
      return `faker.number.float({ min: ${min} })`
    }

    if (max !== undefined) {
      return `faker.number.float({ max: ${max} })`
    }

    return 'faker.number.float()'
  },
  integer: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.number.int({ min: ${min}, max: ${max} })`
    }

    if (min !== undefined) {
      return `faker.number.int({ min: ${min} })`
    }

    if (max !== undefined) {
      return `faker.number.int({ max: ${max} })`
    }

    return 'faker.number.int()'
  },
  string: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.string.alpha({ length: { min: ${min}, max: ${max} } })`
    }

    if (min !== undefined) {
      return `faker.string.alpha({ length: { min: ${min} } })`
    }

    if (max !== undefined) {
      return `faker.string.alpha({ length: { max: ${max} } })`
    }

    return 'faker.string.alpha()'
  },
  boolean: () => 'faker.datatype.boolean()',
  undefined: () => 'undefined',
  null: () => 'null',
  array: (items: string[] = []) => `faker.helpers.arrayElements([${items.join(', ')}]) as any`,
  tuple: (items: string[] = []) => `faker.helpers.arrayElements([${items.join(', ')}]) as any`,
  enum: (items: Array<string | number> = []) => `faker.helpers.arrayElement<any>([${items.join(', ')}])`,
  union: (items: string[] = []) => `faker.helpers.arrayElement<any>([${items.join(', ')}])`,
  /**
   * ISO 8601
   */
  datetime: () => 'faker.date.anytime().toISOString()',
  /**
   * Type `'date'` Date
   * Type `'string'` ISO date format (YYYY-MM-DD)
   * @default ISO date format (YYYY-MM-DD)
   */
  date: (type: 'date' | 'string' = 'string', parser: Options['dateParser'] = 'faker') => {
    if (type === 'string') {
      if (parser !== 'faker') {
        return `${parser}(faker.date.anytime()).format("YYYY-MM-DD")`
      }
      return 'faker.date.anytime().toString()'
    }

    if (parser !== 'faker') {
      throw new Error(`type '${type}' and parser '${parser}' can not work together`)
    }

    return 'faker.date.anytime()'
  },
  /**
   * Type `'date'` Date
   * Type `'string'` ISO time format (HH:mm:ss[.SSSSSS])
   * @default ISO time format (HH:mm:ss[.SSSSSS])
   */
  time: (type: 'date' | 'string' = 'string', parser: Options['dateParser'] = 'faker') => {
    if (type === 'string') {
      if (parser !== 'faker') {
        return `${parser}(faker.date.anytime()).format("HH:mm:ss")`
      }
      return 'faker.date.anytime().toString()'
    }

    if (parser !== 'faker') {
      throw new Error(`type '${type}' and parser '${parser}' can not work together`)
    }

    return 'faker.date.anytime()'
  },
  uuid: () => 'faker.string.uuid()',
  url: () => 'faker.internet.url()',
  and: (items: string[] = []) => `Object.assign({}, ${items.join(', ')})`,
  object: () => 'object',
  ref: () => 'ref',
  matches: (value = '', regexGenerator: 'faker' | 'randexp' = 'faker') => {
    if (regexGenerator === 'randexp') {
      return `${transformers.toRegExpString(value, 'RandExp')}.gen()`
    }
    return `faker.helpers.fromRegExp(${transformers.toRegExpString(value)})`
  },
  email: () => 'faker.internet.email()',
  firstName: () => 'faker.person.firstName()',
  lastName: () => 'faker.person.lastName()',
  password: () => 'faker.internet.password()',
  phone: () => 'faker.phone.number()',
  blob: () => 'faker.image.imageUrl() as unknown as Blob',
  default: undefined,
  describe: undefined,
  const: (value?: string | number) => (value as string) ?? '',
  max: undefined,
  min: undefined,
  nullable: undefined,
  nullish: undefined,
  optional: undefined,
  readOnly: undefined,
  strict: undefined,
  deprecated: undefined,
  example: undefined,
  schema: undefined,
  catchall: undefined,
  name: undefined,
} satisfies SchemaMapper<string | null | undefined>

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function schemaKeywordsorter(a: Schema, b: Schema) {
  if (b.keyword === 'null') {
    return -1
  }

  return 0
}

export function joinItems(items: string[]): string {
  switch (items.length) {
    case 0:
      return 'undefined'
    case 1:
      return items[0]!
    default:
      return fakerKeywordMapper.union(items)
  }
}

type ParserOptions = {
  name: string
  typeName?: string
  description?: string

  seed?: number | number[]
  regexGenerator?: 'faker' | 'randexp'
  canOverride?: boolean
  dateParser?: Options['dateParser']
  mapper?: Record<string, string>
}

export function parse(parent: Schema | undefined, current: Schema, options: ParserOptions): string | null | undefined {
  const value = fakerKeywordMapper[current.keyword as keyof typeof fakerKeywordMapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    return fakerKeywordMapper.union(current.args.map((schema) => parse(current, schema, { ...options, canOverride: false })).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.and)) {
    return fakerKeywordMapper.and(current.args.map((schema) => parse(current, schema, { ...options, canOverride: false })).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return fakerKeywordMapper.array(current.args.items.map((schema) => parse(current, schema, { ...options, canOverride: false })).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    return fakerKeywordMapper.enum(
      current.args.items.map((schema) => {
        if (schema.format === 'number') {
          return schema.name
        }
        return transformers.stringify(schema.name)
      }),
    )
  }

  if (isKeyword(current, schemaKeywords.ref)) {
    if (!current.args?.name) {
      throw new Error(`Name not defined for keyword ${current.keyword}`)
    }

    if (options.canOverride) {
      return `${current.args.name}(data)`
    }

    return `${current.args.name}()`
  }

  if (isKeyword(current, schemaKeywords.object)) {
    const argsObject = Object.entries(current.args?.properties || {})
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map(([name, schemas]) => {
        const nameSchema = schemas.find((schema) => schema.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']
        const mappedName = nameSchema?.args || name

        // custom mapper(pluginOptions)
        if (options.mapper?.[mappedName]) {
          return `"${name}": ${options.mapper?.[mappedName]}`
        }

        return `"${name}": ${joinItems(
          schemas
            .sort(schemaKeywordsorter)
            .map((schema) => parse(current, schema, { ...options, canOverride: false }))
            .filter(Boolean),
        )}`
      })
      .join(',')

    return `{${argsObject}}`
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    if (Array.isArray(current.args.items)) {
      return fakerKeywordMapper.tuple(current.args.items.map((schema) => parse(current, schema, { ...options, canOverride: false })).filter(Boolean))
    }

    return parse(current, current.args.items, { ...options, canOverride: false })
  }

  if (isKeyword(current, schemaKeywords.const)) {
    if (current.args.format === 'number' && current.args.name !== undefined) {
      return fakerKeywordMapper.const(current.args.name?.toString())
    }
    return fakerKeywordMapper.const(transformers.stringify(current.args.value))
  }

  if (isKeyword(current, schemaKeywords.matches) && current.args) {
    return fakerKeywordMapper.matches(current.args, options.regexGenerator)
  }

  if (isKeyword(current, schemaKeywords.null) || isKeyword(current, schemaKeywords.undefined) || isKeyword(current, schemaKeywords.any)) {
    return value() || ''
  }

  if (isKeyword(current, schemaKeywords.string)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return fakerKeywordMapper.string(minSchema?.args, maxSchema?.args)
    }

    return fakerKeywordMapper.string()
  }

  if (isKeyword(current, schemaKeywords.number)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return fakerKeywordMapper.number(minSchema?.args, maxSchema?.args)
    }

    return fakerKeywordMapper.number()
  }

  if (isKeyword(current, schemaKeywords.integer)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return fakerKeywordMapper.integer(minSchema?.args, maxSchema?.args)
    }

    return fakerKeywordMapper.integer()
  }

  if (isKeyword(current, schemaKeywords.datetime)) {
    return fakerKeywordMapper.datetime()
  }

  if (isKeyword(current, schemaKeywords.date)) {
    return fakerKeywordMapper.date(current.args.type, options.dateParser)
  }

  if (isKeyword(current, schemaKeywords.time)) {
    return fakerKeywordMapper.time(current.args.type, options.dateParser)
  }

  if (current.keyword in fakerKeywordMapper && 'args' in current) {
    const value = fakerKeywordMapper[current.keyword as keyof typeof fakerKeywordMapper] as (typeof fakerKeywordMapper)['const']

    const options = JSON.stringify((current as SchemaKeywordBase<unknown>).args)

    return value(options)
  }

  if (current.keyword in fakerKeywordMapper) {
    return value()
  }

  return undefined
}
