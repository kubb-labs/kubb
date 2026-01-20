import transformers from '@kubb/core/transformers'
import type { Schema, SchemaKeywordMapper, SchemaMapper } from '@kubb/plugin-oas'
import { createParser, findSchemaKeyword, isKeyword, schemaKeywords } from '@kubb/plugin-oas'
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
  and: (items: string[] = []) => {
    // If only one item, return it as-is (no need to spread)
    // This fixes the issue with single refs to primitives like enums
    if (items.length === 1) {
      return items[0]!
    }
    
    // If multiple items, spread them together
    // This handles both object literals and multiple refs to objects
    return `{...${items.join(', ...')}}`
  },
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
  rootTypeName?: string
  regexGenerator?: 'faker' | 'randexp'
  canOverride?: boolean
  dateParser?: Options['dateParser']
  mapper?: Record<string, string>
}

export const parse = createParser<string, ParserOptions>({
  mapper: fakerKeywordMapper,
  handlers: {
    union(tree, options) {
      const { current, schema, name, siblings } = tree

      if (Array.isArray(current.args) && !current.args.length) {
        return ''
      }

      return fakerKeywordMapper.union(
        current.args.map((it) => this.parse({ schema, parent: current, name, current: it, siblings }, { ...options, canOverride: false })).filter(Boolean),
      )
    },
    and(tree, options) {
      const { current, schema, siblings } = tree

      return fakerKeywordMapper.and(
        current.args.map((it) => this.parse({ schema, parent: current, current: it, siblings }, { ...options, canOverride: false })).filter(Boolean),
      )
    },
    array(tree, options) {
      const { current, schema } = tree

      return fakerKeywordMapper.array(
        current.args.items
          .map((it) =>
            this.parse(
              {
                schema,
                parent: current,
                current: it,
                siblings: current.args.items,
              },
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
    },
    enum(tree, options) {
      const { current, parent, name } = tree

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
    },
    ref(tree, options) {
      const { current } = tree

      if (!current.args?.name) {
        throw new Error(`Name not defined for keyword ${current.keyword}`)
      }

      // Check if this is a self-referencing type (prevents infinite recursion)
      // The rootTypeName is the function name being generated (e.g., "createNode")
      // The current.args.name is the ref function name (e.g., "createNode")
      const isSelfReferencing = options.rootTypeName && current.args.name === options.rootTypeName

      if (isSelfReferencing) {
        // For self-referencing types, return undefined to prevent infinite recursion
        // This will result in empty arrays/objects by default
        return 'undefined'
      }

      if (options.canOverride) {
        return `${current.args.name}(data)`
      }

      return `${current.args.name}()`
    },
    object(tree, options) {
      const { current, schema } = tree

      const argsObject = Object.entries(current.args?.properties || {})
        .filter((item) => {
          const schema = item[1]
          return schema && typeof schema.map === 'function'
        })
        .map(([name, schemas]) => {
          const nameSchema = schemas.find((schema) => schema.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']
          const mappedName = nameSchema?.args || name

          // custom mapper(pluginOptions)
          // Use Object.hasOwn to avoid matching inherited properties like 'toString', 'valueOf', etc.
          if (options.mapper && Object.hasOwn(options.mapper, mappedName)) {
            return `"${name}": ${options.mapper?.[mappedName]}`
          }

          return `"${name}": ${joinItems(
            schemas
              .sort(schemaKeywordSorter)
              .map((it) =>
                this.parse(
                  {
                    schema,
                    name,
                    parent: current,
                    current: it,
                    siblings: schemas,
                  },
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
    },
    tuple(tree, options) {
      const { current, schema, siblings } = tree

      if (Array.isArray(current.args.items)) {
        return fakerKeywordMapper.tuple(
          current.args.items.map((it) => this.parse({ schema, parent: current, current: it, siblings }, { ...options, canOverride: false })).filter(Boolean),
        )
      }

      return this.parse({ schema, parent: current, current: current.args.items, siblings }, { ...options, canOverride: false })
    },
    const(tree, _options) {
      const { current } = tree

      if (current.args.format === 'number' && current.args.name !== undefined) {
        return fakerKeywordMapper.const(current.args.name?.toString())
      }
      return fakerKeywordMapper.const(transformers.stringify(current.args.value))
    },
    matches(tree, options) {
      const { current } = tree

      if (current.args) {
        return fakerKeywordMapper.matches(current.args, options.regexGenerator)
      }
      return undefined
    },
    null() {
      return fakerKeywordMapper.null()
    },
    undefined() {
      return fakerKeywordMapper.undefined()
    },
    any() {
      return fakerKeywordMapper.any()
    },
    string(tree, _options) {
      const { siblings } = tree

      if (siblings) {
        const minSchema = findSchemaKeyword(siblings, 'min')
        const maxSchema = findSchemaKeyword(siblings, 'max')

        return fakerKeywordMapper.string(minSchema?.args, maxSchema?.args)
      }

      return fakerKeywordMapper.string()
    },
    number(tree, _options) {
      const { siblings } = tree

      if (siblings) {
        const minSchema = findSchemaKeyword(siblings, 'min')
        const maxSchema = findSchemaKeyword(siblings, 'max')

        return fakerKeywordMapper.number(minSchema?.args, maxSchema?.args)
      }

      return fakerKeywordMapper.number()
    },
    integer(tree, _options) {
      const { siblings } = tree

      if (siblings) {
        const minSchema = findSchemaKeyword(siblings, 'min')
        const maxSchema = findSchemaKeyword(siblings, 'max')

        return fakerKeywordMapper.integer(minSchema?.args, maxSchema?.args)
      }

      return fakerKeywordMapper.integer()
    },
    datetime() {
      return fakerKeywordMapper.datetime()
    },
    date(tree, options) {
      const { current } = tree

      return fakerKeywordMapper.date(current.args.type, options.dateParser)
    },
    time(tree, options) {
      const { current } = tree

      return fakerKeywordMapper.time(current.args.type, options.dateParser)
    },
  },
})
