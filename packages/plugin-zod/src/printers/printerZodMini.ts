import { stringify } from '@internals/utils'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'

export type ZodMiniOptions = {
  guidType?: 'uuid' | 'guid'
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
}

type ZodMiniPrinterFactory = PrinterFactoryOptions<'zod-mini', ZodMiniOptions, string, string>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a default value as a code-level literal. */
function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return '{}'
  return String(value ?? '')
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
 * Zod v4 **Mini** printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST into a Zod v4 Mini code string using the
 * functional API (`z.optional(z.string())`) for better tree-shaking.
 *
 * For the standard chainable API, see {@link printerZod}.
 *
 * @example
 * ```ts
 * const printer = printerZodMini({})
 * const code = printer.print(optionalStringNode) // "z.optional(z.string())"
 * ```
 */
export const printerZodMini = definePrinter<ZodMiniPrinterFactory>((options) => {
  const opts: Required<Pick<ZodMiniOptions, 'guidType'>> & ZodMiniOptions = {
    guidType: 'uuid',
    ...options,
  }

  return {
    name: 'zod-mini',
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
        return `z.string()${lengthChecksMini(node.min, node.max)}`
      },

      // -- Number / Integer / BigInt ---------------------------------------
      number(node) {
        return `z.number()${numberChecksMini(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
      },

      integer(node) {
        return `z.int()${numberChecksMini(node.min, node.max, node.exclusiveMinimum, node.exclusiveMaximum)}`
      },

      bigint() {
        return 'z.bigint()'
      },

      // -- Date / Time / Datetime ------------------------------------------
      date(node) {
        if (node.representation === 'string') {
          return 'z.iso.date()'
        }
        return 'z.date()'
      },

      datetime() {
        // Mini mode: datetime validation via z.string() (z.iso.datetime not available in mini)
        return 'z.string()'
      },

      time(node) {
        if (node.representation === 'string') {
          return 'z.iso.time()'
        }
        return 'z.date()'
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
        const properties = node.properties
          .map((prop) => {
            const { name: propName, schema } = prop

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
              const value = applyMiniModifiers(refName, isNullable, isOptional, isNullish)
              return `get "${propName}"() { return ${value} }`
            }

            const value = applyMiniModifiers(wrappedOutput, isNullable, isOptional, isNullish)
            return `"${propName}": ${value}`
          })
          .join(',\n    ')

        return `z.object({\n    ${properties}\n    })`
      },

      // -- Array -----------------------------------------------------------
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || 'z.unknown()'
        return `z.array(${inner})${lengthChecksMini(node.min, node.max)}`
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
        // Mini mode doesn't support .and()
        return members[0]!
      },
    },

    print(node) {
      const base = this.transform(node)
      if (!base) return null

      let output = base

      // Apply nullable / optional / nullish modifiers (functional syntax)
      if (node.nullish) {
        output = `z.nullish(${output})`
      } else {
        if (node.nullable) {
          output = `z.nullable(${output})`
        }
        if (node.optional) {
          output = `z.optional(${output})`
        }
      }

      // Apply default (functional syntax)
      if (node.default !== undefined) {
        output = `z._default(${output}, ${formatDefault(node.default)})`
      }

      // describe not supported in mini

      return output
    },
  }
})

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** Apply nullable / optional / nullish modifiers to a property value string (functional API). */
function applyMiniModifiers(
  value: string,
  nullable?: boolean,
  optional?: boolean,
  nullish?: boolean,
): string {
  if (nullish) {
    return `z.nullish(${value})`
  }
  if (nullable && optional) {
    return `z.nullish(${value})`
  }
  if (optional) {
    return `z.optional(${value})`
  }
  if (nullable) {
    return `z.nullable(${value})`
  }
  return value
}
