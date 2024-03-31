import transformers, { createJSDocBlockText } from '@kubb/core/transformers'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { Schema, SchemaKeywordBase, SchemaMapper } from '@kubb/swagger'

export const zodKeywordMapper = {
  any: () => 'z.any()',
  unknown: () => 'z.unknown()',
  number: (min?: number, max?: number) => {
    return ['z.number()', min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined].filter(Boolean).join('')
  },
  integer: (min?: number, max?: number) => {
    return ['z.number()', min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined].filter(Boolean).join('')
  },
  object: (value?: string) => `z.object({${value}})`,
  string: (min?: number, max?: number) => {
    return ['z.string()', min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined].filter(Boolean).join('')
  },
  boolean: () => 'z.boolean()',
  undefined: () => 'z.undefined()',
  nullable: () => '.nullable()',
  null: () => 'z.null()',
  nullish: () => '.nullish()',
  array: (items: string[] = [], min?: number, max?: number) => {
    return [`z.array(${items?.join(', ')})`, min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined]
      .filter(Boolean)
      .join('')
  },
  tuple: (items: string[] = []) => `z.tuple([${items?.join(', ')}])`,
  enum: (items: string[] = []) => `z.enum([${items?.join(', ')}])`,
  union: (items: string[] = []) => `z.union([${items?.join(', ')}])`,
  const: (value?: string | number) => `z.literal(${value ?? ''})`,
  datetime: () => 'z.string().datetime()',
  date: () => 'z.date()',
  uuid: () => '.uuid()',
  url: () => '.url()',
  strict: () => '.strict()',
  default: (value?: string | number | true) => `.default(${value ?? ''})`,
  and: (items: string[] = []) => items?.map((item) => `.and(${item})`).join(''),
  describe: (value = '') => `.describe(${value})`,
  min: (value?: number) => `.min(${value ?? ''})`,
  max: (value?: number) => `.max(${value ?? ''})`,
  optional: () => '.optional()',
  matches: (value = '') => `.regex(${value})`,
  email: () => '.email()',
  firstName: undefined,
  lastName: undefined,
  password: undefined,
  phone: undefined,
  readOnly: undefined,
  ref: (value?: string) => (value ? `z.lazy(() => ${value})` : undefined),
  blob: undefined,
  deprecated: undefined,
  example: undefined,
  type: undefined,
  format: undefined,
  catchall: (value?: string) => (value ? `.catchall(${value})` : undefined),
} satisfies SchemaMapper<string | null | undefined>

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function sort(items?: Schema[]): Schema[] {
  const order: string[] = [
    schemaKeywords.string,
    schemaKeywords.number,
    schemaKeywords.object,
    schemaKeywords.url,
    schemaKeywords.email,
    schemaKeywords.firstName,
    schemaKeywords.lastName,
    schemaKeywords.password,
    schemaKeywords.matches,
    schemaKeywords.uuid,
    schemaKeywords.min,
    schemaKeywords.max,
    schemaKeywords.default,
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
  const mapper = { ...zodKeywordMapper, ...options.mapper }
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

    return mapper.union(
      sort(item.args)
        .map((unionItem) => parseZodMeta(unionItem, options))
        .filter(Boolean),
    )
  }

  if (isKeyword(item, schemaKeywords.and)) {
    const items = sort(item.args)
      .filter((item: Schema) => {
        return ![schemaKeywords.optional, schemaKeywords.describe].includes(item.keyword as typeof schemaKeywords.describe)
      })
      .map((item: Schema) => parseZodMeta(item, options))
      .filter(Boolean)

    return `${items.slice(0, 1)}${mapper.and(items.slice(1))}`
  }

  if (isKeyword(item, schemaKeywords.array)) {
    return [
      mapper.array(
        sort(item.args.items)
          .map((arrayItem) => parseZodMeta(arrayItem, options))
          .filter(Boolean),
        item.args.min,
        item.args.max,
      ),
    ]
      .filter(Boolean)
      .join('')
  }

  if (isKeyword(item, schemaKeywords.enum)) {
    if (item.args.asConst) {
      return mapper.union(
        item.args.items
          .map((item) => {
            return parseZodMeta(
              {
                keyword: schemaKeywords.const,
                args: item,
              },
              options,
            )
          })
          .filter(Boolean),
      )
    }

    return mapper.enum(
      item.args.items.map((item) => {
        if (item.format === 'number') {
          return transformers.stringify(item.value)
        }
        return transformers.stringify(item.value)
      }),
    )
  }

  if (isKeyword(item, schemaKeywords.ref)) {
    return mapper.ref(item.args?.name)
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

        return `"${name}": ${sort(schema)
          .map((item) => parseZodMeta(item, options))
          .filter(Boolean)
          .join('')}`
      })
      .join(',')

    const additionalProperties = item.args?.additionalProperties?.length
      ? item.args.additionalProperties
          .map((schema) => parseZodMeta(schema, options))
          .filter(Boolean)
          .at(0)
      : undefined

    const text = [
      mapper.object(properties),
      item.args?.strict ? mapper.strict() : undefined,
      additionalProperties ? mapper.catchall(additionalProperties) : undefined,
    ].filter(Boolean)

    return text.join('')
  }

  if (isKeyword(item, schemaKeywords.tuple)) {
    return mapper.tuple(
      sort(item.args)
        .map((arrayItem) => parseZodMeta(arrayItem, options))
        .filter(Boolean),
    )
  }

  if (isKeyword(item, schemaKeywords.const)) {
    if (item.args.format === 'number') {
      return mapper.const(transformers.toNumber(item.args.value))
    }
    return mapper.const(transformers.stringify(item.args.value))
  }

  if (isKeyword(item, schemaKeywords.matches)) {
    if (item.args) {
      return mapper.matches(transformers.toRegExpString(item.args))
    }
  }

  if (isKeyword(item, schemaKeywords.default)) {
    if (item.args) {
      return mapper.default(item.args)
    }
  }

  if (isKeyword(item, schemaKeywords.describe)) {
    if (item.args) {
      return mapper.describe(transformers.stringify(item.args.toString()))
    }
  }

  if (isKeyword(item, schemaKeywords.string)) {
    return mapper.string(item.args?.min, item.args?.max)
  }

  if (isKeyword(item, schemaKeywords.number) || isKeyword(item, schemaKeywords.integer)) {
    return mapper.number(item.args?.min, item.args?.max)
  }

  if (item.keyword in mapper && 'args' in item) {
    const value = mapper[item.keyword as keyof typeof mapper] as (typeof zodKeywordMapper)['const']

    return value((item as SchemaKeywordBase<unknown>).args as any)
  }

  if (item.keyword in mapper) {
    return value()
  }

  return undefined
}
export function zodParser(schemas: Schema[], options: ParserOptions): string {
  if (!schemas.length) {
    return `export const ${options.name} = '';`
  }

  const sortedSchemas = sort(schemas)

  const JSDoc = createJSDocBlockText({
    comments: [options.description ? `@description ${transformers.jsStringEscape(options.description)}` : undefined].filter(Boolean),
  })

  const constName = `${JSDoc}\nexport const ${options.name}`
  const typeName = options.typeName ? ` as z.ZodType<${options.typeName}>` : ''
  const output = sortedSchemas
    .map((item) => parseZodMeta(item, options))
    .filter(Boolean)
    .join('')

  if (options.keysToOmit?.length) {
    const suffix = output.endsWith('.nullable()') ? '.unwrap().schema.and' : '.schema.and'
    const omitText = `${suffix}(z.object({ ${options.keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))`
    return `${constName} = ${output}${omitText}${typeName}\n`
  }

  return `${constName} = ${output}${typeName}\n`

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
