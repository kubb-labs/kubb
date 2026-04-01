import { extractRefName, isStringType, narrowSchema, schemaTypes, syncSchemaRef } from '@kubb/ast'
import type { PrinterFactoryOptions, PrinterPartial } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import type ts from 'typescript'
import { ENUM_TYPES_WITH_KEY_SUFFIX, OPTIONAL_ADDS_QUESTION_TOKEN, OPTIONAL_ADDS_UNDEFINED } from '../constants.ts'
import * as factory from '../factory.ts'
import type { PluginTs, ResolverTs } from '../types.ts'
import { buildPropertyJSDocComments } from '../utils.ts'

/**
 * Partial map of node-type overrides for the TypeScript printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`). The function
 * replaces the built-in handler for that node type. Use `this.transform` to
 * recurse into nested schema nodes, and `this.options` to read printer options.
 *
 * @example Override the `date` handler
 * ```ts
 * pluginTs({
 *   printer: {
 *     nodes: {
 *       date(node) {
 *         return ts.factory.createTypeReferenceNode('Date', [])
 *       },
 *     },
 *   },
 * })
 * ```
 */
export type PrinterTsNodes = PrinterPartial<ts.TypeNode, PrinterTsOptions>

export type PrinterTsOptions = {
  /**
   * @default `'questionToken'`
   */
  optionalType: PluginTs['resolvedOptions']['optionalType']
  /**
   * @default `'array'`
   */
  arrayType: PluginTs['resolvedOptions']['arrayType']
  /**
   * @default `'inlineLiteral'`
   */
  enumType: PluginTs['resolvedOptions']['enumType']
  /**
   * Suffix appended to the generated type alias name when `enumType` is `asConst` or `asPascalConst`.
   *
   * @default `'Key'`
   */
  enumTypeSuffix?: PluginTs['resolvedOptions']['enumTypeSuffix']
  /**
   * Controls whether a `type` alias or `interface` declaration is emitted.
   * @default `'type'`
   */
  syntaxType?: PluginTs['resolvedOptions']['syntaxType']
  /**
   * When set, `printer.print(node)` produces a full `type Name = …` declaration.
   * When omitted, `printer.print(node)` returns the raw type node.
   */
  name?: string

  /**
   * JSDoc `@description` comment added to the generated type or interface declaration.
   */
  description?: string
  /**
   * Property keys to exclude from the generated type via `Omit<Type, Keys>`.
   * Forces type-alias syntax even when `syntaxType` is `'interface'`.
   */
  keysToOmit?: Array<string>
  /**
   * Resolver used to transform raw schema names into valid TypeScript identifiers.
   */
  resolver: ResolverTs
  /**
   * Names of top-level schemas that are enums.
   * When set, the `ref` handler uses the suffixed type name (e.g. `StatusKey`) for enum refs
   * instead of the plain PascalCase name, so imports align with what the enum file actually exports.
   */
  enumSchemaNames?: Set<string>
  /**
   * Partial map of node-type overrides. Each entry replaces the built-in handler for that node type.
   */
  nodes?: PrinterTsNodes
}

/**
 * TypeScript printer factory options: maps `SchemaNode` → `ts.TypeNode` (raw) or `ts.Node` (full declaration).
 */
export type PrinterTsFactory = PrinterFactoryOptions<'typescript', PrinterTsOptions, ts.TypeNode, string>

type PrinterTs = PrinterTsFactory

/**
 * TypeScript type printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST node into a TypeScript AST node:
 * - **`printer.print(node)`** — when `options.typeName` is set, returns a full
 *   `type Name = …` or `interface Name { … }` declaration (`ts.Node`).
 *   Without `typeName`, returns the raw `ts.TypeNode` for the schema.
 *
 * Dispatches on `node.type` to the appropriate handler in `nodes`. Options are closed
 * over per printer instance, so each call to `printerTs(options)` produces an independent printer.
 *
 * @example Raw type node (no `typeName`)
 * ```ts
 * const printer = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral' })
 * const typeNode = printer.print(schemaNode) // ts.TypeNode
 * ```
 *
 * @example Full declaration (with `typeName`)
 * ```ts
 * const printer = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral', typeName: 'MyType' })
 * const declaration = printer.print(schemaNode) // ts.TypeAliasDeclaration | ts.InterfaceDeclaration
 * ```
 */
export const printerTs = definePrinter<PrinterTs>((options) => {
  const addsUndefined = OPTIONAL_ADDS_UNDEFINED.has(options.optionalType)

  return {
    name: 'typescript',
    options,
    nodes: {
      any: () => factory.keywordTypeNodes.any,
      unknown: () => factory.keywordTypeNodes.unknown,
      void: () => factory.keywordTypeNodes.void,
      never: () => factory.keywordTypeNodes.never,
      boolean: () => factory.keywordTypeNodes.boolean,
      null: () => factory.keywordTypeNodes.null,
      blob: () => factory.createTypeReferenceNode('Blob', []),
      string: () => factory.keywordTypeNodes.string,
      uuid: () => factory.keywordTypeNodes.string,
      email: () => factory.keywordTypeNodes.string,
      url: (node) => {
        if (node.path) {
          return factory.createUrlTemplateType(node.path)
        }
        return factory.keywordTypeNodes.string
      },
      ipv4: () => factory.keywordTypeNodes.string,
      ipv6: () => factory.keywordTypeNodes.string,
      datetime: () => factory.keywordTypeNodes.string,
      number: () => factory.keywordTypeNodes.number,
      integer: () => factory.keywordTypeNodes.number,
      bigint: () => factory.keywordTypeNodes.bigint,
      date: factory.dateOrStringNode,
      time: factory.dateOrStringNode,
      ref(node) {
        if (!node.name) {
          return undefined
        }
        // Parser-generated refs (with $ref) carry raw schema names that need resolving.
        // Use the canonical name from the $ref path — node.name may have been overridden
        // (e.g. by single-member allOf flatten using the property-derived child name).
        // Inline refs (without $ref) from utils already carry resolved type names.
        const refName = node.ref ? (extractRefName(node.ref) ?? node.name) : node.name

        // When a Key suffix is configured, enum refs must use the suffixed name (e.g. `StatusKey`)
        // so the reference matches what the enum file actually exports.
        const isEnumRef =
          node.ref && ENUM_TYPES_WITH_KEY_SUFFIX.has(this.options.enumType) && this.options.enumTypeSuffix && this.options.enumSchemaNames?.has(refName)

        const name = isEnumRef
          ? this.options.resolver.resolveEnumKeyName({ name: refName }, this.options.enumTypeSuffix!)
          : node.ref
            ? this.options.resolver.default(refName, 'type')
            : refName

        return factory.createTypeReferenceNode(name, undefined)
      },
      enum(node) {
        const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []

        if (this.options.enumType === 'inlineLiteral' || !node.name) {
          const literalNodes = values
            .filter((v): v is string | number | boolean => v !== null && v !== undefined)
            .map((value) => factory.constToTypeNode(value, typeof value as 'string' | 'number' | 'boolean'))
            .filter(Boolean)

          return factory.createUnionDeclaration({ withParentheses: true, nodes: literalNodes }) ?? undefined
        }

        const resolvedName =
          ENUM_TYPES_WITH_KEY_SUFFIX.has(this.options.enumType) && this.options.enumTypeSuffix
            ? this.options.resolver.resolveEnumKeyName(node, this.options.enumTypeSuffix)
            : this.options.resolver.default(node.name, 'type')

        return factory.createTypeReferenceNode(resolvedName, undefined)
      },
      union(node) {
        const members = node.members ?? []

        const hasStringLiteral = members.some((m) => {
          const enumNode = narrowSchema(m, schemaTypes.enum)
          return enumNode?.primitive === 'string'
        })
        const hasPlainString = members.some((m) => isStringType(m))

        if (hasStringLiteral && hasPlainString) {
          const memberNodes = members
            .map((m) => {
              if (isStringType(m)) {
                return factory.createIntersectionDeclaration({
                  nodes: [factory.keywordTypeNodes.string, factory.createTypeLiteralNode([])],
                  withParentheses: true,
                })
              }

              return this.transform(m)
            })
            .filter(Boolean)

          return factory.createUnionDeclaration({ withParentheses: true, nodes: memberNodes }) ?? undefined
        }

        return factory.createUnionDeclaration({ withParentheses: true, nodes: factory.buildMemberNodes(members, this.transform) }) ?? undefined
      },
      intersection(node) {
        return factory.createIntersectionDeclaration({ withParentheses: true, nodes: factory.buildMemberNodes(node.members, this.transform) }) ?? undefined
      },
      array(node) {
        const itemNodes = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)

        return factory.createArrayDeclaration({ nodes: itemNodes, arrayType: this.options.arrayType }) ?? undefined
      },
      tuple(node) {
        return factory.buildTupleNode(node, this.transform)
      },
      object(node) {
        const { transform, options } = this

        const addsQuestionToken = OPTIONAL_ADDS_QUESTION_TOKEN.has(options.optionalType)

        const propertyNodes: Array<ts.TypeElement> = node.properties.map((prop) => {
          const baseType = transform(prop.schema) ?? factory.keywordTypeNodes.unknown
          const type = factory.buildPropertyType(prop.schema, baseType, options.optionalType)
          const propMeta = syncSchemaRef(prop.schema)

          const propertyNode = factory.createPropertySignature({
            questionToken: prop.schema.optional || prop.schema.nullish ? addsQuestionToken : false,
            name: prop.name,
            type,
            readOnly: propMeta?.readOnly,
          })

          return factory.appendJSDocToNode({ node: propertyNode, comments: buildPropertyJSDocComments(prop.schema) })
        })

        const allElements = [...propertyNodes, ...factory.buildIndexSignatures(node, propertyNodes.length, transform)]

        if (!allElements.length) {
          return factory.keywordTypeNodes.object
        }

        return factory.createTypeLiteralNode(allElements)
      },
      ...options.nodes,
    },
    print(node) {
      const { name, syntaxType = 'type', description, keysToOmit } = this.options

      let base = this.transform(node)
      if (!base) return null

      // For ref nodes, structural metadata lives on node.schema rather than the ref node itself.
      const meta = syncSchemaRef(node)

      // Without name, apply modifiers inline and return.
      if (!name) {
        if (meta.nullable) {
          base = factory.createUnionDeclaration({ nodes: [base, factory.keywordTypeNodes.null] })
        }
        if ((meta.nullish || meta.optional) && addsUndefined) {
          base = factory.createUnionDeclaration({ nodes: [base, factory.keywordTypeNodes.undefined] })
        }
        return safePrint(base)
      }

      // When keysToOmit is present, wrap with Omit first, then apply nullable/optional
      // modifiers so they are not swallowed by NonNullable inside createOmitDeclaration.
      let inner: ts.TypeNode = keysToOmit?.length ? factory.createOmitDeclaration({ keys: keysToOmit, type: base, nonNullable: true }) : base

      if (meta.nullable) {
        inner = factory.createUnionDeclaration({ nodes: [inner, factory.keywordTypeNodes.null] })
      }

      // For named type declarations (type aliases), optional/nullish always produces | undefined
      // regardless of optionalType — the questionToken ? modifier only applies to object properties.
      if (meta.nullish || meta.optional) {
        inner = factory.createUnionDeclaration({ nodes: [inner, factory.keywordTypeNodes.undefined] })
      }

      const useTypeGeneration = syntaxType === 'type' || inner.kind === factory.syntaxKind.union || !!keysToOmit?.length

      const typeNode = factory.createTypeDeclaration({
        name,
        isExportable: true,
        type: inner,
        syntax: useTypeGeneration ? 'type' : 'interface',
        comments: buildPropertyJSDocComments({
          ...meta,
          description,
        }),
      })

      return safePrint(typeNode)
    },
  }
})
