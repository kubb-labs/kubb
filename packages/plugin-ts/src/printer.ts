import { jsStringEscape, stringify } from '@internals/utils'
import { isPlainStringType } from '@kubb/ast'
import type { ArraySchemaNode, SchemaNode } from '@kubb/ast/types'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import type ts from 'typescript'
import { ENUM_TYPES_WITH_KEY_SUFFIX, OPTIONAL_ADDS_QUESTION_TOKEN, OPTIONAL_ADDS_UNDEFINED } from './constants.ts'
import * as factory from './factory.ts'
import type { PluginTs, ResolverTs } from './types.ts'

type TsOptions = {
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
   * Controls whether a `type` alias or `interface` declaration is emitted.
   * @default `'type'`
   */
  syntaxType?: PluginTs['resolvedOptions']['syntaxType']
  /**
   * When set, `printer.print(node)` produces a full `type Name = …` declaration.
   * When omitted, `printer.print(node)` returns the raw type node.
   */
  typeName?: string

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
}

/**
 * TypeScript printer factory options: maps `SchemaNode` → `ts.TypeNode` (raw) or `ts.Node` (full declaration).
 */
type TsPrinter = PrinterFactoryOptions<'typescript', TsOptions, ts.TypeNode, ts.Node>

/**
 * Converts a primitive const value to a TypeScript literal type node.
 * Handles negative numbers via a prefix unary expression.
 */
function constToTypeNode(value: string | number | boolean, format: 'string' | 'number' | 'boolean'): ts.TypeNode | undefined {
  if (format === 'boolean') {
    return factory.createLiteralTypeNode(value === true ? factory.createTrue() : factory.createFalse())
  }
  if (format === 'number' && typeof value === 'number') {
    if (value < 0) {
      return factory.createLiteralTypeNode(factory.createPrefixUnaryExpression(factory.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(value))))
    }
    return factory.createLiteralTypeNode(factory.createNumericLiteral(value))
  }
  return factory.createLiteralTypeNode(factory.createStringLiteral(String(value)))
}

/**
 * Returns a `Date` reference type node when `representation` is `'date'`, otherwise falls back to `string`.
 */
function dateOrStringNode(node: { representation?: string }): ts.TypeNode {
  return node.representation === 'date' ? factory.createTypeReferenceNode(factory.createIdentifier('Date')) : factory.keywordTypeNodes.string
}

/**
 * Maps an array of `SchemaNode`s through the printer, filtering out `null` and `undefined` results.
 */
function buildMemberNodes(members: Array<SchemaNode> | undefined, print: (node: SchemaNode) => ts.TypeNode | null | undefined): Array<ts.TypeNode> {
  return (members ?? []).map(print).filter(Boolean)
}

/**
 * Builds a TypeScript tuple type node from an array schema's `items`,
 * applying min/max slice and optional/rest element rules.
 */
function buildTupleNode(node: ArraySchemaNode, print: (node: SchemaNode) => ts.TypeNode | null | undefined): ts.TypeNode | undefined {
  let items = (node.items ?? []).map(print).filter(Boolean)

  const restNode = node.rest ? (print(node.rest) ?? undefined) : undefined
  const { min, max } = node

  if (max !== undefined) {
    items = items.slice(0, max)
    if (items.length < max && restNode) {
      items = [...items, ...Array(max - items.length).fill(restNode)]
    }
  }

  if (min !== undefined) {
    items = items.map((item, i) => (i >= min ? factory.createOptionalTypeNode(item) : item))
  }

  if (max === undefined && restNode) {
    items.push(factory.createRestTypeNode(factory.createArrayTypeNode(restNode)))
  }

  return factory.createTupleTypeNode(items)
}

/**
 * Applies `nullable` and optional/nullish `| undefined` union modifiers to a property's resolved base type.
 */
function buildPropertyType(schema: SchemaNode, baseType: ts.TypeNode, optionalType: TsOptions['optionalType']): ts.TypeNode {
  const addsUndefined = OPTIONAL_ADDS_UNDEFINED.has(optionalType)

  let type = baseType

  if (schema.nullable) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.null] })
  }

  if ((schema.nullish || schema.optional) && addsUndefined) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] })
  }

  return type
}

/**
 * Collects JSDoc annotation strings (description, deprecated, min/max, pattern, default, example, type) for a schema node.
 */
function buildPropertyJSDocComments(schema: SchemaNode): Array<string | undefined> {
  const isArray = schema.type === 'array'

  return [
    'description' in schema && schema.description ? `@description ${jsStringEscape(schema.description)}` : undefined,
    'deprecated' in schema && schema.deprecated ? '@deprecated' : undefined,
    // minItems/maxItems on arrays should not be emitted as @minLength/@maxLength
    !isArray && 'min' in schema && schema.min !== undefined ? `@minLength ${schema.min}` : undefined,
    !isArray && 'max' in schema && schema.max !== undefined ? `@maxLength ${schema.max}` : undefined,
    'pattern' in schema && schema.pattern ? `@pattern ${schema.pattern}` : undefined,
    'default' in schema && schema.default !== undefined
      ? `@default ${'primitive' in schema && schema.primitive === 'string' ? stringify(schema.default as string) : schema.default}`
      : undefined,
    'example' in schema && schema.example !== undefined ? `@example ${schema.example}` : undefined,
    'primitive' in schema && schema.primitive
      ? [`@type ${schema.primitive || 'unknown'}`, 'optional' in schema && schema.optional ? ' | undefined' : undefined].filter(Boolean).join('')
      : undefined,
  ]
}

/**
 * Creates TypeScript index signatures for `additionalProperties` and `patternProperties` on an object schema node.
 */
function buildIndexSignatures(
  node: { additionalProperties?: SchemaNode | boolean; patternProperties?: Record<string, SchemaNode> },
  propertyCount: number,
  print: (node: SchemaNode) => ts.TypeNode | null | undefined,
): Array<ts.TypeElement> {
  const elements: Array<ts.TypeElement> = []

  if (node.additionalProperties && node.additionalProperties !== true) {
    const additionalType = print(node.additionalProperties) ?? factory.keywordTypeNodes.unknown

    elements.push(factory.createIndexSignature(propertyCount > 0 ? factory.keywordTypeNodes.unknown : additionalType))
  } else if (node.additionalProperties === true) {
    elements.push(factory.createIndexSignature(factory.keywordTypeNodes.unknown))
  }

  if (node.patternProperties) {
    const first = Object.values(node.patternProperties)[0]
    if (first) {
      let patternType = print(first) ?? factory.keywordTypeNodes.unknown

      if (first.nullable) {
        patternType = factory.createUnionDeclaration({ nodes: [patternType, factory.keywordTypeNodes.null] })
      }
      elements.push(factory.createIndexSignature(patternType))
    }
  }

  return elements
}

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
export const printerTs = definePrinter<TsPrinter>((options) => {
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
      datetime: () => factory.keywordTypeNodes.string,
      number: () => factory.keywordTypeNodes.number,
      integer: () => factory.keywordTypeNodes.number,
      bigint: () => factory.keywordTypeNodes.bigint,
      date: dateOrStringNode,
      time: dateOrStringNode,
      ref(node) {
        if (!node.name) {
          return undefined
        }
        // Parser-generated refs (with $ref) carry raw schema names that need resolving.
        // Use the canonical name from the $ref path — node.name may have been overridden
        // (e.g. by single-member allOf flatten using the property-derived child name).
        // Inline refs (without $ref) from utils already carry resolved type names.
        const refName = node.ref ? (node.ref.split('/').at(-1) ?? node.name) : node.name
        const name = node.ref ? this.options.resolver.default(refName, 'type') : refName

        return factory.createTypeReferenceNode(name, undefined)
      },
      enum(node) {
        const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []

        if (this.options.enumType === 'inlineLiteral' || !node.name) {
          const literalNodes = values
            .filter((v): v is string | number | boolean => v !== null)
            .map((value) => constToTypeNode(value, typeof value as 'string' | 'number' | 'boolean'))
            .filter(Boolean)

          return factory.createUnionDeclaration({ withParentheses: true, nodes: literalNodes }) ?? undefined
        }

        const resolvedName = this.options.resolver.default(node.name, 'type')
        const typeName = ENUM_TYPES_WITH_KEY_SUFFIX.has(this.options.enumType) ? `${resolvedName}Key` : resolvedName

        return factory.createTypeReferenceNode(typeName, undefined)
      },
      union(node) {
        const members = node.members ?? []

        const hasStringLiteral = members.some((m) => m.type === 'enum' && m.primitive === 'string')
        const hasPlainString = members.some((m) => isPlainStringType(m))

        if (hasStringLiteral && hasPlainString) {
          const memberNodes = members
            .map((m) => {
              if (isPlainStringType(m)) {
                return factory.createIntersectionDeclaration({
                  nodes: [factory.keywordTypeNodes.string, factory.createTypeLiteralNode([])],
                  withParentheses: true,
                })
              }

              return this.print(m)
            })
            .filter(Boolean)

          return factory.createUnionDeclaration({ withParentheses: true, nodes: memberNodes }) ?? undefined
        }

        return factory.createUnionDeclaration({ withParentheses: true, nodes: buildMemberNodes(members, this.print) }) ?? undefined
      },
      intersection(node) {
        return factory.createIntersectionDeclaration({ withParentheses: true, nodes: buildMemberNodes(node.members, this.print) }) ?? undefined
      },
      array(node) {
        const itemNodes = (node.items ?? []).map((item) => this.print(item)).filter(Boolean)

        return factory.createArrayDeclaration({ nodes: itemNodes, arrayType: this.options.arrayType }) ?? undefined
      },
      tuple(node) {
        return buildTupleNode(node, this.print)
      },
      object(node) {
        const { print, options } = this
        const addsQuestionToken = OPTIONAL_ADDS_QUESTION_TOKEN.has(options.optionalType)

        const propertyNodes: Array<ts.TypeElement> = node.properties.map((prop) => {
          const baseType = print(prop.schema) ?? factory.keywordTypeNodes.unknown
          const type = buildPropertyType(prop.schema, baseType, options.optionalType)

          const propertyNode = factory.createPropertySignature({
            questionToken: prop.schema.optional || prop.schema.nullish ? addsQuestionToken : false,
            name: prop.name,
            type,
            readOnly: prop.schema.readOnly,
          })

          return factory.appendJSDocToNode({ node: propertyNode, comments: buildPropertyJSDocComments(prop.schema) })
        })

        const allElements = [...propertyNodes, ...buildIndexSignatures(node, propertyNodes.length, print)]

        if (!allElements.length) {
          return factory.keywordTypeNodes.object
        }

        return factory.createTypeLiteralNode(allElements)
      },
    },
    print(node) {
      let type = this.print(node)

      if (!type) {
        return undefined
      }

      // Apply top-level nullable / optional union modifiers.
      if (node.nullable) {
        type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.null] })
      }

      if ((node.nullish || node.optional) && addsUndefined) {
        type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] })
      }

      // Without typeName, return the type node as-is (no declaration wrapping).
      const { typeName, syntaxType = 'type', description, keysToOmit } = this.options
      if (!typeName) {
        return type
      }

      const useTypeGeneration = syntaxType === 'type' || type.kind === factory.syntaxKind.union || !!keysToOmit?.length

      return factory.createTypeDeclaration({
        name: typeName,
        isExportable: true,
        type: keysToOmit?.length
          ? factory.createOmitDeclaration({
              keys: keysToOmit,
              type,
              nonNullable: true,
            })
          : type,
        syntax: useTypeGeneration ? 'type' : 'interface',
        comments: [
          node?.title ? jsStringEscape(node.title) : undefined,
          description ? `@description ${jsStringEscape(description)}` : undefined,
          node?.deprecated ? '@deprecated' : undefined,
          node && 'min' in node && node.min !== undefined ? `@minLength ${node.min}` : undefined,
          node && 'max' in node && node.max !== undefined ? `@maxLength ${node.max}` : undefined,
          node && 'pattern' in node && node.pattern ? `@pattern ${node.pattern}` : undefined,
          node?.default ? `@default ${node.default}` : undefined,
          node?.example ? `@example ${node.example}` : undefined,
        ],
      })
    },
  }
})
