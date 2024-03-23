import transformers, { createJSDocBlockText } from '@kubb/core/transformers'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { Schema, SchemaKeywordBase, SchemaMapper } from '@kubb/swagger'

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
  const: 'z.literal',
  datetime: 'z.string().datetime',
  date: 'z.date',
  uuid: '.uuid',
  url: '.url',
  strict: '.strict',
  default: '.default',
  and: '.and',
  describe: '.describe',
  min: '.min',
  max: '.max',
  optional: '.optional',
  matches: '.regex',
  email: '.email',
  firstName: undefined,
  lastName: undefined,
  password: undefined,
  phone: undefined,
  readOnly: undefined,
  ref: 'ref',
  blob: undefined,
  deprecated: undefined,
  example: undefined,
  type: undefined,
  format: undefined,
  catchall: '.catchall',
} satisfies SchemaMapper

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function sort(items?: Schema[]): Schema[] {
  const order: string[] = [
    schemaKeywords.object,
    schemaKeywords.describe,
    schemaKeywords.optional,
    schemaKeywords.nullable,
    schemaKeywords.nullish,
    schemaKeywords.null,
  ]

  if (!items) {
    return []
  }

  return transformers.orderBy(items, [(v) => order.indexOf(v.keyword)], ['asc'])
}

type ParserOptions = {
  name: string
  typeName?: string
  description?: string

  keysToOmit?: string[]
  mapper?: typeof zodKeywordMapper
}

export function parseZodMeta(item: Schema, options: ParserOptions): string | undefined {
  const mapper = options.mapper || zodKeywordMapper
  const value = mapper[item.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.union)) {
    // zod union type needs at least 2 items
    if (Array.isArray(item.args) && item.args.length === 1) {
      return parseZodMeta(item.args[0] as Schema, options)
    }
    if (Array.isArray(item.args) && !item.args.length) {
      return ''
    }

    return `${value}([${sort(item.args).map((unionItem) => parseZodMeta(unionItem, options)).filter(Boolean).join(',')}])`
  }

  if (isKeyword(item, schemaKeywords.and)) {
    return sort(item.args).filter((item: Schema) => {
      return ![schemaKeywords.optional, schemaKeywords.describe].includes(item.keyword as typeof schemaKeywords.describe)
    })
      .map((item: Schema) => parseZodMeta(item, options))
      .filter(Boolean)
      .map((item, index) => (index === 0 ? item : `${value}(${item})`))
      .join('')
  }

  if (isKeyword(item, schemaKeywords.array)) {
    return [
      `${value}(${sort(item.args.items).map((arrayItem) => parseZodMeta(arrayItem, options)).filter(Boolean).join(', ')})`,
      item.args.min ? `${mapper.min}(${item.args.min})` : undefined,
      item.args.max ? `${mapper.max}(${item.args.max})` : undefined,
    ].filter(Boolean).join('')
  }

  if (isKeyword(item, schemaKeywords.enum)) {
    if (item.args.asConst) {
      return `${zodKeywordMapper.union}([${
        item.args.items.map(item => {
          return parseZodMeta({
            keyword: schemaKeywords.const,
            args: item,
          }, options)
        }).join(', ')
      }])`
    }

    return `${value}([${
      item.args.items.map(item => {
        if (item.format === 'number') {
          return transformers.stringify(item.value)
        }
        return transformers.stringify(item.value)
      }).join(', ')
    }])`
  }

  if (isKeyword(item, schemaKeywords.ref)) {
    return `${mapper.lazy}(() => ${item.args?.name})`
  }

  if (isKeyword(item, schemaKeywords.object)) {
    const properties = Object.entries(item.args?.properties || {})
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schema = item[1]

        return `"${name}": ${
          sort(schema)
            .map((item) => parseZodMeta(item, options))
            .filter(Boolean)
            .join('')
        }`
      })
      .join(',')

    const additionalProperties = item.args?.additionalProperties.length
      ? item.args.additionalProperties.map(schema => parseZodMeta(schema, options)).filter(Boolean).at(0)
      : undefined

    const text = [
      `${value}({${properties}})`,
      item.args?.strict ? `${mapper.strict}()` : undefined,
      additionalProperties ? `${mapper.catchall}(${additionalProperties})` : undefined,
    ].filter(Boolean)

    return text.join('')
  }

  if (isKeyword(item, schemaKeywords.tuple)) {
    return `${value}([${sort(item.args).map((arrayItem) => parseZodMeta(arrayItem, options)).filter(Boolean).join(', ')}])`
  }

  if (isKeyword(item, schemaKeywords.const)) {
    if (item.args.format === 'number') {
      return `${value}(${transformers.toNumber(item.args.value)})`
    }
    return `${value}(${transformers.stringify(item.args.value)})`
  }

  if (isKeyword(item, schemaKeywords.matches)) {
    if (item.args) {
      return `${value}(${transformers.toRegExpString(item.args)})`
    }
  }

  if (isKeyword(item, schemaKeywords.default)) {
    if (item.args) {
      return `${value}(${item.args})`
    }
  }

  if (isKeyword(item, schemaKeywords.describe)) {
    if (item.args) {
      return `${value}(${transformers.stringify(item.args.toString())})`
    }
  }

  if (item.keyword in mapper && 'args' in item) {
    return `${value}(${(item as SchemaKeywordBase<unknown>).args as string})`
  }

  if (item.keyword in mapper) {
    return `${value}()`
  }

  return undefined
}
export function zodParser(
  schemas: Schema[],
  options: ParserOptions,
): string {
  if (!schemas.length) {
    return `export const ${options.name} = '';`
  }

  const sortedSchemas = sort(schemas)

  const JSDoc = createJSDocBlockText({
    comments: [options.description ? `@description ${options.description}` : undefined].filter(Boolean),
  })

  const constName = `${JSDoc}\nexport const ${options.name}`
  const typeName = options.typeName ? ` as z.ZodType<${options.typeName}>` : ''

  if (options.keysToOmit?.length) {
    const omitText = `.schema.and(z.object({ ${options.keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))`
    return `${constName} = ${sortedSchemas.map((item) => parseZodMeta(item, options)).filter(Boolean).join('')}${omitText}${typeName};`
  }

  return `${constName} = ${sortedSchemas.map((item) => parseZodMeta(item, options)).filter(Boolean).join('')}${typeName}\n`

  // const root = createRoot()

  // if (!schemas.length) {
  //   root.render(
  //     <Text.Const
  //       export
  //       name={options.name}
  //       JSDoc={{ comments: [describeSchema ? `@description ${transformers.stringify(describeSchema.args)}` : undefined].filter(Boolean) }}
  //     >
  //       {'undefined'}
  //     </Text.Const>,
  //   )
  // } else {
  //   root.render(
  //     <Text.Const
  //       export
  //       name={options.name}
  //       JSDoc={{ comments: [describeSchema ? `@description ${transformers.stringify(describeSchema.args)}` : undefined].filter(Boolean) }}
  //     >
  //       {[
  //         sortedItems.map((item) => parseZodMeta(item, options)).filter(Boolean).join(''),
  //         options.keysToOmit?.length ? `.schema.and(z.object({ ${options.keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))` : undefined,
  //         options.typeName ? ` as z.ZodType<${options.typeName}>` : '',
  //       ].filter(Boolean).join('') || ''}
  //     </Text.Const>,
  //   )
  // }

  // return root.output
}
