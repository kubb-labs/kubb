import transformers, { createJSDocBlockText } from '@kubb/core/transformers'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { Schema, SchemaKeywordBase, SchemaMapper } from '@kubb/swagger'

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
  date: () => 'faker.date.anytime()',
  datetime: () => 'faker.date.anytime().toISOString()',
  uuid: () => 'faker.string.uuid()',
  url: () => 'faker.internet.url()',
  and: (items: string[] = []) => `Object.assign({}, ${items.join(', ')})`,
  object: () => 'object',
  ref: () => 'ref',
  matches: (value = '') => `faker.helpers.fromRegExp(${value})`,
  email: () => 'faker.internet.email()',
  firstName: () => 'faker.person.firstName()',
  lastName: () => 'faker.person.lastName()',
  password: () => 'faker.internet.password()',
  phone: () => 'faker.phone.number()',
  blob: undefined,
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
  type: undefined,
  format: undefined,
  catchall: undefined,
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

function joinItems(items: string[], mapper: typeof fakerKeywordMapper): string {
  switch (items.length) {
    case 0:
      return 'undefined'
    case 1:
      return items[0]!
    default:
      return mapper.union(items)
  }
}

type ParserOptions = {
  name: string
  typeName?: string
  description?: string

  seed?: number | number[]
  withOverride?: boolean
  mapper?: typeof fakerKeywordMapper
}

export function parseFakerMeta(item: Schema, options: ParserOptions): string | null | undefined {
  const mapper = { ...fakerKeywordMapper, ...options.mapper }
  const value = mapper[item.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.union)) {
    return mapper.union(item.args.map((orItem) => parseFakerMeta(orItem, { ...options, withOverride: false })).filter(Boolean))
  }

  if (isKeyword(item, schemaKeywords.and)) {
    return mapper.and(item.args.map((andItem) => parseFakerMeta(andItem, { ...options, withOverride: false })).filter(Boolean))
  }

  if (isKeyword(item, schemaKeywords.array)) {
    return mapper.array(item.args.items.map((orItem) => parseFakerMeta(orItem, { ...options, withOverride: false })).filter(Boolean))
  }

  if (isKeyword(item, schemaKeywords.enum)) {
    return mapper.enum(
      item.args.items.map((item) => {
        if (item.format === 'number') {
          return item.name
        }
        return transformers.stringify(item.name)
      }),
    )
  }

  if (isKeyword(item, schemaKeywords.ref)) {
    if (!item.args?.name) {
      throw new Error(`Name not defined for keyword ${item.keyword}`)
    }

    if (options.withOverride) {
      return `${item.args.name}(override)`
    }

    return `${item.args.name}()`
  }

  if (isKeyword(item, schemaKeywords.object)) {
    const argsObject = Object.entries(item.args?.properties || {})
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schema = item[1]

        return `"${name}": ${joinItems(
          schema
            .sort(schemaKeywordsorter)
            .map((item) => parseFakerMeta(item, { ...options, withOverride: false }))
            .filter(Boolean),
          mapper,
        )}`
      })
      .join(',')

    return `{${argsObject}}`
  }

  if (isKeyword(item, schemaKeywords.tuple)) {
    if (Array.isArray(item.args)) {
      return mapper.tuple(item.args.map((orItem) => parseFakerMeta(orItem, { ...options, withOverride: false })).filter(Boolean))
    }

    return parseFakerMeta(item.args, { ...options, withOverride: false })
  }

  if (isKeyword(item, schemaKeywords.const)) {
    if (item.args.format === 'number' && item.args.name !== undefined) {
      return mapper.const(item.args.name?.toString())
    }
    return mapper.const(transformers.stringify(item.args.value))
  }

  if (isKeyword(item, schemaKeywords.matches)) {
    if (item.args) {
      return mapper.matches(transformers.toRegExpString(item.args))
    }
  }

  if (isKeyword(item, schemaKeywords.null) || isKeyword(item, schemaKeywords.undefined) || isKeyword(item, schemaKeywords.any)) {
    return value() || ''
  }

  if (isKeyword(item, schemaKeywords.string)) {
    return mapper.string(item.args?.min, item.args?.max)
  }

  if (isKeyword(item, schemaKeywords.number)) {
    return mapper.number(item.args?.min, item.args?.max)
  }

  if (isKeyword(item, schemaKeywords.integer)) {
    return mapper.integer(item.args?.min, item.args?.max)
  }

  if (item.keyword in mapper && 'args' in item) {
    const value = mapper[item.keyword as keyof typeof mapper] as (typeof fakerKeywordMapper)['const']

    const options = JSON.stringify((item as SchemaKeywordBase<unknown>).args)

    return value(options)
  }

  if (item.keyword in mapper) {
    return value()
  }

  return undefined
}

export function fakerParser(schemas: Schema[], options: ParserOptions): string {
  const mapper = { ...fakerKeywordMapper, ...options.mapper }
  const fakerText = joinItems(schemas.map((item) => parseFakerMeta(item, { ...options, withOverride: true })).filter(Boolean), mapper)

  let fakerDefaultOverride: '' | '[]' | '{}' = ''
  let fakerTextWithOverride = fakerText

  if (fakerText.startsWith('{')) {
    fakerDefaultOverride = '{}'
    fakerTextWithOverride = `{
  ...${fakerText},
  ...override
}`
  }

  if (fakerText.startsWith('faker.helpers.arrayElements')) {
    fakerDefaultOverride = '[]'
    fakerTextWithOverride = `[
      ...${fakerText},
      ...override
    ]`
  }

  const JSDoc = createJSDocBlockText({
    comments: [options.description ? `@description ${transformers.jsStringEscape(options.description)}` : undefined].filter(Boolean),
  })

  return `
${JSDoc}
export function ${options.name}(${
    fakerDefaultOverride
      ? `override: NonNullable<Partial<${options.typeName}>> = ${fakerDefaultOverride}`
      : `override?: NonNullable<Partial<${options.typeName}>>`
  })${options.typeName ? `: NonNullable<${options.typeName}>` : ''} {
  ${options.seed ? `faker.seed(${JSON.stringify(options.seed)})` : ''}
  return ${fakerTextWithOverride}
}\n`

  // const root = createRoot()

  // root.render(
  //   <Function
  //     export
  //     name={options.name}
  //     JSDoc={{ comments: [describeSchema ? `@description ${transformers.stringify(describeSchema.args)}` : undefined].filter(Boolean) }}
  //     params={fakerDefaultOverride
  //       ? `override: NonNullable<Partial<${options.typeName}>> = ${fakerDefaultOverride}`
  //       : `override?: NonNullable<Partial<${options.typeName}>>`}
  //     returnType={options.typeName ? `NonNullable<${options.typeName}>` : ''}
  //   >
  //     {options.seed ? `faker.seed(${JSON.stringify(options.seed)})` : ''}

  //     {`return ${fakerTextWithOverride}`}
  //   </Function>,
  // )

  // return root.output
}
