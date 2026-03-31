import { stringify, toRegExpString } from '@internals/utils'
import { extractRefName, narrowSchema, syncSchemaRef } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import type { PluginZod, ResolverZod } from '../types.ts'

export type ZodMiniOptions = {
  guidType?: PluginZod['resolvedOptions']['guidType']
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
  resolver?: ResolverZod
  schemaName?: string
  /**
   * Property keys to exclude from the generated object schema via `.omit({ key: true })`.
   */
  keysToOmit?: Array<string>
}

type ZodMiniPrinterFactory = PrinterFactoryOptions<'zod-mini', ZodMiniOptions, string, string>

/** Format a default value as a code-level literal. */
function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
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

/** Returns true when the schema tree contains a self-referential `$ref` (resolved name matches schemaName). */
function containsSelfRef(node: SchemaNode, schemaName: string, resolver: ResolverZod | undefined): boolean {
  if (node.type === 'ref' && node.ref) {
    const rawName = extractRefName(node.ref) ?? node.name
    const resolved = rawName ? (resolver?.default(rawName, 'function') ?? rawName) : node.name
    return resolved === schemaName
  }
  if (node.type === 'object') {
    if (node.properties?.some((p) => containsSelfRef(p.schema, schemaName, resolver))) return true
    if (node.additionalProperties && node.additionalProperties !== true) {
      return containsSelfRef(node.additionalProperties, schemaName, resolver)
    }
    return false
  }
  if (node.type === 'array' || node.type === 'tuple') {
    return node.items?.some((item) => containsSelfRef(item, schemaName, resolver)) ?? false
  }
  if (node.type === 'union' || node.type === 'intersection') {
    return node.members?.some((m) => containsSelfRef(m, schemaName, resolver)) ?? false
  }
  return false
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
      uuid(node) {
        const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'
        return `${base}${lengthChecksMini(node)}`
      },
      email(node) {
        return `z.email()${lengthChecksMini(node)}`
      },
      url(node) {
        return `z.url()${lengthChecksMini(node)}`
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
        const refName = node.ref ? (extractRefName(node.ref) ?? node.name) : node.name
        const resolvedName = node.ref ? (this.options.resolver?.default(refName, 'function') ?? refName) : node.name
        const isSelfRef = node.ref && this.options.schemaName != null && resolvedName === this.options.schemaName
        if (isSelfRef) {
          return `z.lazy(() => ${resolvedName})`
        }
        return resolvedName
      },
      object(node) {
        const properties = node.properties
          .map((prop) => {
            const { name: propName, schema } = prop

            const meta = syncSchemaRef(schema)

            const isNullable = meta?.nullable
            const isOptional = schema.optional
            const isNullish = schema.nullish

            const hasSelfRef = this.options.schemaName != null && containsSelfRef(schema, this.options.schemaName, this.options.resolver)
            const baseOutput = this.transform(schema) ?? 'z.unknown()'
            // Strip z.lazy() wrappers inside object getters — the getter itself provides deferred evaluation
            const resolvedOutput = hasSelfRef ? baseOutput.replaceAll(`z.lazy(() => ${this.options.schemaName})`, this.options.schemaName!) : baseOutput

            const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: resolvedOutput, schema }) || resolvedOutput : resolvedOutput

            const value = applyMiniModifiers({
              value: wrappedOutput,
              nullable: isNullable,
              optional: isOptional,
              nullish: isNullish,
              defaultValue: meta?.default,
            })

            if (hasSelfRef) {
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
        let result = `z.array(${inner})${lengthChecksMini(node)}`
        if (node.unique) {
          result += `.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })`
        }
        return result
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
      const meta = syncSchemaRef(node)

      if (keysToOmit?.length && meta?.primitive === 'object' && !(meta.type === 'union' && meta.discriminatorPropertyName)) {
        // Mirror printerTs `nonNullable: true`: when omitting keys, the resulting
        // schema is a new non-nullable object type — skip optional/nullable/nullish.
        // Discriminated unions (z.discriminatedUnion) do not support .omit(), so skip them.
        return `${base}.omit({ ${keysToOmit.map((k) => `"${k}": true`).join(', ')} })`
      }

      const schema = syncSchemaRef(node)
      return applyMiniModifiers({ value: base, nullable: schema?.nullable, optional: node.optional, nullish: node.nullish, defaultValue: schema?.default })
    },
  }
})
