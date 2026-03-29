import { stringify } from '@internals/utils'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'

type ZodOptions = {
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  mapper?: Record<string, string>
  guidType?: 'uuid' | 'guid'
  mini?: boolean
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
}

type ZodPrinter = PrinterFactoryOptions<'zod', ZodOptions, string, string>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shouldCoerce(coercion: ZodOptions['coercion'], type: 'dates' | 'strings' | 'numbers'): boolean {
  if (coercion === undefined || coercion === false) return false
  if (coercion === true) return true
  return !!coercion[type]
}

/** Format a default value as a code-level literal. */
function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return '{}'
  return String(value ?? '')
}

/** Build `.min()` / `.max()` / `.gt()` / `.lt()` constraint chains for numbers. */
function numberConstraints(
  min?: number,
  max?: number,
  exclusiveMinimum?: number,
  exclusiveMaximum?: number,
): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : '',
    exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : '',
  ].join('')
}

/** Build `.check(z.minimum(), z.maximum())` for mini-mode numeric constraints. */
function numberChecksMini(
  min?: number,
  max?: number,
  exclusiveMinimum?: number,
  exclusiveMaximum?: number,
): string {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minimum(${min})`)
  if (max !== undefined) checks.push(`z.maximum(${max})`)
  if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
  if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/** Build `.min()` / `.max()` chains for strings/arrays. */
function lengthConstraints(min?: number, max?: number): string {
  return [min !== undefined ? `.min(${min})` : '', max !== undefined ? `.max(${max})` : ''].join('')
}

/** Build `.check(z.minLength(), z.maxLength())` for mini-mode length constraints. */
function lengthChecksMini(min?: number, max?: number): string {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

// ---------------------------------------------------------------------------
// Printer
// ---------------------------------------------------------------------------

/**
 * Zod v4 printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST into a Zod v4 code string.
 *
 * @example
 * ```ts
 * const printer = printerZod({ coercion: false })
 * const code = printer.print(stringSchemaNode) // "z.string()"
 * ```
 */
export const printerZod = definePrinter<ZodPrinter>((options) => {
  const opts: Required<Pick<ZodOptions, 'guidType' | 'mini'>> & ZodOptions = {
    guidType: 'uuid',
    mini: false,
    ...options,
  }

  return {
    name: 'zod',
    options: opts,

    nodes: {
      // -- Scalars ---------------------------------------------------------
      any: () => 'z.any()',
      unknown: () => 'z.unknown()',
      void: () => 'z.void()',
      never: () => 'z.never()',
      boolean: () => 'z.boolean()',
      null: () => 'z.null()',

      // -- String ----------------------------------------------------------
      string(node) {
        if (this.options.mini) {
          return `z.string()${lengthChecksMini(node.min, node.max)}`
        }
        const base = shouldCoerce(this.options.coercion, 'strings') ? 'z.coerce.string()' : 'z.string()'
        return `${base}${lengthConstraints(node.min, node.max)}`
      },

      // -- Number / Integer / BigInt ---------------------------------------
      number(node) {
        if (this.options.mini) {
          return `z.number()${numberChecksMini(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
        }
        const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number()' : 'z.number()'
        return `${base}${numberConstraints(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
      },

      integer(node) {
        if (this.options.mini) {
          return `z.int()${numberChecksMini(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
        }
        const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number().int()' : 'z.int()'
        return `${base}${numberConstraints(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
      },

      bigint() {
        return shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.bigint()' : 'z.bigint()'
      },

      // -- Date / Time / Datetime ------------------------------------------
      date(node) {
        if (node.representation === 'string') {
          return 'z.iso.date()'
        }
        return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : 'z.date()'
      },

      datetime(node) {
        if (this.options.mini) return 'z.string()'
        if (node.offset) return `z.iso.datetime({ offset: true })`
        if (node.local) return `z.iso.datetime({ local: true })`
        return 'z.iso.datetime()'
      },

      time(node) {
        if (node.representation === 'string') {
          return 'z.iso.time()'
        }
        return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : 'z.date()'
      },

      // -- Special string formats ------------------------------------------
      uuid() {
        const zodType = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'
        return zodType
      },

      email() {
        return 'z.email()'
      },

      url() {
        return 'z.url()'
      },

      blob: () => 'z.instanceof(File)',

      // -- Enum ------------------------------------------------------------
      enum(node) {
        const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []

        // asConst-style enum: use z.union([z.literal(…), …])
        const hasNamedValues = !!node.namedEnumValues?.length
        if (hasNamedValues) {
          const literals = values.filter((v): v is string | number | boolean => v !== null).map((v) => `z.literal(${stringify(v as string | number | boolean)})`)
          if (literals.length === 1) return literals[0]!
          return `z.union([${literals.join(', ')}])`
        }

        // Regular enum: use z.enum([…])
        const items = values.filter((v): v is string | number | boolean => v !== null).map((v) => stringify(v as string | number | boolean))
        return `z.enum([${items.join(', ')}])`
      },

      // -- Ref -------------------------------------------------------------
      ref(node) {
        if (!node.name) return undefined
        return `z.lazy(() => ${node.name})`
      },

      // -- Object ----------------------------------------------------------
      object(node) {
        const { mini, mapper } = this.options

        const properties = node.properties
          .map((prop) => {
            const { name: propName, schema } = prop

            // Custom mapper override
            if (mapper && Object.hasOwn(mapper, propName)) {
              return `"${propName}": ${mapper[propName]}`
            }

            const hasRef = schema.type === 'ref'
            const isNullable = schema.nullable
            const isOptional = schema.optional
            const isNullish = schema.nullish

            const baseOutput = this.transform(schema) ?? 'z.unknown()'

            const wrappedOutput = this.options.wrapOutput
              ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput
              : baseOutput

            // For v4 refs, use getter syntax (lazy evaluation without z.lazy wrapper)
            if (hasRef && schema.type === 'ref') {
              const refName = schema.name ?? baseOutput
              const value = applyPropertyModifiers(refName, isNullable, isOptional, isNullish, !!mini)
              return `get "${propName}"() { return ${value} }`
            }

            const value = applyPropertyModifiers(wrappedOutput, isNullable, isOptional, isNullish, !!mini)
            return `"${propName}": ${value}`
          })
          .join(',\n    ')

        let result = `z.object({\n    ${properties}\n    })`

        // Handle additionalProperties as .catchall()
        if (node.additionalProperties && node.additionalProperties !== true) {
          const catchallType = this.transform(node.additionalProperties)
          if (catchallType && !mini) {
            result += `.catchall(${catchallType})`
          }
        } else if (node.additionalProperties === true && !mini) {
          result += `.catchall(z.unknown())`
        }

        return result
      },

      // -- Array -----------------------------------------------------------
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || 'z.unknown()'

        if (this.options.mini) {
          return `z.array(${inner})${lengthChecksMini(node.min, node.max)}`
        }
        return `z.array(${inner})${lengthConstraints(node.min, node.max)}`
      },

      // -- Tuple -----------------------------------------------------------
      tuple(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        return `z.tuple([${items.join(', ')}])`
      },

      // -- Union -----------------------------------------------------------
      union(node) {
        const members = (node.members ?? []).map((m) => this.transform(m)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        return `z.union([${members.join(', ')}])`
      },

      // -- Intersection ----------------------------------------------------
      intersection(node) {
        const members = (node.members ?? []).map((m) => this.transform(m)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!

        if (this.options.mini) {
          // Mini mode doesn't support .and()
          return members[0]!
        }

        return members.reduce((acc, m) => `${acc}.and(${m})`)
      },
    },

    print(node) {
      const base = this.transform(node)
      if (!base) return null

      let output = base
      const { mini } = this.options

      // Apply nullable / optional / nullish modifiers
      if (node.nullish) {
        output = mini ? `z.nullish(${output})` : `${output}.nullish()`
      } else {
        if (node.nullable) {
          output = mini ? `z.nullable(${output})` : `${output}.nullable()`
        }
        if (node.optional) {
          output = mini ? `z.optional(${output})` : `${output}.optional()`
        }
      }

      // Apply default
      if (node.default !== undefined) {
        if (mini) {
          output = `z._default(${output}, ${formatDefault(node.default)})`
        } else {
          output = `${output}.default(${formatDefault(node.default)})`
        }
      }

      // Apply describe (not supported in mini)
      if (node.description && !mini) {
        output = `${output}.describe(${stringify(node.description)})`
      }

      return output
    },
  }
})

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** Apply nullable / optional / nullish modifiers to a property value string. */
function applyPropertyModifiers(
  value: string,
  nullable?: boolean,
  optional?: boolean,
  nullish?: boolean,
  mini?: boolean,
): string {
  if (nullish) {
    return mini ? `z.nullish(${value})` : `${value}.nullish()`
  }
  if (nullable && optional) {
    return mini ? `z.nullish(${value})` : `${value}.nullish()`
  }
  if (optional) {
    return mini ? `z.optional(${value})` : `${value}.optional()`
  }
  if (nullable) {
    return mini ? `z.nullable(${value})` : `${value}.nullable()`
  }
  return value
}
