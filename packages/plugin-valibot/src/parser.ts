import transformers from '@kubb/core/transformers'

import type { SchemaObject } from '@kubb/oas'
import type { Schema, SchemaMapper } from '@kubb/plugin-oas'
import { isKeyword, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'

const valibotKeywordMapper = {
  any: () => 'v.any()',
  unknown: () => 'v.unknown()',
  void: () => 'v.undefined()',
  number: (min?: number, max?: number, exclusiveMinimum?: number, exclusiveMaximum?: number) => {
    const checks: string[] = []
    if (min !== undefined) checks.push(`v.minValue(${min})`)
    if (max !== undefined) checks.push(`v.maxValue(${max})`)
    if (exclusiveMinimum !== undefined) checks.push(`v.minValue(${exclusiveMinimum + 1})`)
    if (exclusiveMaximum !== undefined) checks.push(`v.maxValue(${exclusiveMaximum - 1})`)
    
    if (checks.length > 0) {
      return `v.pipe(v.number(), ${checks.join(', ')})`
    }
    return 'v.number()'
  },
  integer: (min?: number, max?: number, exclusiveMinimum?: number, exclusiveMaximum?: number) => {
    const checks: string[] = ['v.integer()']
    if (min !== undefined) checks.push(`v.minValue(${min})`)
    if (max !== undefined) checks.push(`v.maxValue(${max})`)
    if (exclusiveMinimum !== undefined) checks.push(`v.minValue(${exclusiveMinimum + 1})`)
    if (exclusiveMaximum !== undefined) checks.push(`v.maxValue(${exclusiveMaximum - 1})`)
    
    if (checks.length > 1) {
      return `v.pipe(v.number(), ${checks.join(', ')})`
    }
    return 'v.pipe(v.number(), v.integer())'
  },
  object: (value?: string, strict?: boolean) => {
    if (strict) {
      return `v.strictObject({
    ${value}
    })`
    }

    return `v.object({
    ${value}
    })`
  },
  string: (min?: number, max?: number) => {
    const checks: string[] = []
    if (min !== undefined) checks.push(`v.minLength(${min})`)
    if (max !== undefined) checks.push(`v.maxLength(${max})`)
    
    if (checks.length > 0) {
      return `v.pipe(v.string(), ${checks.join(', ')})`
    }
    return 'v.string()'
  },
  boolean: () => 'v.boolean()',
  undefined: () => 'v.undefined()',
  nullable: (value?: string) => {
    if (value) {
      return `v.nullable(${value})`
    }
    return undefined
  },
  null: () => 'v.null()',
  nullish: (value?: string) => {
    if (value) {
      return `v.nullish(${value})`
    }
    return undefined
  },
  array: (items: string[] = [], min?: number, max?: number, _unique?: boolean) => {
    const checks: string[] = []
    if (min !== undefined) checks.push(`v.minLength(${min})`)
    if (max !== undefined) checks.push(`v.maxLength(${max})`)
    
    if (checks.length > 0) {
      return `v.pipe(v.array(${items?.join('')}), ${checks.join(', ')})`
    }
    return `v.array(${items?.join('')})`
  },
  tuple: (items: string[] = []) => `v.tuple([${items?.join(', ')}])`,
  enum: (items: string[] = []) => `v.picklist([${items?.join(', ')}])`,
  union: (items: string[] = []) => `v.union([${items?.join(', ')}])`,
  const: (value?: string | number | boolean) => `v.literal(${value ?? ''})`,
  datetime: () => {
    return `v.pipe(v.string(), v.isoDateTime())`
  },
  date: (type: 'date' | 'string' = 'string') => {
    if (type === 'string') {
      return 'v.pipe(v.string(), v.isoDate())'
    }
    return 'v.date()'
  },
  time: (type: 'date' | 'string' = 'string') => {
    if (type === 'string') {
      return 'v.pipe(v.string(), v.isoTime())'
    }
    return 'v.date()'
  },
  uuid: (min?: number, max?: number) => {
    const checks: string[] = ['v.uuid()']
    if (min !== undefined) checks.push(`v.minLength(${min})`)
    if (max !== undefined) checks.push(`v.maxLength(${max})`)
    
    if (checks.length > 1) {
      return `v.pipe(v.string(), ${checks.join(', ')})`
    }
    return 'v.pipe(v.string(), v.uuid())'
  },
  url: (min?: number, max?: number) => {
    const checks: string[] = ['v.url()']
    if (min !== undefined) checks.push(`v.minLength(${min})`)
    if (max !== undefined) checks.push(`v.maxLength(${max})`)
    
    if (checks.length > 1) {
      return `v.pipe(v.string(), ${checks.join(', ')})`
    }
    return 'v.pipe(v.string(), v.url())'
  },
  default: (value?: string | number | true | object) => {
    if (typeof value === 'object') {
      return ', {}'
    }
    return `, ${value ?? ''}`
  },
  and: (items: string[] = []) => items?.map((item) => `v.intersect([${item}])`).join(''),
  describe: undefined,
  max: undefined,
  min: undefined,
  optional: (value?: string) => {
    if (value) {
      return `v.optional(${value})`
    }
    return undefined
  },
  matches: (value = '') => {
    // value is the regex pattern string, we need to convert it to a RegExp literal
    return `v.pipe(v.string(), v.regex(${value}))`
  },
  email: (min?: number, max?: number) => {
    const checks: string[] = ['v.email()']
    if (min !== undefined) checks.push(`v.minLength(${min})`)
    if (max !== undefined) checks.push(`v.maxLength(${max})`)
    
    if (checks.length > 1) {
      return `v.pipe(v.string(), ${checks.join(', ')})`
    }
    return 'v.pipe(v.string(), v.email())'
  },
  firstName: undefined,
  lastName: undefined,
  password: undefined,
  phone: undefined,
  readOnly: undefined,
  writeOnly: undefined,
  ref: (value?: string) => {
    if (!value) {
      return undefined
    }
    return `v.lazy(() => ${value})`
  },
  blob: () => 'v.instance(File)',
  deprecated: undefined,
  example: undefined,
  schema: undefined,
  catchall: undefined,
  name: undefined,
  exclusiveMinimum: undefined,
  exclusiveMaximum: undefined,
  interface: undefined,
} satisfies SchemaMapper<string | null | undefined>

type ParserOptions = {
  /**
   * Mapper to set for a specific JSONSchema(example mapping to a custom Valibot validation)
   */
  mapper: Record<string, string>
  dateType: 'string' | 'date'
}

type Context = {
  schema: SchemaObject
  parent: Schema | undefined
  current: Schema
  siblings: Schema[]
  name?: string
}

export function parse(context: Context, options: ParserOptions): string | undefined {
  const { schema, siblings, current, name } = context
  const { dateType } = options

  if (isKeyword(current, schemaKeywords.union)) {
    // Union args is an array of schemas
    if (Array.isArray(current.args) && current.args.length === 1) {
      return parse({ ...context, current: current.args[0] as Schema }, options)
    }
    if (Array.isArray(current.args) && !current.args.length) {
      return ''
    }

    const items = sort(current.args as Schema[])
      .map((it) => parse({ schema, parent: current, name, current: it, siblings: current.args as Schema[] }, options))
      .filter(Boolean)
    return valibotKeywordMapper.union(items)
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    const items = current.args.items.map((schema: any) => {
      if (schema.format === 'boolean') {
        return transformers.stringify(schema.value)
      }
      if (schema.format === 'number') {
        return transformers.stringify(schema.value)
      }
      return transformers.stringify(schema.value)
    })
    return valibotKeywordMapper.enum(items)
  }

  if (isKeyword(current, schemaKeywords.and)) {
    const items = sort(current.args as Schema[])
      .filter((schema: Schema) => {
        return ![schemaKeywords.optional].includes(schema.keyword as any)
      })
      .map((it: Schema) => parse({ schema, parent: current, name, current: it, siblings: current.args as Schema[] }, options))
      .filter(Boolean)

    return `${items.slice(0, 1)}${valibotKeywordMapper.and(items.slice(1))}`
  }

  if (isKeyword(current, schemaKeywords.array)) {
    const items = sort(current.args.items)
      .map((it) => parse({ schema, parent: current, name, current: it, siblings: current.args.items }, options))
      .filter(Boolean)

    return valibotKeywordMapper.array(items, current.args.min, current.args.max, current.args.unique)
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    const items = sort(current.args.items || [])
      .map((it) => parse({ schema, parent: current, name, current: it, siblings: current.args.items || [] }, options))
      .filter(Boolean)
    return valibotKeywordMapper.tuple(items)
  }

  if (isKeyword(current, schemaKeywords.object)) {
    const propertyEntries = Object.entries(current.args?.properties || {}).filter((item) => {
      const schema = item[1]
      return schema && typeof schema.map === 'function'
    })

    const properties = propertyEntries
      .map(([propertyName, schemas]: [string, any]) => {
        const nameSchema = schemas.find((it: any) => it.keyword === schemaKeywords.name) as any
        const isOptional = schemas.some((it: any) => isKeyword(it, schemaKeywords.optional))
        const mappedName = nameSchema?.args || propertyName

        // custom mapper(pluginOptions)
        if (options.mapper?.[mappedName]) {
          return `"${propertyName}": ${options.mapper?.[mappedName]}`
        }

        const baseSchemaOutput = sort(schemas)
          .filter((schema: Schema) => {
            return !isKeyword(schema, schemaKeywords.optional) && !isKeyword(schema, schemaKeywords.nullable) && !isKeyword(schema, schemaKeywords.nullish)
          })
          .map((it: Schema) => parse({ schema, parent: current, name, current: it, siblings: schemas }, options))
          .filter(Boolean)
          .join('')

        if (isOptional) {
          return `"${propertyName}": v.optional(${baseSchemaOutput})`
        }

        return `"${propertyName}": ${baseSchemaOutput}`
      })
      .filter(Boolean)

    return valibotKeywordMapper.object(properties.join(',\n    '), current.args?.strict)
  }

  if (isKeyword(current, schemaKeywords.ref)) {
    return valibotKeywordMapper.ref(current.args?.name)
  }

  if (isKeyword(current, schemaKeywords.const)) {
    return valibotKeywordMapper.const(current.args as any)
  }

  if (isKeyword(current, schemaKeywords.string)) {
    const min = SchemaGenerator.find(siblings, schemaKeywords.min)?.args as number | undefined
    const max = SchemaGenerator.find(siblings, schemaKeywords.max)?.args as number | undefined

    return valibotKeywordMapper.string(min, max)
  }

  if (isKeyword(current, schemaKeywords.number)) {
    const min = SchemaGenerator.find(siblings, schemaKeywords.min)?.args as number | undefined
    const max = SchemaGenerator.find(siblings, schemaKeywords.max)?.args as number | undefined
    const exclusiveMinimum = SchemaGenerator.find(siblings, schemaKeywords.exclusiveMinimum)?.args as number | undefined
    const exclusiveMaximum = SchemaGenerator.find(siblings, schemaKeywords.exclusiveMaximum)?.args as number | undefined

    return valibotKeywordMapper.number(min, max, exclusiveMinimum, exclusiveMaximum)
  }

  if (isKeyword(current, schemaKeywords.integer)) {
    const min = SchemaGenerator.find(siblings, schemaKeywords.min)?.args as number | undefined
    const max = SchemaGenerator.find(siblings, schemaKeywords.max)?.args as number | undefined
    const exclusiveMinimum = SchemaGenerator.find(siblings, schemaKeywords.exclusiveMinimum)?.args as number | undefined
    const exclusiveMaximum = SchemaGenerator.find(siblings, schemaKeywords.exclusiveMaximum)?.args as number | undefined

    return valibotKeywordMapper.integer(min, max, exclusiveMinimum, exclusiveMaximum)
  }

  if (isKeyword(current, schemaKeywords.boolean)) {
    return valibotKeywordMapper.boolean()
  }

  if (isKeyword(current, schemaKeywords.any)) {
    return valibotKeywordMapper.any()
  }

  if (isKeyword(current, schemaKeywords.unknown)) {
    return valibotKeywordMapper.unknown()
  }

  if (isKeyword(current, schemaKeywords.void)) {
    return valibotKeywordMapper.void()
  }

  if (isKeyword(current, schemaKeywords.null)) {
    return valibotKeywordMapper.null()
  }

  if (isKeyword(current, schemaKeywords.nullish)) {
    const item = siblings.find((sibling) => !isKeyword(sibling, schemaKeywords.nullish))

    if (item) {
      const value = parse({ ...context, current: item }, options)
      return valibotKeywordMapper.nullish(value)
    }

    return valibotKeywordMapper.nullish()
  }

  if (isKeyword(current, schemaKeywords.nullable)) {
    const item = siblings.find((sibling) => !isKeyword(sibling, schemaKeywords.nullable))

    if (item) {
      const value = parse({ ...context, current: item }, options)
      return valibotKeywordMapper.nullable(value)
    }

    return valibotKeywordMapper.nullable()
  }

  if (isKeyword(current, schemaKeywords.optional)) {
    const item = siblings.find((sibling) => !isKeyword(sibling, schemaKeywords.optional) && !isKeyword(sibling, schemaKeywords.default))

    if (item) {
      const value = parse({ ...context, current: item }, options)
      return valibotKeywordMapper.optional(value)
    }

    return valibotKeywordMapper.optional()
  }

  if (isKeyword(current, schemaKeywords.datetime)) {
    return valibotKeywordMapper.datetime()
  }

  if (isKeyword(current, schemaKeywords.date)) {
    return valibotKeywordMapper.date(dateType)
  }

  if (isKeyword(current, schemaKeywords.time)) {
    return valibotKeywordMapper.time(dateType)
  }

  if (isKeyword(current, schemaKeywords.uuid)) {
    const min = SchemaGenerator.find(siblings, schemaKeywords.min)?.args as number | undefined
    const max = SchemaGenerator.find(siblings, schemaKeywords.max)?.args as number | undefined

    return valibotKeywordMapper.uuid(min, max)
  }

  if (isKeyword(current, schemaKeywords.url)) {
    const min = SchemaGenerator.find(siblings, schemaKeywords.min)?.args as number | undefined
    const max = SchemaGenerator.find(siblings, schemaKeywords.max)?.args as number | undefined

    return valibotKeywordMapper.url(min, max)
  }

  if (isKeyword(current, schemaKeywords.email)) {
    const min = SchemaGenerator.find(siblings, schemaKeywords.min)?.args as number | undefined
    const max = SchemaGenerator.find(siblings, schemaKeywords.max)?.args as number | undefined

    return valibotKeywordMapper.email(min, max)
  }

  if (isKeyword(current, schemaKeywords.matches)) {
    if (current.args) {
      return valibotKeywordMapper.matches(transformers.toRegExpString(current.args, null))
    }
  }

  if (isKeyword(current, schemaKeywords.blob)) {
    return valibotKeywordMapper.blob()
  }

  return undefined
}

export function sort(items: Schema[]): Schema[] {
  const order: string[] = [
    schemaKeywords.string,
    schemaKeywords.datetime,
    schemaKeywords.date,
    schemaKeywords.time,
    schemaKeywords.tuple,
    schemaKeywords.number,
    schemaKeywords.object,
    schemaKeywords.enum,
    schemaKeywords.url,
    schemaKeywords.email,
    schemaKeywords.firstName,
    schemaKeywords.lastName,
    schemaKeywords.password,
    schemaKeywords.matches,
    schemaKeywords.uuid,
    schemaKeywords.null,
    schemaKeywords.min,
    schemaKeywords.max,
    schemaKeywords.default,
    schemaKeywords.optional,
    schemaKeywords.nullable,
    schemaKeywords.nullish,
  ]

  if (!items) {
    return []
  }

  return transformers.orderBy(items, [(v) => order.indexOf(v.keyword)], ['asc'])
}
