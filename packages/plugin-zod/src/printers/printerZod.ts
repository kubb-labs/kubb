import { stringify, toRegExpString } from '@internals/utils'
import { narrowSchema, syncSchemaRef } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import type { ResolverZod } from '../types.ts'

export type ZodOptions = {
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  guidType?: 'uuid' | 'guid'
  wrapOutput?: (opts: { output: string; schema: any }) => string | undefined
  resolver?: ResolverZod
  schemaName?: string
  /**
   * Property keys to exclude from the generated object schema via `.omit({ key: true })`.
   */
  keysToOmit?: Array<string>
}

type ZodPrinterFactory = PrinterFactoryOptions<'zod', ZodOptions, string, string>

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

/** Format a primitive enum/literal value: strings are quoted, numbers and booleans are raw. */
function formatLiteral(v: string | number | boolean): string {
  if (typeof v === 'string') return stringify(v)
  return String(v)
}

/** Build `.min()` / `.max()` / `.gt()` / `.lt()` constraint chains for numbers. */
function numberConstraints({
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
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : '',
    exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : '',
  ].join('')
}

/** Build `.min()` / `.max()` chains for strings/arrays. */
function lengthConstraints({ min, max, pattern }: { min?: number; max?: number; pattern?: string }): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    pattern !== undefined ? `.regex(${toRegExpString(pattern, null)})` : '',
  ].join('')
}

/** Apply nullable / optional / nullish modifiers and optional description to a property value string (chainable API). */
function applyModifiers({
  value,
  nullable,
  optional,
  nullish,
  defaultValue,
  description,
}: {
  value: string
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
  description?: string
}): string {
  let result = value
  if (nullish || (nullable && optional)) {
    result = `${result}.nullish()`
  } else if (optional) {
    result = `${result}.optional()`
  } else if (nullable) {
    result = `${result}.nullable()`
  }
  if (defaultValue !== undefined) {
    result = `${result}.default(${formatDefault(defaultValue)})`
  }
  if (description) {
    result = `${result}.describe(${stringify(description)})`
  }
  return result
}

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
      any: () => 'z.any()',
      unknown: () => 'z.unknown()',
      void: () => 'z.void()',
      never: () => 'z.never()',
      boolean: () => 'z.boolean()',
      null: () => 'z.null()',
      string(node) {
        const base = shouldCoerce(this.options.coercion, 'strings') ? 'z.coerce.string()' : 'z.string()'
        return `${base}${lengthConstraints(node)}`
      },
      number(node) {
        const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number()' : 'z.number()'
        return `${base}${numberConstraints(node)}`
      },
      integer(node) {
        const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number().int()' : 'z.int()'
        return `${base}${numberConstraints(node)}`
      },
      bigint() {
        return shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.bigint()' : 'z.bigint()'
      },
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

            // For ref schemas, structural metadata lives on schema.schema rather than the ref node itself.
            const meta = syncSchemaRef(schema)

            const isNullable = meta?.nullable
            const isOptional = schema.optional
            const isNullish = schema.nullish

            const baseOutput = this.transform(schema) ?? 'z.unknown()'

            const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput : baseOutput

            const value = applyModifiers({
              value: wrappedOutput,
              nullable: isNullable,
              optional: isOptional,
              nullish: isNullish,
              defaultValue: meta?.default,
              description: meta?.description,
            })

            const isSelfRef = this.options.schemaName != null && containsRef(schema, this.options.schemaName, this.options.resolver)
            if (isSelfRef) {
              return `get "${propName}"() { return ${value} }`
            }
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
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || 'z.unknown()'
        return `z.array(${inner})${lengthConstraints(node)}`
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
            const c = lengthConstraints(s ?? {})
            if (c) {
              base += c
              continue
            }
          } else if (member.primitive === 'number' || member.primitive === 'integer') {
            const n = narrowSchema(member, 'number') ?? narrowSchema(member, 'integer')
            const c = numberConstraints(n ?? {})
            if (c) {
              base += c
              continue
            }
          } else if (member.primitive === 'array') {
            const a = narrowSchema(member, 'array')
            const c = lengthConstraints(a ?? {})
            if (c) {
              base += c
              continue
            }
          }
          const transformed = this.transform(member)
          if (transformed) base = `${base}.and(${transformed})`
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
      return applyModifiers({
        value: base,
        nullable: schema?.nullable,
        optional: node.optional,
        nullish: node.nullish,
        defaultValue: schema?.default,
        description: schema?.description,
      })
    },
  }
})
