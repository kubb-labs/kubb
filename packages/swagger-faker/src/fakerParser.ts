import transformers from '@kubb/core/transformers'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { Schema, SchemaKeywordBase, SchemaMapper } from '@kubb/swagger'

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
  date: 'faker.date.anytime',
  datetime: 'faker.string.alpha',
  uuid: 'faker.string.uuid',
  url: 'faker.internet.url',
  and: 'Object.assign',
  object: 'object',
  ref: 'ref',
  catchall: 'catchall',
  matches: 'faker.helpers.fromRegExp',
  email: 'faker.internet.email',
  firstName: 'faker.person.firstName',
  lastName: 'faker.person.lastName',
  password: 'faker.internet.password',
  phone: 'faker.phone.number',
  blob: undefined,
  default: undefined,
  describe: undefined,
  lazy: undefined,
  literal: undefined,
  max: undefined,
  min: undefined,
  nullable: undefined,
  nullish: undefined,
  optional: undefined,
  readOnly: undefined,
  strict: undefined,
} satisfies SchemaMapper

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function schemaKeywordsorter(a: Schema, b: Schema) {
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
  item: Schema = {} as Schema,
  { mapper = fakerKeywordMapper, withOverride }: { mapper?: SchemaMapper; withOverride?: boolean } = {},
): string | undefined {
  const value = mapper[item.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.union)) {
    return `${value}([${item.args.map((orItem) => parseFakerMeta(orItem, { mapper })).filter(Boolean).join(',')}]`
  }

  if (isKeyword(item, schemaKeywords.array)) {
    return `${value}([${item.args.map((orItem) => parseFakerMeta(orItem, { mapper })).filter(Boolean).join(',')}] as any`
  }

  if (isKeyword(item, schemaKeywords.tuple)) {
    return `${value}(${
      Array.isArray(item.args)
        ? `[${item.args.map((orItem) => parseFakerMeta(orItem, { mapper })).filter(Boolean).join(',')}]`
        : parseFakerMeta(item.args)
    }) as any`
  }

  if (isKeyword(item, schemaKeywords.and)) {
    return `${value}({},${item.args.map((andItem) => parseFakerMeta(andItem, { mapper })).filter(Boolean).join(',')})`
  }

  if (isKeyword(item, schemaKeywords.enum)) {
    return `${value}(${
      Array.isArray(item.args)
        ? `[${
          item.args.map(item => {
            if (item.format === 'number') {
              return item.name
            }
            return transformers.stringify(item.name)
          }).join(', ')
        }]`
        : parseFakerMeta(item.args)
    })`
  }

  if (isKeyword(item, schemaKeywords.catchall)) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.object)) {
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
              .sort(schemaKeywordsorter)
              .map((item) => parseFakerMeta(item, { mapper }))
              .filter(Boolean),
          )
        }`
      })
      .join(',')

    return `{${argsObject}}`
  }

  if (isKeyword(item, schemaKeywords.literal)) {
    if (item.args.format === 'number') {
      return item.args.name?.toString()
    }
    return transformers.stringify(item.args.value)
  }

  if (isKeyword(item, schemaKeywords.ref)) {
    if (!item.args?.name) {
      throw new Error(`Name not defined for keyword ${item.keyword}`)
    }

    if (withOverride) {
      return `${item.args.name}(override)`
    }
    return `${item.args.name}()`
  }

  if (isKeyword(item, schemaKeywords.null) || isKeyword(item, schemaKeywords.undefined) || isKeyword(item, schemaKeywords.any)) {
    return value || ''
  }

  if (isKeyword(item, schemaKeywords.matches)) {
    if (item.args) {
      return `${value}(${transformers.toRegExpString(item.args)})`
    }
  }

  if (item.keyword in mapper) {
    const options = JSON.stringify((item as SchemaKeywordBase<unknown>).args)
    return `${value}(${options ?? ''})`
  }

  return undefined
}

export function fakerParser(
  items: Schema[],
  options: { seed?: number | number[]; mapper?: SchemaMapper; name: string; typeName?: string | null },
): string {
  const fakerText = joinItems(
    items.map((item) => parseFakerMeta(item, { mapper: { ...fakerKeywordMapper, ...options.mapper }, withOverride: true })).filter(Boolean),
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
