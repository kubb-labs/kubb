import { stringify } from '@internals/utils'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'

export type ZodOptions = {
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  guidType?: 'uuid' | 'guid'
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
}

type ZodPrinterFactory = PrinterFactoryOptions<'zod', ZodOptions, string, string>

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
function numberConstraints(min?: number, max?: number, exclusiveMinimum?: number, exclusiveMaximum?: number): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : '',
    exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : '',
  ].join('')
}

/** Build `.min()` / `.max()` chains for strings/arrays. */
function lengthConstraints(min?: number, max?: number): string {
  return [min !== undefined ? `.min(${min})` : '', max !== undefined ? `.max(${max})` : ''].join('')
}

// ---------------------------------------------------------------------------
// Printer
// ---------------------------------------------------------------------------

/**
 * Zod v4 printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST into a **standard** Zod v4 code string
 * using the chainable method API (`.optional()`, `.nullable()`, etc.).
 *
 * For the `zod/mini` functional API, see {@link printerZodMini}.
 *
 * @example
 * ```ts
 * const printer = printerZod({ coercion: false })
 * const code = printer.print(stringSchemaNode) // "z.string()"
 * ```
 */
export const printerZod = definePrinter<ZodPrinterFactory>((options) => {
  const opts: Required<Pick<ZodOptions, 'guidType'>> & ZodOptions = {
    guidType: 'uuid',
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
        const base = shouldCoerce(this.options.coercion, 'strings') ? 'z.coerce.string()' : 'z.string()'
        return `${base}${lengthConstraints(node.min, node.max)}`
      },

      // -- Number / Integer / BigInt ---------------------------------------
      number(node) {
        const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number()' : 'z.number()'
        return `${base}${numberConstraints(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
      },

      integer(node) {
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
        if (node.offset) return 'z.iso.datetime({ offset: true })'
        if (node.local) return 'z.iso.datetime({ local: true })'
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
        return this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'
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
          const literals = values
            .filter((v): v is string | number | boolean => v !== null)
            .map((v) => `z.literal(${stringify(v as string | number | boolean)})`)
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
        const properties = node.properties
          .map((prop) => {
            const { name: propName, schema } = prop

            const hasRef = schema.type === 'ref'
            const isNullable = schema.nullable
            const isOptional = schema.optional
            const isNullish = schema.nullish

            const baseOutput = this.transform(schema) ?? 'z.unknown()'

            const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput : baseOutput

            // For v4 refs, use getter syntax (lazy evaluation without z.lazy wrapper)
            if (hasRef && schema.type === 'ref') {
              const refName = schema.name ?? baseOutput
              const value = applyModifiers(refName, isNullable, isOptional, isNullish)
              return `get "${propName}"() { return ${value} }`
            }

            const value = applyModifiers(wrappedOutput, isNullable, isOptional, isNullish)
            return `"${propName}": ${value}`
          })
          .join(',\n    ')

        let result = `z.object({\n    ${properties}\n    })`

        // Handle additionalProperties as .catchall()
        if (node.additionalProperties && node.additionalProperties !== true) {
          const catchallType = this.transform(node.additionalProperties)
          if (catchallType) {
            result += `.catchall(${catchallType})`
          }
        } else if (node.additionalProperties === true) {
          result += '.catchall(z.unknown())'
        }

        return result
      },

      // -- Array -----------------------------------------------------------
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || 'z.unknown()'
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
        return members.reduce((acc, m) => `${acc}.and(${m})`)
      },
    },

    print(node) {
      const base = this.transform(node)
      if (!base) return null

      let output = base

      // Apply nullable / optional / nullish modifiers
      if (node.nullish) {
        output = `${output}.nullish()`
      } else {
        if (node.nullable) {
          output = `${output}.nullable()`
        }
        if (node.optional) {
          output = `${output}.optional()`
        }
      }

      // Apply default
      if (node.default !== undefined) {
        output = `${output}.default(${formatDefault(node.default)})`
      }

      // Apply describe
      if (node.description) {
        output = `${output}.describe(${stringify(node.description)})`
      }

      return output
    },
  }
})

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** Apply nullable / optional / nullish modifiers to a property value string (chainable API). */
function applyModifiers(value: string, nullable?: boolean, optional?: boolean, nullish?: boolean): string {
  if (nullish) {
    return `${value}.nullish()`
  }
  if (nullable && optional) {
    return `${value}.nullish()`
  }
  if (optional) {
    return `${value}.optional()`
  }
  if (nullable) {
    return `${value}.nullable()`
  }
  return value
}
