import transformers, { createJSDocBlockText } from '@kubb/core/transformers'
import { SchemaGenerator, isKeyword, schemaKeywords } from '@kubb/swagger'

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
    return [`z.array(${items?.join('')})`, min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined]
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
  mapper?: Record<string, string>
}

export function parseZodMeta(parent: Schema | undefined, current: Schema, options: ParserOptions): string | undefined {
  const value = zodKeywordMapper[current.keyword as keyof typeof zodKeywordMapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    // zod union type needs at least 2 items
    if (Array.isArray(current.args) && current.args.length === 1) {
      return parseZodMeta(parent, current.args[0] as Schema, options)
    }
    if (Array.isArray(current.args) && !current.args.length) {
      return ''
    }

    return zodKeywordMapper.union(
      sort(current.args)
        .map((schema) => parseZodMeta(current, schema, options))
        .filter(Boolean),
    )
  }

  if (isKeyword(current, schemaKeywords.and)) {
    const items = sort(current.args)
      .filter((schema: Schema) => {
        return ![schemaKeywords.optional, schemaKeywords.describe].includes(schema.keyword as typeof schemaKeywords.describe)
      })
      .map((schema: Schema) => parseZodMeta(current, schema, options))
      .filter(Boolean)

    return `${items.slice(0, 1)}${zodKeywordMapper.and(items.slice(1))}`
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return zodKeywordMapper.array(
      sort(current.args.items)
        .map((schemas) => parseZodMeta(current, schemas, options))
        .filter(Boolean),
      current.args.min,
      current.args.max,
    )
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    if (current.args.asConst) {
      return zodKeywordMapper.union(
        current.args.items
          .map((schema) => {
            return parseZodMeta(
              current,
              {
                keyword: schemaKeywords.const,
                args: schema,
              },
              options,
            )
          })
          .filter(Boolean),
      )
    }

    return zodKeywordMapper.enum(
      current.args.items.map((schema) => {
        if (schema.format === 'number') {
          return transformers.stringify(schema.value)
        }
        return transformers.stringify(schema.value)
      }),
    )
  }

  if (isKeyword(current, schemaKeywords.ref)) {
    return zodKeywordMapper.ref(current.args?.name)
  }

  if (isKeyword(current, schemaKeywords.object)) {
    const properties = Object.entries(current.args?.properties || {})
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schemas = item[1]

        // custom mapper(pluginOptions)
        if (options.mapper?.[name]) {
          return `"${name}": ${options.mapper?.[name]}`
        }

        return `"${name}": ${sort(schemas)
          .map((schema) => parseZodMeta(current, schema, options))
          .filter(Boolean)
          .join('')}`
      })
      .join(',')

    const additionalProperties = current.args?.additionalProperties?.length
      ? current.args.additionalProperties
          .map((schema) => parseZodMeta(current, schema, options))
          .filter(Boolean)
          .at(0)
      : undefined

    const text = [
      zodKeywordMapper.object(properties),
      current.args?.strict ? zodKeywordMapper.strict() : undefined,
      additionalProperties ? zodKeywordMapper.catchall(additionalProperties) : undefined,
    ].filter(Boolean)

    return text.join('')
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    return zodKeywordMapper.tuple(
      sort(current.args)
        .map((schema) => parseZodMeta(current, schema, options))
        .filter(Boolean),
    )
  }

  if (isKeyword(current, schemaKeywords.const)) {
    if (current.args.format === 'number' && current.args.value !== undefined) {
      return zodKeywordMapper.const(Number.parseInt(current.args.value?.toString()))
    }
    return zodKeywordMapper.const(transformers.stringify(current.args.value))
  }

  if (isKeyword(current, schemaKeywords.matches)) {
    if (current.args) {
      return zodKeywordMapper.matches(transformers.toRegExpString(current.args))
    }
  }

  if (isKeyword(current, schemaKeywords.default)) {
    if (current.args) {
      return zodKeywordMapper.default(current.args)
    }
  }

  if (isKeyword(current, schemaKeywords.describe)) {
    if (current.args) {
      return zodKeywordMapper.describe(transformers.stringify(current.args.toString()))
    }
  }

  if (isKeyword(current, schemaKeywords.string)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return zodKeywordMapper.string(minSchema?.args, maxSchema?.args)
    }

    return zodKeywordMapper.string()
  }

  if (isKeyword(current, schemaKeywords.number) || isKeyword(current, schemaKeywords.integer)) {
    if (parent) {
      const minSchema = SchemaGenerator.find([parent], schemaKeywords.min)
      const maxSchema = SchemaGenerator.find([parent], schemaKeywords.max)

      return zodKeywordMapper.number(minSchema?.args, maxSchema?.args)
    }
    return zodKeywordMapper.number()
  }

  if (isKeyword(current, schemaKeywords.min) || isKeyword(current, schemaKeywords.max)) {
    return undefined
  }

  if (current.keyword in zodKeywordMapper && 'args' in current) {
    const value = zodKeywordMapper[current.keyword as keyof typeof zodKeywordMapper] as (typeof zodKeywordMapper)['const']

    return value((current as SchemaKeywordBase<unknown>).args as any)
  }

  if (current.keyword in zodKeywordMapper) {
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
    .map((item) => parseZodMeta(undefined, item, options))
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
