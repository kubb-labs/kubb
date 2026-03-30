import { stringify, toRegExpString } from '@internals/utils'
import { narrowSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import type { ResolverZod } from '../types.ts'

export type ZodMiniOptions = {
  guidType?: 'uuid' | 'guid'
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
  resolver?: ResolverZod
  schemaName?: string
  /**
   * Property keys to exclude from the generated object schema via `.omit({ key: true })`.
   */
  keysToOmit?: Array<string>
}

type ZodMiniPrinterFactory = PrinterFactoryOptions<'zod-mini', ZodMiniOptions, string, string>

function containsRef(schema: SchemaNode, schemaName: string, resolver: ResolverZod | undefined): boolean {
  if (schema.type === 'ref') {
    const resolvedName = schema.ref ? (resolver?.default(schema.name ?? '', 'function') ?? schema.name ?? '') : (schema.name ?? '')
    return resolvedName === schemaName
  }
  if ('items' in schema && Array.isArray(schema.items)) {
    return schema.items.some((item) => containsRef(item, schemaName, resolver))
  }
  if ('members' in schema && Array.isArray(schema.members)) {
    return schema.members.some((member) => containsRef(member, schemaName, resolver))
  }
  if ('properties' in schema && Array.isArray(schema.properties)) {
    return schema.properties.some((prop) => containsRef(prop.schema, schemaName, resolver))
  }
  return false
}

/** Format a default value as a code-level literal. */
function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return '{}'
  return String(value ?? '')
}

/** Format a primitive enum/literal value: strings are quoted, numbers and booleans are raw. */
function formatLiteral(v: string | number | boolean): string {
  if (typeof v === 'string') return stringify(v)
  return String(v)
}

/** Build `.check(z.minimum(), z.maximum())` for mini-mode numeric constraints. */
function numberChecksMini({
  min,
  max,
  exclusiveMinimum,
  exclusiveMaximum,
}: {
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
}): string {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minimum(${min})`)
  if (max !== undefined) checks.push(`z.maximum(${max})`)
  if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
  if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/** Build `.check(z.minLength(), z.maxLength())` for mini-mode length constraints. */
function lengthChecksMini({ min, max, pattern }: { min?: number; max?: number; pattern?: string }): string {
  const checks: string[] = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  if (pattern !== undefined) checks.push(`z.regex(${toRegExpString(pattern, null)})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

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
      any: () => 'z.any()',
      unknown: () => 'z.unknown()',
      void: () => 'z.void()',
      never: () => 'z.never()',
      boolean: () => 'z.boolean()',
      null: () => 'z.null()',
      string(node) {
        return `z.string()${lengthChecksMini(node)}`
      },
      number(node) {
        return `z.number()${numberChecksMini(node)}`
      },
      integer(node) {
        return `z.int()${numberChecksMini(node)}`
      },
      bigint() {
        return 'z.bigint()'
      },
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
      enum(node) {
        const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []

        // asConst-style enum: use z.union([z.literal(…), …])
        const hasNamedValues = !!node.namedEnumValues?.length
        if (hasNamedValues) {
          const literals = values
            .filter((v): v is string | number | boolean => v !== null)
            .map((v) => `z.literal(${formatLiteral(v as string | number | boolean)})`)
          if (literals.length === 1) return literals[0]!
          return `z.union([${literals.join(', ')}])`
        }

        // Regular enum: use z.enum([…])
        const items = values.filter((v): v is string | number | boolean => v !== null).map((v) => formatLiteral(v as string | number | boolean))
        return `z.enum([${items.join(', ')}])`
      },

      ref(node) {
        if (!node.name) return undefined
        const resolvedName = node.ref ? (this.options.resolver?.default(node.name, 'function') ?? node.name) : node.name
        return resolvedName
      },
      object(node) {
        const properties = node.properties
          .map((prop) => {
            const { name: propName, schema } = prop

            const isNullable = schema.nullable
            const isOptional = schema.optional
            const isNullish = schema.nullish

            const baseOutput = this.transform(schema) ?? 'z.unknown()'

            const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput : baseOutput

            const value = applyMiniModifiers({
              value: wrappedOutput,
              nullable: isNullable,
              optional: isOptional,
              nullish: isNullish,
              defaultValue: schema.default,
            })

            const isSelfRef = this.options.schemaName != null && containsRef(schema, this.options.schemaName, this.options.resolver)
            if (isSelfRef) {
              return `get "${propName}"() { return ${value} }`
            }
            return `"${propName}": ${value}`
          })
          .join(',\n    ')

        return `z.object({\n    ${properties}\n    })`
      },
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || 'z.unknown()'
        return `z.array(${inner})${lengthChecksMini(node)}`
      },
      tuple(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        return `z.tuple([${items.join(', ')}])`
      },
      union(node) {
        const members = (node.members ?? []).map((m) => this.transform(m)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        return `z.union([${members.join(', ')}])`
      },
      intersection(node) {
        const members = node.members ?? []
        if (members.length === 0) return ''

        const [first, ...rest] = members
        if (!first) return ''

        let base = this.transform(first)
        if (!base) return ''

        for (const member of rest) {
          if (member.primitive === 'string') {
            const s = narrowSchema(member, 'string')
            const c = lengthChecksMini(s ?? {})
            if (c) {
              base += c
              continue
            }
          } else if (member.primitive === 'number' || member.primitive === 'integer') {
            const n = narrowSchema(member, 'number') ?? narrowSchema(member, 'integer')
            const c = numberChecksMini(n ?? {})
            if (c) {
              base += c
              continue
            }
          } else if (member.primitive === 'array') {
            const a = narrowSchema(member, 'array')
            const c = lengthChecksMini(a ?? {})
            if (c) {
              base += c
              continue
            }
          }
          const transformed = this.transform(member)
          if (transformed) base = `z.intersection(${base}, ${transformed})`
        }

        return base
      },
    },

    print(node) {
      const base = this.transform(node)
      if (!base) return null

      const { keysToOmit } = this.options
      if (keysToOmit?.length && (node.primitive === 'object' || node.type === 'ref')) {
        // Mirror printerTs `nonNullable: true`: when omitting keys, the resulting
        // schema is a new non-nullable object type — skip optional/nullable/nullish.
        // Also allow refs: a $ref request body is parsed as a ref node but resolves to an object.
        return `${base}.omit({ ${keysToOmit.map((k) => `"${k}": true`).join(', ')} })`
      }

      return applyMiniModifiers({ value: base, nullable: node.nullable, optional: node.optional, nullish: node.nullish, defaultValue: node.default })
    },
  }
})

/** Apply nullable / optional / nullish modifiers and optional description to a property value string (functional API). */
function applyMiniModifiers({
  value,
  nullable,
  optional,
  nullish,
  defaultValue,
}: {
  value: string
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
}): string {
  let result = value
  if (nullish) {
    result = `z.nullish(${result})`
  } else {
    if (nullable) {
      result = `z.nullable(${result})`
    }
    if (optional) {
      result = `z.optional(${result})`
    }
  }
  if (defaultValue !== undefined) {
    result = `z._default(${result}, ${formatDefault(defaultValue)})`
  }
  return result
}
