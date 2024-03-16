import transformers from '@kubb/core/transformers'
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
  literal: 'z.literal',
  datetime: 'z.string().datetime',
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
} satisfies SchemaMapper

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function zodKeywordSorter(a: Schema, b: Schema): 1 | -1 | 0 {
  if (b.keyword === schemaKeywords.null) {
    return -1
  }

  return 0
}

export function parseZodMeta(item: Schema = {} as Schema, mapper: SchemaMapper = zodKeywordMapper): string | undefined {
  const value = mapper[item.keyword as keyof typeof mapper]

  if (isKeyword(item, schemaKeywords.tuple)) {
    return `${value}(${
      Array.isArray(item.args) ? `[${item.args.map((tupleItem) => parseZodMeta(tupleItem, mapper)).filter(Boolean).join(',')}]` : parseZodMeta(item.args)
    })`
  }

  if (isKeyword(item, schemaKeywords.enum)) {
    return `${value}(${
      Array.isArray(item.args)
        ? `[${
          item.args.map(item => {
            if (item.format === 'number') {
              return item.value
            }
            return transformers.stringify(item.value)
          }).join(',')
        }]`
        : parseZodMeta(item.args)
    })`
  }

  if (isKeyword(item, schemaKeywords.array)) {
    return `${value}(${
      Array.isArray(item.args) ? `${item.args.map((arrayItem) => parseZodMeta(arrayItem, mapper)).filter(Boolean).join('')}` : parseZodMeta(item.args)
    })`
  }
  if (isKeyword(item, schemaKeywords.union)) {
    // zod union type needs at least 2 items
    if (Array.isArray(item.args) && item.args.length === 1) {
      return parseZodMeta(item.args[0] as Schema)
    }
    if (Array.isArray(item.args) && !item.args.length) {
      return ''
    }

    return `${
      Array.isArray(item.args)
        ? `${value}([${item.args.map((unionItem) => parseZodMeta(unionItem, mapper)).filter(Boolean).join(',')}])`
        : parseZodMeta(item.args)
    }`
  }

  if (isKeyword(item, schemaKeywords.catchall)) {
    return `${value}(${
      Array.isArray(item.args) ? `${item.args.map((catchAllItem) => parseZodMeta(catchAllItem, mapper)).filter(Boolean).join('')}` : parseZodMeta(item.args)
    })`
  }

  if (isKeyword(item, schemaKeywords.and)) {
    return `${
      item.args
        ?.filter((item: Schema) => {
          return ![schemaKeywords.optional, schemaKeywords.describe].includes(item.keyword as typeof schemaKeywords.describe)
        })
        .map((item: Schema) => parseZodMeta(item, mapper))
        .filter(Boolean)
        .map((item, index) => (index === 0 ? item : `${value}(${item})`))
        .join('')
    }`
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
          schema
            .sort(zodKeywordSorter)
            .map((item) => parseZodMeta(item, mapper))
            .filter(Boolean)
            .join('')
        }`
      })
      .join(',')

    if (item.args?.strict) {
      return `${value}({${argsObject}}).strict()`
    }

    return `${value}({${argsObject}})`
  }

  if (isKeyword(item, schemaKeywords.literal)) {
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

  if (isKeyword(item, schemaKeywords.ref)) {
    return `${mapper.lazy}(() => ${item.args?.name})`
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
  items: Schema[],
  options: { required?: boolean; keysToOmit?: string[]; mapper?: SchemaMapper; name: string; typeName?: string },
): string {
  if (!items.length) {
    return `export const ${options.name} = '';`
  }

  const constName = `export const ${options.name}`
  const typeName = options.typeName ? ` as z.ZodType<${options.typeName}>` : ''

  if (options.keysToOmit?.length) {
    const omitText = `.schema.and(z.object({ ${options.keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))`
    return `${constName} = ${
      items.map((item) => parseZodMeta(item, { ...zodKeywordMapper, ...options.mapper })).filter(Boolean).join('')
    }${omitText}${typeName};`
  }

  return `${constName} = ${items.map((item) => parseZodMeta(item, { ...zodKeywordMapper, ...options.mapper })).filter(Boolean).join('')}${typeName};`
}
