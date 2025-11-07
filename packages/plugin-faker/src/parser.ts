import transformers from '@kubb/core/transformers'
import type { Schema, SchemaKeywordBase, SchemaKeywordMapper, SchemaMapper } from '@kubb/plugin-oas'
import { createSchemaKeywordMap, getSchemaByKeyword, isKeyword, SchemaGenerator, type SchemaTree, schemaKeywords } from '@kubb/plugin-oas'
import type { Options } from './types.ts'

const fakerKeywordMapper = {
  any: () => 'undefined',
  unknown: () => 'undefined',
  void: () => 'undefined',
  number: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.number.float({ min: ${min}, max: ${max} })`
    }

    if (max !== undefined) {
      return `faker.number.float({ max: ${max} })`
    }

    if (min !== undefined) {
      return `faker.number.float({ min: ${min} })`
    }

    return 'faker.number.float()'
  },
  integer: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.number.int({ min: ${min}, max: ${max} })`
    }

    if (max !== undefined) {
      return `faker.number.int({ max: ${max} })`
    }

    if (min !== undefined) {
      return `faker.number.int({ min: ${min} })`
    }

    return 'faker.number.int()'
  },
  string: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.string.alpha({ length: { min: ${min}, max: ${max} } })`
    }

    if (max !== undefined) {
      return `faker.string.alpha({ length: ${max} })`
    }

    if (min !== undefined) {
      return `faker.string.alpha({ length: ${min} })`
    }

    return 'faker.string.alpha()'
  },
  boolean: () => 'faker.datatype.boolean()',
  undefined: () => 'undefined',
  null: () => 'null',
  array: (items: string[] = [], min?: number, max?: number) => {
    if (items.length > 1) {
      return `faker.helpers.arrayElements([${items.join(', ')}])`
    }
    const item = items.at(0)

    if (min !== undefined && max !== undefined) {
      return `faker.helpers.multiple(() => (${item}), { count: { min: ${min}, max: ${max} }})`
    }
    if (min !== undefined) {
      return `faker.helpers.multiple(() => (${item}), { count: ${min} })`
    }
    if (max !== undefined) {
      return `faker.helpers.multiple(() => (${item}), { count: { min: 0, max: ${max} }})`
    }

    return `faker.helpers.multiple(() => (${item}))`
  },
  tuple: (items: string[] = []) => `[${items.join(', ')}]`,
  enum: (items: Array<string | number | boolean | undefined> = [], type = 'any') => `faker.helpers.arrayElement<${type}>([${items.join(', ')}])`,
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
      return 'faker.date.anytime().toISOString().substring(0, 10)'
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
      return 'faker.date.anytime().toISOString().substring(11, 19)'
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
    return `faker.helpers.fromRegExp("${value}")`
  },
  email: () => 'faker.internet.email()',
  firstName: () => 'faker.person.firstName()',
  lastName: () => 'faker.person.lastName()',
  password: () => 'faker.internet.password()',
  phone: () => 'faker.phone.number()',
  blob: () => 'faker.image.url() as unknown as Blob',
  default: undefined,
  describe: undefined,
  const: (value?: string | number) => (value as string) ?? '',
  max: undefined,
  min: undefined,
  nullable: undefined,
  nullish: undefined,
  optional: undefined,
  readOnly: undefined,
  writeOnly: undefined,
  deprecated: undefined,
  example: undefined,
  schema: undefined,
  catchall: undefined,
  name: undefined,
  interface: undefined,
  exclusiveMaximum: undefined,
  exclusiveMinimum: undefined,
} satisfies SchemaMapper<string | null | undefined>

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function schemaKeywordSorter(_a: Schema, b: Schema) {
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
  typeName?: string
  regexGenerator?: 'faker' | 'randexp'
  canOverride?: boolean
  dateParser?: Options['dateParser']
  mapper?: Record<string, string>
}

export function parse({ schema, current, parent, name, siblings }: SchemaTree, options: ParserOptions): string | null | undefined {
  const value = fakerKeywordMapper[current.keyword as keyof typeof fakerKeywordMapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    if (Array.isArray(current.args) && !current.args.length) {
      return ''
    }

    return fakerKeywordMapper.union(
      current.args.map((it) => parse({ schema, parent: current, name, current: it, siblings }, { ...options, canOverride: false })).filter(Boolean),
    )
  }

  if (isKeyword(current, schemaKeywords.and)) {
    return fakerKeywordMapper.and(
      current.args.map((it) => parse({ schema, parent: current, current: it, siblings }, { ...options, canOverride: false })).filter(Boolean),
    )
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return fakerKeywordMapper.array(
      current.args.items
        .map((it) =>
          parse(
            { schema, parent: current, current: it, siblings },
            {
              ...options,
              typeName: `NonNullable<${options.typeName}>[number]`,
              canOverride: false,
            },
          ),
        )
        .filter(Boolean),
      current.args.min,
      current.args.max,
    )
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    const isParentTuple = parent ? isKeyword(parent, schemaKeywords.tuple) : false

    if (isParentTuple) {
      return fakerKeywordMapper.enum(
        current.args.items.map((schema) => {
          if (schema.format === 'number') {
            return schema.value
          }

          if (schema.format === 'boolean') {
            return schema.value
          }
          return transformers.stringify(schema.value)
        }),
      )
    }

    return fakerKeywordMapper.enum(
      current.args.items.map((schema) => {
        if (schema.format === 'number') {
          return schema.value
        }
        if (schema.format === 'boolean') {
          return schema.value
        }
        return transformers.stringify(schema.value)
      }),
      // TODO replace this with getEnumNameFromSchema
      name ? options.typeName : undefined,
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
    const propertiesObj = current.args?.properties || {}
    const filteredProperties: Array<[string, Schema[]]> = []

    for (const name of Object.keys(propertiesObj)) {
      const schemas = propertiesObj[name]
      if (schemas && typeof schemas.map === 'function') {
        filteredProperties.push([name, schemas])
      }
    }

    const argsObject = filteredProperties
      .map(([name, schemas]) => {
        const schemasKeywordMap = createSchemaKeywordMap(schemas)
        const nameSchema = getSchemaByKeyword(schemasKeywordMap, schemaKeywords.name) as SchemaKeywordMapper['name']
        const mappedName = nameSchema?.args || name

        // custom mapper(pluginOptions)
        if (options.mapper?.[mappedName]) {
          return `"${name}": ${options.mapper?.[mappedName]}`
        }

        return `"${name}": ${joinItems(
          schemas
            .sort(schemaKeywordSorter)
            .map((it) =>
              parse(
                { schema, name, parent: current, current: it, siblings: schemas },
                {
                  ...options,
                  typeName: `NonNullable<${options.typeName}>[${JSON.stringify(name)}]`,
                  canOverride: false,
                },
              ),
            )
            .filter(Boolean),
        )}`
      })
      .join(',')

    return `{${argsObject}}`
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    if (Array.isArray(current.args.items)) {
      return fakerKeywordMapper.tuple(
        current.args.items.map((it) => parse({ schema, parent: current, current: it, siblings }, { ...options, canOverride: false })).filter(Boolean),
      )
    }

    return parse({ schema, parent: current, current: current.args.items, siblings }, { ...options, canOverride: false })
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
    if (siblings) {
      const minSchema = SchemaGenerator.find(siblings, schemaKeywords.min)
      const maxSchema = SchemaGenerator.find(siblings, schemaKeywords.max)

      return fakerKeywordMapper.string(minSchema?.args, maxSchema?.args)
    }

    return fakerKeywordMapper.string()
  }

  if (isKeyword(current, schemaKeywords.number)) {
    if (siblings) {
      const minSchema = SchemaGenerator.find(siblings, schemaKeywords.min)
      const maxSchema = SchemaGenerator.find(siblings, schemaKeywords.max)

      return fakerKeywordMapper.number(minSchema?.args, maxSchema?.args)
    }

    return fakerKeywordMapper.number()
  }

  if (isKeyword(current, schemaKeywords.integer)) {
    if (siblings) {
      const minSchema = SchemaGenerator.find(siblings, schemaKeywords.min)
      const maxSchema = SchemaGenerator.find(siblings, schemaKeywords.max)

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
