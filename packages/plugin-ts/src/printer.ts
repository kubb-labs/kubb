import { jsStringEscape, stringify } from '@internals/utils'
import { isPlainStringType } from '@kubb/ast'
import type { ArraySchemaNode, SchemaNode } from '@kubb/ast/types'
import type { PrinterFactoryOptions } from '@kubb/core'
import { definePrinter } from '@kubb/core'
import type ts from 'typescript'
import * as factory from './factory.ts'

type TsOptions = {
  /**
   * @default `'questionToken'`
   */
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * @default `'array'`
   */
  arrayType: 'array' | 'generic'
  /**
   * @default `'inlineLiteral'`
   */
  enumType: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal' | 'inlineLiteral'
}

type TsPrinter = PrinterFactoryOptions<'typescript', TsOptions, ts.TypeNode>

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

function dateOrStringNode(node: { representation?: string }): ts.TypeNode {
  return node.representation === 'date' ? factory.createTypeReferenceNode(factory.createIdentifier('Date')) : factory.keywordTypeNodes.string
}

function buildMemberNodes(members: Array<SchemaNode> | undefined, print: (node: SchemaNode) => ts.TypeNode | null | undefined): Array<ts.TypeNode> {
  return (members ?? []).map(print).filter(Boolean) as Array<ts.TypeNode>
}

function buildTupleNode(node: ArraySchemaNode, print: (node: SchemaNode) => ts.TypeNode | null | undefined): ts.TypeNode | undefined {
  let items = (node.items ?? []).map(print).filter(Boolean) as Array<ts.TypeNode>

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

function buildPropertyType(schema: SchemaNode, baseType: ts.TypeNode, optionalType: TsOptions['optionalType']): ts.TypeNode {
  const addsUndefined = ['undefined', 'questionTokenAndUndefined'].includes(optionalType)

  let type = baseType

  if (schema.nullable) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.null] }) as ts.TypeNode
  }

  if ((schema.nullish || schema.optional) && addsUndefined) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
  }

  return type
}

function buildPropertyJSDocComments(schema: SchemaNode): Array<string | undefined> {
  return [
    'description' in schema && schema.description ? `@description ${jsStringEscape(schema.description as string)}` : undefined,
    'deprecated' in schema && schema.deprecated ? '@deprecated' : undefined,
    'min' in schema && schema.min !== undefined ? `@minLength ${schema.min}` : undefined,
    'max' in schema && schema.max !== undefined ? `@maxLength ${schema.max}` : undefined,
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

function buildIndexSignatures(
  node: { additionalProperties?: SchemaNode | boolean; patternProperties?: Record<string, SchemaNode> },
  propertyCount: number,
  print: (node: SchemaNode) => ts.TypeNode | null | undefined,
): Array<ts.TypeElement> {
  const elements: Array<ts.TypeElement> = []

  if (node.additionalProperties && node.additionalProperties !== true) {
    const additionalType = (print(node.additionalProperties as SchemaNode) ?? factory.keywordTypeNodes.unknown) as ts.TypeNode
    elements.push(factory.createIndexSignature(propertyCount > 0 ? factory.keywordTypeNodes.unknown : additionalType))
  } else if (node.additionalProperties === true) {
    elements.push(factory.createIndexSignature(factory.keywordTypeNodes.unknown))
  }

  if (node.patternProperties) {
    const first = Object.values(node.patternProperties)[0]
    if (first) {
      let patternType = (print(first) ?? factory.keywordTypeNodes.unknown) as ts.TypeNode
      if (first.nullable) {
        patternType = factory.createUnionDeclaration({ nodes: [patternType, factory.keywordTypeNodes.null] }) as ts.TypeNode
      }
      elements.push(factory.createIndexSignature(patternType))
    }
  }

  return elements
}

/**
 * Converts a `SchemaNode` AST node into a TypeScript `ts.TypeNode`.
 *
 * Built on `definePrinter` — dispatches on `node.type`, with options closed over
 * per printer instance. Produces the same `ts.TypeNode` output as the keyword-based
 * `parse` in `parser.ts`.
 */
export const printerTs = definePrinter<TsPrinter>((options) => ({
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
    date: (node) => dateOrStringNode(node),
    time: (node) => dateOrStringNode(node),
    ref(node) {
      if (!node.name) {
        return undefined
      }
      return factory.createTypeReferenceNode(node.name, undefined)
    },
    enum(node) {
      const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []

      if (this.options.enumType === 'inlineLiteral' || !node.name) {
        const literalNodes = values
          .filter((v): v is string | number | boolean => v !== null)
          .map((value) => constToTypeNode(value, typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string'))
          .filter(Boolean) as Array<ts.TypeNode>

        return factory.createUnionDeclaration({ withParentheses: true, nodes: literalNodes }) ?? undefined
      }

      const typeName = ['asConst', 'asPascalConst'].includes(this.options.enumType) ? `${node.name}Key` : node.name

      return factory.createTypeReferenceNode(typeName, undefined)
    },
    union(node) {
      const members = node.members ?? []

      const hasStringLiteral = members.some((m) => m.type === 'enum' && m.enumType === 'string')
      const hasPlainString = members.some((m) => isPlainStringType(m))

      if (hasStringLiteral && hasPlainString) {
        const nodes = members
          .map((m) => {
            if (isPlainStringType(m)) {
              return factory.createIntersectionDeclaration({
                nodes: [factory.keywordTypeNodes.string, factory.createTypeLiteralNode([])],
                withParentheses: true,
              }) as ts.TypeNode
            }

            return this.print(m)
          })
          .filter(Boolean) as Array<ts.TypeNode>

        return factory.createUnionDeclaration({ withParentheses: true, nodes }) ?? undefined
      }

      return factory.createUnionDeclaration({ withParentheses: true, nodes: buildMemberNodes(members, this.print) }) ?? undefined
    },
    intersection(node) {
      return factory.createIntersectionDeclaration({ withParentheses: true, nodes: buildMemberNodes(node.members, this.print) }) ?? undefined
    },
    array(node) {
      const itemNodes = (node.items ?? []).map((item) => this.print(item)).filter(Boolean) as Array<ts.TypeNode>

      return factory.createArrayDeclaration({ nodes: itemNodes, arrayType: this.options.arrayType }) ?? undefined
    },
    tuple(node) {
      return buildTupleNode(node, this.print)
    },
    object(node) {
      const addsQuestionToken = ['questionToken', 'questionTokenAndUndefined'].includes(this.options.optionalType)
      const { print } = this

      const propertyNodes: Array<ts.TypeElement> = node.properties.map((prop) => {
        const baseType = (print(prop.schema) ?? factory.keywordTypeNodes.unknown) as ts.TypeNode
        const type = buildPropertyType(prop.schema, baseType, this.options.optionalType)

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
}))
