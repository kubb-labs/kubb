import type { SchemaNode } from '@internals/ast'
import { jsStringEscape } from '@internals/utils'
import { createParserSchemaNode } from '@kubb/plugin-oas'
import type ts from 'typescript'
import * as factory from './factory.ts'

type ParserSchemaNodeOptions = {
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

/**
 * Converts a `SchemaNode` AST node into a TypeScript `ts.TypeNode`.
 *
 * Built on `createParserSchemaNode` — dispatches on `node.type` instead of the
 * legacy `Schema[]` keyword tree. Produces the same `ts.TypeNode` output as the
 * keyword-based `parse` in `parser.ts`.
 */
export const parseSchemaNode = createParserSchemaNode<ts.TypeNode, ParserSchemaNodeOptions>({
  handlers: {
    any: () => factory.keywordTypeNodes.any,
    unknown: () => factory.keywordTypeNodes.unknown,
    void: () => factory.keywordTypeNodes.void,
    boolean: () => factory.keywordTypeNodes.boolean,
    null: () => factory.keywordTypeNodes.null,
    blob: () => factory.createTypeReferenceNode('Blob', []),
    uuid: () => factory.keywordTypeNodes.string,
    email: () => factory.keywordTypeNodes.string,
    url: () => factory.keywordTypeNodes.string,
    string() {
      return factory.keywordTypeNodes.string
    },
    number() {
      return factory.keywordTypeNodes.number
    },
    integer() {
      return factory.keywordTypeNodes.number
    },
    bigint() {
      return factory.keywordTypeNodes.bigint
    },
    date(node) {
      return node.representation === 'date' ? factory.createTypeReferenceNode(factory.createIdentifier('Date')) : factory.keywordTypeNodes.string
    },
    time(node) {
      return node.representation === 'date' ? factory.createTypeReferenceNode(factory.createIdentifier('Date')) : factory.keywordTypeNodes.string
    },
    datetime() {
      return factory.keywordTypeNodes.string
    },
    ref(node) {
      if (!node.ref) {
        return undefined
      }
      return factory.createTypeReferenceNode(node.ref, undefined)
    },
    enum(node, options) {
      // Inline literal union: `'a' | 'b' | 42`
      const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []

      if (options.enumType === 'inlineLiteral' || !node.name) {
        const literalNodes = values
          .filter((v): v is string | number | boolean => v !== null)
          .map((value) => {
            const format = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string'
            const constNode = constToTypeNode(value, format)
            return constNode
          })
          .filter(Boolean) as ts.TypeNode[]

        return factory.createUnionDeclaration({ withParentheses: true, nodes: literalNodes }) ?? undefined
      }

      // Reference to a named enum/const declaration
      const typeName = ['asConst', 'asPascalConst'].includes(options.enumType) ? `${node.name}Key` : node.name
      return factory.createTypeReferenceNode(typeName, undefined)
    },
    union(node, options) {
      const memberNodes = (node.members ?? []).map((m) => this.parse(m, options)).filter(Boolean) as ts.TypeNode[]

      return factory.createUnionDeclaration({ withParentheses: true, nodes: memberNodes }) ?? undefined
    },
    intersection(node, options) {
      const memberNodes = (node.members ?? []).map((m) => this.parse(m, options)).filter(Boolean) as ts.TypeNode[]

      return factory.createIntersectionDeclaration({ withParentheses: true, nodes: memberNodes }) ?? undefined
    },
    array(node, options) {
      if (node.type === 'tuple') {
        return buildTupleNode(node, options, this.parse.bind(this))
      }

      const itemNodes = (node.items ?? []).map((item) => this.parse(item, options)).filter(Boolean) as ts.TypeNode[]

      return factory.createArrayDeclaration({ nodes: itemNodes, arrayType: options.arrayType }) ?? undefined
    },
    tuple(node, options) {
      return buildTupleNode(node, options, this.parse.bind(this))
    },
    object(node, options) {
      const propertyNodes: ts.TypeElement[] = (node.properties ?? []).map((prop) => {
        const propTypeNode = this.parse(prop.schema, options)

        let type = (propTypeNode ?? factory.keywordTypeNodes.unknown) as ts.TypeNode

        if (prop.schema.nullable) {
          type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.null] }) as ts.TypeNode
        }

        if (prop.schema.nullish && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType)) {
          type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
        }

        if (prop.schema.optional && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType)) {
          type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
        }

        const propertyNode = factory.createPropertySignature({
          questionToken: prop.schema.optional || prop.schema.nullish ? ['questionToken', 'questionTokenAndUndefined'].includes(options.optionalType) : false,
          name: prop.name,
          type,
          readOnly: prop.schema.readOnly,
        })

        return factory.appendJSDocToNode({
          node: propertyNode,
          comments: [
            prop.schema.description ? `@description ${jsStringEscape(prop.schema.description)}` : undefined,
            prop.schema.deprecated ? '@deprecated' : undefined,
            'min' in prop.schema && prop.schema.min !== undefined ? `@minLength ${prop.schema.min}` : undefined,
            'max' in prop.schema && prop.schema.max !== undefined ? `@maxLength ${prop.schema.max}` : undefined,
            'pattern' in prop.schema && prop.schema.pattern ? `@pattern ${prop.schema.pattern}` : undefined,
            prop.schema.default !== undefined ? `@default ${prop.schema.default}` : undefined,
            prop.schema.example !== undefined ? `@example ${prop.schema.example}` : undefined,
            prop.schema.primitive ? `@type ${prop.schema.primitive || 'unknown'}${prop.schema.optional ? ' | undefined' : ''}` : undefined,
          ],
        })
      })

      const allElements: ts.TypeElement[] = [...propertyNodes]

      if (node.additionalProperties && node.additionalProperties !== true) {
        const additionalType = this.parse(node.additionalProperties as SchemaNode, options) ?? factory.keywordTypeNodes.unknown
        const indexType = propertyNodes.length > 0 ? factory.keywordTypeNodes.unknown : (additionalType as ts.TypeNode)
        allElements.push(factory.createIndexSignature(indexType))
      } else if (node.additionalProperties === true) {
        allElements.push(factory.createIndexSignature(factory.keywordTypeNodes.unknown))
      }

      if (node.patternProperties) {
        const patternSchemas = Object.values(node.patternProperties)
        if (patternSchemas.length > 0) {
          const first = patternSchemas[0]!
          let patternType = (this.parse(first, options) ?? factory.keywordTypeNodes.unknown) as ts.TypeNode
          if (first.nullable) {
            patternType = factory.createUnionDeclaration({ nodes: [patternType, factory.keywordTypeNodes.null] }) as ts.TypeNode
          }
          allElements.push(factory.createIndexSignature(patternType))
        }
      }

      if (!allElements.length) {
        return factory.keywordTypeNodes.object
      }

      return factory.createTypeLiteralNode(allElements)
    },
  },
})

function constToTypeNode(value: string | number | boolean, format: 'string' | 'number' | 'boolean'): ts.TypeNode | undefined {
  if (format === 'boolean') {
    return factory.createLiteralTypeNode(value === true ? factory.createTrue() : factory.createFalse())
  }
  if (format === 'number' && typeof value === 'number') {
    return factory.createLiteralTypeNode(factory.createNumericLiteral(value))
  }
  return factory.createLiteralTypeNode(factory.createStringLiteral(String(value)))
}

import type { ArraySchemaNode } from '@internals/ast'

function buildTupleNode(
  node: ArraySchemaNode,
  options: ParserSchemaNodeOptions,
  parse: (node: SchemaNode, options: ParserSchemaNodeOptions) => ts.TypeNode | null | undefined,
): ts.TypeNode | undefined {
  let items = (node.items ?? []).map((item) => parse(item, options)).filter(Boolean) as ts.TypeNode[]

  const restNode = node.rest ? (parse(node.rest, options) ?? undefined) : undefined

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
