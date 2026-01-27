import transformers from '@kubb/core/transformers'

import type { Schema, SchemaMapper } from '@kubb/plugin-oas'
import { createParser, findSchemaKeyword, isKeyword, SchemaGenerator, type SchemaKeywordMapper, schemaKeywords } from '@kubb/plugin-oas'

//TODO add zodKeywordMapper as function that returns 3 versions: v3, v4 and v4 mini, this can also be used to have the custom mapping(see object type)
// also include shouldCoerce

/**
 * Helper to build string/array length constraint checks for Zod Mini mode
 */
function buildLengthChecks(min?: number, max?: number): string[] {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  return checks
}

const zodKeywordMapper = {
  any: () => 'z.any()',
  unknown: () => 'z.unknown()',
  void: () => 'z.void()',
  number: (coercion?: boolean, min?: number, max?: number, exclusiveMinimum?: number, exclusiveMaximum?: number, mini?: boolean) => {
    if (mini) {
      const checks: string[] = []
      if (min !== undefined) checks.push(`z.minimum(${min})`)
      if (max !== undefined) checks.push(`z.maximum(${max})`)
      if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
      if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
      if (checks.length > 0) {
        return `z.number().check(${checks.join(', ')})`
      }
      return 'z.number()'
    }
    return [
      coercion ? 'z.coerce.number()' : 'z.number()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
      exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : undefined,
      exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : undefined,
    ]
      .filter(Boolean)
      .join('')
  },
  integer: (coercion?: boolean, min?: number, max?: number, version: '3' | '4' = '3', exclusiveMinimum?: number, exclusiveMaximum?: number, mini?: boolean) => {
    if (mini) {
      const checks: string[] = []
      if (min !== undefined) checks.push(`z.minimum(${min})`)
      if (max !== undefined) checks.push(`z.maximum(${max})`)
      if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
      if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
      if (checks.length > 0) {
        return `z.int().check(${checks.join(', ')})`
      }
      return 'z.int()'
    }
    return [
      coercion ? 'z.coerce.number().int()' : version === '4' ? 'z.int()' : 'z.number().int()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
      exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : undefined,
      exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : undefined,
    ]
      .filter(Boolean)
      .join('')
  },
  interface: (value?: string, strict?: boolean) => {
    if (strict) {
      return `z.strictInterface({
    ${value}
    })`
    }
    return `z.interface({
    ${value}
    })`
  },
  object: (value?: string, strict?: boolean, version: '3' | '4' = '3') => {
    if (version === '4' && strict) {
      return `z.strictObject({
    ${value}
    })`
    }

    if (strict) {
      return `z.object({
    ${value}
    }).strict()`
    }

    return `z.object({
    ${value}
    })`
  },
  string: (coercion?: boolean, min?: number, max?: number, mini?: boolean) => {
    if (mini) {
      const checks = buildLengthChecks(min, max)
      if (checks.length > 0) {
        return `z.string().check(${checks.join(', ')})`
      }
      return 'z.string()'
    }
    return [coercion ? 'z.coerce.string()' : 'z.string()', min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined]
      .filter(Boolean)
      .join('')
  },
  //support for discriminatedUnion
  boolean: () => 'z.boolean()',
  undefined: () => 'z.undefined()',
  nullable: (value?: string) => {
    if (value) {
      return `z.nullable(${value})`
    }
    return '.nullable()'
  },
  null: () => 'z.null()',
  nullish: (value?: string) => {
    if (value) {
      return `z.nullish(${value})`
    }
    return '.nullish()'
  },
  array: (items: string[] = [], min?: number, max?: number, unique?: boolean, mini?: boolean) => {
    if (mini) {
      const checks = buildLengthChecks(min, max)
      if (unique) checks.push(`z.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })`)
      if (checks.length > 0) {
        return `z.array(${items?.join('')}).check(${checks.join(', ')})`
      }
      return `z.array(${items?.join('')})`
    }
    return [
      `z.array(${items?.join('')})`,
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
      unique ? `.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })` : undefined,
    ]
      .filter(Boolean)
      .join('')
  },
  tuple: (items: string[] = []) => `z.tuple([${items?.join(', ')}])`,
  enum: (items: string[] = []) => `z.enum([${items?.join(', ')}])`,
  union: (items: string[] = []) => `z.union([${items?.join(', ')}])`,
  const: (value?: string | number | boolean) => `z.literal(${value ?? ''})`,
  /**
   * ISO 8601
   */
  datetime: (offset = false, local = false, version: '3' | '4' = '3', mini?: boolean) => {
    // Zod Mini doesn't support .datetime() method, use plain string
    if (mini) {
      return 'z.string()'
    }

    if (offset) {
      return version === '4' ? `z.iso.datetime({ offset: ${offset} })` : `z.string().datetime({ offset: ${offset} })`
    }

    if (local) {
      return version === '4' ? `z.iso.datetime({ local: ${local} })` : `z.string().datetime({ local: ${local} })`
    }

    return version === '4' ? 'z.iso.datetime()' : 'z.string().datetime()'
  },
  /**
   * Type `'date'` Date
   * Type `'string'` ISO date format (YYYY-MM-DD)
   * @default ISO date format (YYYY-MM-DD)
   */
  date: (type: 'date' | 'string' = 'string', coercion?: boolean, version: '3' | '4' = '3') => {
    if (type === 'string') {
      return version === '4' ? 'z.iso.date()' : 'z.string().date()'
    }

    if (coercion) {
      return 'z.coerce.date()'
    }

    return 'z.date()'
  },
  /**
   * Type `'date'` Date
   * Type `'string'` ISO time format (HH:mm:ss[.SSSSSS])
   * @default ISO time format (HH:mm:ss[.SSSSSS])
   */
  time: (type: 'date' | 'string' = 'string', coercion?: boolean, version: '3' | '4' = '3') => {
    if (type === 'string') {
      return version === '4' ? 'z.iso.time()' : 'z.string().time()'
    }

    if (coercion) {
      return 'z.coerce.date()'
    }

    return 'z.date()'
  },
  uuid: (coercion?: boolean, version: '3' | '4' = '3', min?: number, max?: number, mini?: boolean) => {
    if (mini) {
      const checks = buildLengthChecks(min, max)
      if (checks.length > 0) {
        return `z.uuid().check(${checks.join(', ')})`
      }
      return 'z.uuid()'
    }
    return [
      coercion ? (version === '4' ? 'z.uuid()' : 'z.coerce.string().uuid()') : version === '4' ? 'z.uuid()' : 'z.string().uuid()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
    ]
      .filter(Boolean)
      .join('')
  },
  url: (coercion?: boolean, version: '3' | '4' = '3', min?: number, max?: number, mini?: boolean) => {
    if (mini) {
      const checks = buildLengthChecks(min, max)
      if (checks.length > 0) {
        return `z.url().check(${checks.join(', ')})`
      }
      return 'z.url()'
    }
    return [
      coercion ? (version === '4' ? 'z.url()' : 'z.coerce.string().url()') : version === '4' ? 'z.url()' : 'z.string().url()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
    ]
      .filter(Boolean)
      .join('')
  },
  default: (value?: string | number | boolean | object, innerSchema?: string, mini?: boolean) => {
    if (mini && innerSchema) {
      const defaultValue = typeof value === 'object' ? '{}' : (value ?? '')
      return `z._default(${innerSchema}, ${defaultValue})`
    }

    if (typeof value === 'object') {
      return '.default({})'
    }

    if (value === undefined) {
      return '.default()'
    }

    if (typeof value === 'string' && !value) {
      return `.default('')`
    }

    return `.default(${value ?? ''})`
  },
  and: (items: string[] = [], mini?: boolean) => {
    // zod/mini doesn't support .and() method, so we can't use intersection types
    // In mini mode, we try to extract and append .check() calls instead
    if (mini && items.length > 0) {
      // Try to extract check calls from additional items
      const checks: string[] = []
      for (const item of items) {
        // Extract .check(...) from patterns like "z.string().check(...)"
        // Need to handle nested parentheses properly
        const checkStart = item.indexOf('.check(')
        if (checkStart !== -1) {
          // Find the matching closing parenthesis
          let depth = 0
          let i = checkStart + 7 // length of '.check('
          let checkContent = ''
          while (i < item.length) {
            const char = item[i]
            if (char === '(') depth++
            else if (char === ')') {
              if (depth === 0) break
              depth--
            }
            checkContent += char
            i++
          }
          if (checkContent) {
            checks.push(checkContent)
          }
        }
      }

      if (checks.length > 0) {
        // Append checks to the base schema
        return `.check(${checks.join(', ')})`
      }

      // If we can't extract checks, just use the first schema (limitation)
      return ''
    }
    return items?.map((item) => `.and(${item})`).join('')
  },
  describe: (value = '', innerSchema?: string, mini?: boolean) => {
    if (mini) {
      return undefined
    }

    if (innerSchema) {
      return `z.describe(${innerSchema}, ${value})`
    }
    return `.describe(${value})`
  },
  max: undefined,
  min: undefined,
  optional: (value?: string) => {
    if (value) {
      return `z.optional(${value})`
    }
    return '.optional()'
  },
  matches: (value = '', coercion?: boolean, mini?: boolean, min?: number, max?: number) => {
    if (mini) {
      const checks = buildLengthChecks(min, max)
      checks.push(`z.regex(${value})`)
      return `z.string().check(${checks.join(', ')})`
    }
    return [
      coercion ? 'z.coerce.string()' : 'z.string()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
      `.regex(${value})`,
    ]
      .filter(Boolean)
      .join('')
  },
  email: (coercion?: boolean, version: '3' | '4' = '3', min?: number, max?: number, mini?: boolean) => {
    if (mini) {
      const checks = buildLengthChecks(min, max)
      if (checks.length > 0) {
        return `z.email().check(${checks.join(', ')})`
      }
      return 'z.email()'
    }
    return [
      coercion ? (version === '4' ? 'z.email()' : 'z.coerce.string().email()') : version === '4' ? 'z.email()' : 'z.string().email()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
    ]
      .filter(Boolean)
      .join('')
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

    return `z.lazy(() => ${value})`
  },
  blob: () => 'z.instanceof(File)',
  deprecated: undefined,
  example: undefined,
  schema: undefined,
  catchall: (value?: string, mini?: boolean) => {
    // Zod Mini doesn't support .catchall() method
    if (mini) {
      return undefined
    }
    return value ? `.catchall(${value})` : undefined
  },
  name: undefined,
  exclusiveMinimum: undefined,
  exclusiveMaximum: undefined,
} satisfies SchemaMapper<string | null | undefined>

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

export function sort(items?: Schema[]): Schema[] {
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
    schemaKeywords.describe,
    schemaKeywords.optional,
    schemaKeywords.nullable,
    schemaKeywords.nullish,
  ]

  if (!items) {
    return []
  }

  return transformers.orderBy(items, [(v) => order.indexOf(v.keyword)], ['asc'])
}

type MiniModifiers = {
  hasOptional?: boolean
  hasNullable?: boolean
  hasNullish?: boolean
  defaultValue?: string | number | true | object
}

/**
 * Keywords that represent modifiers for mini mode
 * These are separated from the base schema and wrapped around it
 * Note: describe is included to filter it out, but won't be wrapped (Zod Mini doesn't support describe)
 */
export const miniModifierKeywords = [schemaKeywords.optional, schemaKeywords.nullable, schemaKeywords.nullish, schemaKeywords.default, schemaKeywords.describe]

/**
 * Extracts mini mode modifiers from a schemas array
 * This can be reused by other parsers (e.g., valibot) that need similar functionality
 * Note: describe is not included as Zod Mini doesn't support it
 */
export function extractMiniModifiers(schemas: Schema[]): MiniModifiers {
  const defaultSchema = schemas.find((item) => isKeyword(item, schemaKeywords.default)) as { keyword: string; args: unknown } | undefined

  return {
    hasOptional: schemas.some((item) => isKeyword(item, schemaKeywords.optional)),
    hasNullable: schemas.some((item) => isKeyword(item, schemaKeywords.nullable)),
    hasNullish: schemas.some((item) => isKeyword(item, schemaKeywords.nullish)),
    defaultValue: defaultSchema?.args as string | number | true | object | undefined,
  }
}

/**
 * Filters out modifier keywords from schemas for mini mode base schema parsing
 * This can be reused by other parsers (e.g., valibot) that need similar functionality
 */
export function filterMiniModifiers(schemas: Schema[]): Schema[] {
  return schemas.filter((item) => !miniModifierKeywords.some((keyword) => isKeyword(item, keyword)))
}

/**
 * Wraps an output string with Zod Mini functional modifiers
 * Order: default (innermost) -> nullable -> optional (outermost)
 * OR: default -> nullish
 * Note: describe is not supported in Zod Mini and is skipped
 */
export function wrapWithMiniModifiers(output: string, modifiers: MiniModifiers): string {
  let result = output

  // Apply default first (innermost wrapper)
  if (modifiers.defaultValue !== undefined) {
    result = zodKeywordMapper.default(modifiers.defaultValue, result, true)!
  }

  // Apply nullish, nullable, or optional (outer wrappers for optionality)
  if (modifiers.hasNullish) {
    result = zodKeywordMapper.nullish(result)!
  } else {
    if (modifiers.hasNullable) {
      result = zodKeywordMapper.nullable(result)!
    }
    if (modifiers.hasOptional) {
      result = zodKeywordMapper.optional(result)!
    }
  }

  return result
}

const shouldCoerce = (coercion: ParserOptions['coercion'] | undefined, type: 'dates' | 'strings' | 'numbers'): boolean => {
  if (coercion === undefined) {
    return false
  }
  if (typeof coercion === 'boolean') {
    return coercion
  }

  return !!coercion[type]
}

type ParserOptions = {
  mapper?: Record<string, string>
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
  version: '3' | '4'
  skipLazyForRefs?: boolean
  mini?: boolean
}

// Create the parser using createParser
export const parse = createParser<string, ParserOptions>({
  mapper: zodKeywordMapper,
  handlers: {
    union(tree, options) {
      const { current, schema, parent, name, siblings } = tree

      // zod union type needs at least 2 items
      if (Array.isArray(current.args) && current.args.length === 1) {
        return this.parse({ schema, parent, name, current: current.args[0] as Schema, siblings }, options)
      }
      if (Array.isArray(current.args) && !current.args.length) {
        return ''
      }

      return zodKeywordMapper.union(
        sort(current.args)
          .map((it, _index, siblings) => this.parse({ schema, parent: current, name, current: it, siblings }, options))
          .filter(Boolean),
      )
    },
    and(tree, options) {
      const { current, schema, name } = tree

      const items = sort(current.args)
        .filter((schema: Schema) => {
          return ![schemaKeywords.optional, schemaKeywords.describe].includes(schema.keyword as typeof schemaKeywords.describe)
        })
        .map((it: Schema, _index, siblings) => this.parse({ schema, parent: current, name, current: it, siblings }, options))
        .filter(Boolean)

      return `${items.slice(0, 1)}${zodKeywordMapper.and(items.slice(1), options.mini)}`
    },
    array(tree, options) {
      const { current, schema, name } = tree

      return zodKeywordMapper.array(
        sort(current.args.items)
          .map((it, _index, siblings) => {
            return this.parse({ schema, parent: current, name, current: it, siblings }, options)
          })
          .filter(Boolean),
        current.args.min,
        current.args.max,
        current.args.unique,
        options.mini,
      )
    },
    enum(tree, options) {
      const { current, schema, name } = tree

      if (current.args.asConst) {
        if (current.args.items.length === 1) {
          const child = {
            keyword: schemaKeywords.const,
            args: current.args.items[0],
          }
          return this.parse({ schema, parent: current, name, current: child, siblings: [child] }, options)
        }

        return zodKeywordMapper.union(
          current.args.items
            .map((schema) => ({
              keyword: schemaKeywords.const,
              args: schema,
            }))
            .map((it, _index, siblings) => {
              return this.parse({ schema, parent: current, name, current: it, siblings }, options)
            })
            .filter(Boolean),
        )
      }

      return zodKeywordMapper.enum(
        current.args.items.map((schema) => {
          if (schema.format === 'boolean') {
            return transformers.stringify(schema.value)
          }

          if (schema.format === 'number') {
            return transformers.stringify(schema.value)
          }
          return transformers.stringify(schema.value)
        }),
      )
    },
    ref(tree, options) {
      const { current } = tree

      // Skip z.lazy wrapper if skipLazyForRefs is true (e.g., inside v4 getters)
      if (options.skipLazyForRefs) {
        return current.args?.name
      }
      return zodKeywordMapper.ref(current.args?.name)
    },
    object(tree, options) {
      const { current, schema, name } = tree

      const propertyEntries = Object.entries(current.args?.properties || {}).filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })

      const properties = propertyEntries
        .map(([propertyName, schemas]) => {
          const nameSchema = schemas.find((it) => it.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']
          const isNullable = schemas.some((it) => isKeyword(it, schemaKeywords.nullable))
          const isNullish = schemas.some((it) => isKeyword(it, schemaKeywords.nullish))
          const isOptional = schemas.some((it) => isKeyword(it, schemaKeywords.optional))
          const hasRef = !!SchemaGenerator.find(schemas, schemaKeywords.ref)

          const mappedName = nameSchema?.args || propertyName

          // custom mapper(pluginOptions)
          // Use Object.hasOwn to avoid matching inherited properties like 'toString', 'valueOf', etc.
          if (options.mapper && Object.hasOwn(options.mapper, mappedName)) {
            return `"${propertyName}": ${options.mapper?.[mappedName]}`
          }

          const baseSchemaOutput = sort(schemas)
            .filter((schema) => {
              return !isKeyword(schema, schemaKeywords.optional) && !isKeyword(schema, schemaKeywords.nullable) && !isKeyword(schema, schemaKeywords.nullish)
            })
            .map((it) => {
              // For v4 with refs, skip z.lazy wrapper since the getter provides lazy evaluation
              const skipLazyForRefs = options.version === '4' && hasRef
              return this.parse({ schema, parent: current, name, current: it, siblings: schemas }, { ...options, skipLazyForRefs })
            })
            .filter(Boolean)
            .join('')

          const objectValue = options.wrapOutput
            ? options.wrapOutput({ output: baseSchemaOutput, schema: schema?.properties?.[propertyName] }) || baseSchemaOutput
            : baseSchemaOutput

          if (options.version === '4' && hasRef) {
            // In mini mode, use functional wrappers instead of chainable methods
            if (options.mini) {
              // both optional and nullable
              if (isNullish) {
                return `get "${propertyName}"(){
                return ${zodKeywordMapper.nullish(objectValue)}
              }`
              }

              // undefined
              if (isOptional) {
                return `get "${propertyName}"(){
                return ${zodKeywordMapper.optional(objectValue)}
              }`
              }

              // null
              if (isNullable) {
                return `get "${propertyName}"(){
                return ${zodKeywordMapper.nullable(objectValue)}
              }`
              }

              return `get "${propertyName}"(){
                return ${objectValue}
              }`
            }

            // Non-mini mode uses chainable methods
            // both optional and nullable
            if (isNullish) {
              return `get "${propertyName}"(){
                return ${objectValue}${zodKeywordMapper.nullish()}
              }`
            }

            // undefined
            if (isOptional) {
              return `get "${propertyName}"(){
                return ${objectValue}${zodKeywordMapper.optional()}
              }`
            }

            // null
            if (isNullable) {
              return `get "${propertyName}"(){
               return ${objectValue}${zodKeywordMapper.nullable()}
              }`
            }

            return `get "${propertyName}"(){
                return ${objectValue}
              }`
          }

          // both optional and nullable
          if (isNullish && options.mini) {
            return `"${propertyName}": ${zodKeywordMapper.nullish(objectValue)}`
          }

          if (isNullish && !options.mini) {
            return `"${propertyName}": ${objectValue}${zodKeywordMapper.nullish()}`
          }

          // undefined
          if (isOptional) {
            return `"${propertyName}": ${zodKeywordMapper.optional(objectValue)}`
          }

          // null
          if (isNullable) {
            return `"${propertyName}": ${zodKeywordMapper.nullable(objectValue)}`
          }

          return `"${propertyName}": ${objectValue}`
        })
        .join(',\n')

      const additionalProperties = current.args?.additionalProperties?.length
        ? current.args.additionalProperties
            .map((it, _index, siblings) => this.parse({ schema, parent: current, name, current: it, siblings }, options))
            .filter(Boolean)
            .join('')
        : undefined

      const text = [
        zodKeywordMapper.object(properties, current.args?.strict, options.version),
        additionalProperties ? zodKeywordMapper.catchall(additionalProperties, options.mini) : undefined,
      ].filter(Boolean)

      return text.join('')
    },
    tuple(tree, options) {
      const { current, schema, name } = tree

      return zodKeywordMapper.tuple(
        current.args.items.map((it, _index, siblings) => this.parse({ schema, parent: current, name, current: it, siblings }, options)).filter(Boolean),
      )
    },
    const(tree, _options) {
      const { current } = tree

      if (current.args.format === 'number' && current.args.value !== undefined) {
        return zodKeywordMapper.const(Number(current.args.value))
      }

      if (current.args.format === 'boolean' && current.args.value !== undefined) {
        return zodKeywordMapper.const(typeof current.args.value === 'boolean' ? current.args.value : undefined)
      }
      return zodKeywordMapper.const(transformers.stringify(current.args.value))
    },
    matches(tree, options) {
      const { current, siblings } = tree

      // Early exit: if siblings contain both matches and ref → skip matches entirely
      const hasRef = siblings.some((it) => isKeyword(it, schemaKeywords.ref))
      if (hasRef) {
        return undefined // strip matches
      }

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')

      if (current.args) {
        return zodKeywordMapper.matches(
          transformers.toRegExpString(current.args, null),
          shouldCoerce(options.coercion, 'strings'),
          options.mini,
          minSchema?.args,
          maxSchema?.args,
        )
      }
      return undefined
    },
    default(tree, options) {
      const { current } = tree

      // In mini mode, default is handled by wrapWithMiniModifiers
      if (options.mini) {
        return undefined
      }
      if (current.args !== undefined) {
        return zodKeywordMapper.default(current.args)
      }
      // When args is undefined, call the mapper without arguments
      return zodKeywordMapper.default()
    },
    describe(tree, options) {
      const { current } = tree

      if (current.args) {
        return zodKeywordMapper.describe(transformers.stringify(current.args.toString()), undefined, options.mini)
      }
      return undefined
    },
    string(tree, options) {
      const { siblings } = tree

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')

      return zodKeywordMapper.string(shouldCoerce(options.coercion, 'strings'), minSchema?.args, maxSchema?.args, options.mini)
    },
    uuid(tree, options) {
      const { siblings } = tree

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')

      return zodKeywordMapper.uuid(shouldCoerce(options.coercion, 'strings'), options.version, minSchema?.args, maxSchema?.args, options.mini)
    },
    email(tree, options) {
      const { siblings } = tree

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')

      return zodKeywordMapper.email(shouldCoerce(options.coercion, 'strings'), options.version, minSchema?.args, maxSchema?.args, options.mini)
    },
    url(tree, options) {
      const { siblings } = tree

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')

      return zodKeywordMapper.url(shouldCoerce(options.coercion, 'strings'), options.version, minSchema?.args, maxSchema?.args, options.mini)
    },
    number(tree, options) {
      const { siblings } = tree

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')
      const exclusiveMinimumSchema = findSchemaKeyword(siblings, 'exclusiveMinimum')
      const exclusiveMaximumSchema = findSchemaKeyword(siblings, 'exclusiveMaximum')

      return zodKeywordMapper.number(
        shouldCoerce(options.coercion, 'numbers'),
        minSchema?.args,
        maxSchema?.args,
        exclusiveMinimumSchema?.args,
        exclusiveMaximumSchema?.args,
        options.mini,
      )
    },
    integer(tree, options) {
      const { siblings } = tree

      const minSchema = findSchemaKeyword(siblings, 'min')
      const maxSchema = findSchemaKeyword(siblings, 'max')
      const exclusiveMinimumSchema = findSchemaKeyword(siblings, 'exclusiveMinimum')
      const exclusiveMaximumSchema = findSchemaKeyword(siblings, 'exclusiveMaximum')

      return zodKeywordMapper.integer(
        shouldCoerce(options.coercion, 'numbers'),
        minSchema?.args,
        maxSchema?.args,
        options.version,
        exclusiveMinimumSchema?.args,
        exclusiveMaximumSchema?.args,
        options.mini,
      )
    },
    datetime(tree, options) {
      const { current } = tree

      return zodKeywordMapper.datetime(current.args.offset, current.args.local, options.version, options.mini)
    },
    date(tree, options) {
      const { current } = tree

      return zodKeywordMapper.date(current.args.type, shouldCoerce(options.coercion, 'dates'), options.version)
    },
    time(tree, options) {
      const { current } = tree

      return zodKeywordMapper.time(current.args.type, shouldCoerce(options.coercion, 'dates'), options.version)
    },
  },
})
