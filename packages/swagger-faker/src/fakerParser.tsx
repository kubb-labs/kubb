import transformers, { createJSDocBlockText } from '@kubb/core/transformers'
import { SchemaGenerator, isKeyword, schemaKeywords } from '@kubb/swagger'

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

export function parseFakerMeta(parent: Schema | undefined, current: Schema, options: ParserOptions): string | null | undefined {
  const mapper = { ...fakerKeywordMapper, ...options.mapper }
  const value = mapper[current.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    return mapper.union(current.args.map((schema) => parseFakerMeta(current, schema, { ...options, withOverride: false })).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.and)) {
    return mapper.and(current.args.map((schema) => parseFakerMeta(current, schema, { ...options, withOverride: false })).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return mapper.array(current.args.items.map((schema) => parseFakerMeta(current, schema, { ...options, withOverride: false })).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    return mapper.enum(
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

    if (options.withOverride) {
      return `${current.args.name}(override)`
    }

    return `${current.args.name}()`
  }

  if (isKeyword(current, schemaKeywords.object)) {
    const argsObject = Object.entries(current.args?.properties || {})
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schemas = item[1]

        return `"${name}": ${joinItems(
          schemas
            .sort(schemaKeywordsorter)
            .map((schema) => parseFakerMeta(current, schema, { ...options, withOverride: false }))
            .filter(Boolean),
          mapper,
        )}`
      })
      .join(',')

    return `{${argsObject}}`
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    if (Array.isArray(current.args)) {
      return mapper.tuple(current.args.map((schema) => parseFakerMeta(current, schema, { ...options, withOverride: false })).filter(Boolean))
    }

    return parseFakerMeta(current, current.args, { ...options, withOverride: false })
  }

  if (isKeyword(current, schemaKeywords.const)) {
    if (current.args.format === 'number' && current.args.name !== undefined) {
      return mapper.const(current.args.name?.toString())
    }
    return mapper.const(transformers.stringify(current.args.value))
  }

  if (isKeyword(current, schemaKeywords.matches)) {
    if (current.args) {
      return mapper.matches(transformers.toRegExpString(current.args))
    }
  }

  if (isKeyword(current, schemaKeywords.null) || isKeyword(current, schemaKeywords.undefined) || isKeyword(current, schemaKeywords.any)) {
    return value() || ''
  }

  if (isKeyword(current, schemaKeywords.string)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return mapper.string(minSchema?.args, maxSchema?.args)
    }

    return mapper.string()
  }

  if (isKeyword(current, schemaKeywords.number)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return mapper.number(minSchema?.args, maxSchema?.args)
    }

    return mapper.number()
  }

  if (isKeyword(current, schemaKeywords.integer)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return mapper.integer(minSchema?.args, maxSchema?.args)
    }

    return mapper.integer()
  }

  if (current.keyword in mapper && 'args' in current) {
    const value = mapper[current.keyword as keyof typeof mapper] as (typeof fakerKeywordMapper)['const']

    const options = JSON.stringify((current as SchemaKeywordBase<unknown>).args)

    return value(options)
  }

  if (current.keyword in mapper) {
    return value()
  }

  return undefined
}

export function fakerParser(schemas: Schema[], options: ParserOptions): string {
  const mapper = { ...fakerKeywordMapper, ...options.mapper }
  const fakerText = joinItems(schemas.map((schema) => parseFakerMeta(undefined, schema, { ...options, withOverride: true })).filter(Boolean), mapper)

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
