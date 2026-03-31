import { stringify } from '@internals/utils'
import { createSchema, extractRefName, narrowSchema, syncSchemaRef } from '@kubb/ast'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import type { PluginZod, ResolverZod } from '../types.ts'
import { applyModifiers, containsSelfRef, formatLiteral, lengthConstraints, numberConstraints, shouldCoerce } from '../utils.ts'

export type ZodOptions = {
  coercion?: PluginZod['resolvedOptions']['coercion']
  guidType?: PluginZod['resolvedOptions']['guidType']
  wrapOutput?: PluginZod['resolvedOptions']['wrapOutput']
  resolver?: ResolverZod
  schemaName?: string
  /**
   * Property keys to exclude from the generated object schema via `.omit({ key: true })`.
   */
  keysToOmit?: Array<string>
}

type ZodPrinterFactory = PrinterFactoryOptions<'zod', ZodOptions, string, string>

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
  return {
    name: 'zod',
    options,
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
      uuid(node) {
        const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'

        return `${base}${lengthConstraints(node)}`
      },
      email(node) {
        return `z.email()${lengthConstraints(node)}`
      },
      url(node) {
        return `z.url()${lengthConstraints(node)}`
      },
      ipv4: () => 'z.ipv4()',
      ipv6: () => 'z.ipv6()',
      blob: () => 'z.instanceof(File)',
      enum(node) {
        const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []
        const nonNullValues = values.filter((v): v is string | number | boolean => v !== null)

        // asConst-style enum: use z.union([z.literal(…), …])
        if (node.namedEnumValues?.length) {
          const literals = nonNullValues.map((v) => `z.literal(${formatLiteral(v)})`)

          if (literals.length === 1) return literals[0]!
          return `z.union([${literals.join(', ')}])`
        }

        // Regular enum: use z.enum([…])
        return `z.enum([${nonNullValues.map(formatLiteral).join(', ')}])`
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

            const isNullable = meta.nullable
            const isOptional = schema.optional
            const isNullish = schema.nullish

            const hasSelfRef =
              this.options.schemaName != null && containsSelfRef(schema, { schemaName: this.options.schemaName, resolver: this.options.resolver })
            const baseOutput = this.transform(schema) ?? this.transform(createSchema({ type: 'unknown' }))!
            // Strip z.lazy() wrappers inside object getters — the getter itself provides deferred evaluation
            const resolvedOutput = hasSelfRef ? baseOutput.replaceAll(`z.lazy(() => ${this.options.schemaName})`, this.options.schemaName!) : baseOutput

            const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: resolvedOutput, schema }) || resolvedOutput : resolvedOutput

            const value = applyModifiers({
              value: wrappedOutput,
              nullable: isNullable,
              optional: isOptional,
              nullish: isNullish,
              defaultValue: meta.default,
              description: meta.description,
            })

            if (hasSelfRef) {
              return `get "${propName}"() { return ${value} }`
            }
            return `"${propName}": ${value}`
          })
          .join(',\n    ')

        let result = `z.object({\n    ${properties}\n    })`

        // Handle additionalProperties as .catchall() or .strict()
        if (node.additionalProperties && node.additionalProperties !== true) {
          const catchallType = this.transform(node.additionalProperties)
          if (catchallType) {
            result += `.catchall(${catchallType})`
          }
        } else if (node.additionalProperties === true) {
          result += '.catchall(z.unknown())'
        } else if (node.additionalProperties === false) {
          result += '.strict()'
        }

        return result
      },
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || this.transform(createSchema({ type: 'unknown' }))!
        let result = `z.array(${inner})${lengthConstraints(node)}`

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
        const nodeMembers = node.members ?? []
        const members = nodeMembers.map((m) => this.transform(m)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        if (node.discriminatorPropertyName && !nodeMembers.some((m) => m.type === 'intersection')) {
          // z.discriminatedUnion requires ZodObject members; intersections (ZodIntersection) are not
          // assignable to $ZodDiscriminant, so fall back to z.union when any member is an intersection.
          return `z.discriminatedUnion(${stringify(node.discriminatorPropertyName)}, [${members.join(', ')}])`
        }

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
      const { keysToOmit } = this.options

      let base = this.transform(node)
      if (!base) return null

      const meta = syncSchemaRef(node)

      if (keysToOmit?.length && meta.primitive === 'object' && !(meta.type === 'union' && meta.discriminatorPropertyName)) {
        // Mirror printerTs `nonNullable: true`: when omitting keys, the resulting
        // schema is a new non-nullable object type — skip optional/nullable/nullish.
        // Discriminated unions (z.discriminatedUnion) do not support .omit(), so skip them.
        base = `${base}.omit({ ${keysToOmit.map((k) => `"${k}": true`).join(', ')} })`
      }

      return applyModifiers({
        value: base,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
        description: meta.description,
      })
    },
  }
})
