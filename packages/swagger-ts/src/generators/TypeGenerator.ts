/* eslint-disable no-param-reassign */
import { factory } from 'typescript'
import { pascalCase, camelCase } from 'change-case'
import uniq from 'lodash.uniq'

import { getUniqueName, SchemaGenerator } from '@kubb/core'
import type { Oas, OpenAPIV3 } from '@kubb/swagger'
import { isReference } from '@kubb/swagger'
import {
  appendJSDocToNode,
  createEnumDeclaration,
  createIndexSignature,
  createIntersectionDeclaration,
  createPropertySignature,
  createTypeAliasDeclaration,
  modifier,
} from '@kubb/ts-codegen'

import { keywordTypeNodes } from '../utils'

import type ts from 'typescript'

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

/**
 * Name is the ref name + resolved with the nameResolver
 * Key is the original name used
 */
export type Refs = Record<string, { name: string; key: string }>

type Options = {
  withJSDocs?: boolean
  nameResolver?: (name: string) => string
}
export class TypeGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, ts.Node[]> {
  // Collect the types of all referenced schemas so we can export them later
  public static usedEnumNames: Record<string, number> = {}

  refs: Refs = {}

  extraNodes: ts.Node[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  usedAliasNames: Record<string, number> = {}

  constructor(public readonly oas: Oas, options: Options = { withJSDocs: true, nameResolver: (name) => name }) {
    super(options)

    return this
  }

  build(schema: OpenAPIV3.SchemaObject, name: string, description?: string) {
    const nodes: ts.Node[] = []
    const type = this.getTypeFromSchema(schema, name)

    if (!type) {
      return this.extraNodes
    }

    const node = createTypeAliasDeclaration({
      modifiers: [modifier.export],
      name,
      type,
    })

    if (description) {
      nodes.push(
        appendJSDocToNode({
          node,
          comments: [`@description ${description}`],
        })
      )
    } else {
      nodes.push(node)
    }

    // filter out if the export name is the same as one that we already defined in extraNodes(see enum)
    const filterdNodes = nodes.filter(
      (node: ts.Node) =>
        !this.extraNodes.some(
          (extraNode: ts.Node) => (extraNode as ts.TypeAliasDeclaration)?.name?.escapedText === (node as ts.TypeAliasDeclaration)?.name?.escapedText
        )
    )

    return [...this.extraNodes, ...filterdNodes]
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  private getTypeFromSchema(schema: OpenAPIV3.SchemaObject, name?: string): ts.TypeNode | null {
    const type = this.getBaseTypeFromSchema(schema, name)

    if (!type) {
      return null
    }

    if (schema) {
      return type
    }

    return factory.createUnionTypeNode([type, keywordTypeNodes.null])
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  private getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, baseName?: string) {
    const props = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const members: Array<ts.TypeElement | null> = Object.keys(props).map((name) => {
      const schema = props[name] as OpenAPIV3.SchemaObject

      const isRequired = required && required.includes(name)
      let type: ts.TypeNode | null
      if (schema.enum) {
        type = this.getTypeFromSchema(schema, pascalCase(`${baseName} ${name}`, { delimiter: '' }))
      } else {
        type = this.getTypeFromSchema(schema, pascalCase(`${baseName} ${name}`, { delimiter: '' }))
      }

      if (!type) {
        return null
      }

      if (!isRequired) {
        type = factory.createUnionTypeNode([type, keywordTypeNodes.undefined])
      }
      const propertySignature = createPropertySignature({
        questionToken: !isRequired,
        name,
        type,
      })
      if (this.options.withJSDocs) {
        return appendJSDocToNode({
          node: propertySignature,
          comments: [
            schema.description && `@description ${schema.description}`,
            schema.type && `@type ${schema.type}${isRequired ? '' : ' | undefined'} ${schema.format || ''}`,
            schema.example && `@example ${schema.example}`,
          ],
        })
      }

      return propertySignature
    })
    if (additionalProperties) {
      const type = additionalProperties === true ? keywordTypeNodes.any : this.getTypeFromSchema(additionalProperties as OpenAPIV3.SchemaObject)

      if (type) {
        members.push(createIndexSignature(type))
      }
    }
    return factory.createTypeLiteralNode(members.filter(Boolean) as ts.TypeElement[])
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject) {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (!ref) {
      const name = pascalCase(getUniqueName($ref.replace(/.+\//, ''), this.usedAliasNames), { delimiter: '' })

      // eslint-disable-next-line no-multi-assign
      ref = this.refs[$ref] = {
        name: this.options.nameResolver?.(name) || name,
        key: name,
      }
    }

    return factory.createTypeReferenceNode(ref.name, undefined)
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined, name?: string): ts.TypeNode | null {
    if (!schema) {
      return keywordTypeNodes.any
    }

    if (isReference(schema)) {
      return this.getRefAlias(schema)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      return createIntersectionDeclaration({
        nodes: [
          this.getBaseTypeFromSchema(schemaWithoutOneOf, name),
          factory.createParenthesizedType(
            factory.createUnionTypeNode(
              schema.oneOf
                .map((item) => {
                  return this.getBaseTypeFromSchema(item)
                })
                .filter(Boolean) as ts.TypeNode[]
            )
          ),
        ].filter(Boolean) as ts.TypeNode[],
      })
    }

    if (schema.anyOf) {
      // TODO anyOf -> union
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      return createIntersectionDeclaration({
        nodes: [
          this.getBaseTypeFromSchema(schemaWithoutAllOf, name),
          factory.createParenthesizedType(
            factory.createIntersectionTypeNode(
              schema.allOf
                .map((item) => {
                  return this.getBaseTypeFromSchema(item)
                })
                .filter(Boolean) as ts.TypeNode[]
            )
          ),
        ].filter(Boolean) as ts.TypeNode[],
      })
    }

    if (schema.enum && name) {
      const enumName = getUniqueName(name, TypeGenerator.usedEnumNames)
      this.extraNodes.push(
        ...createEnumDeclaration({
          name: camelCase(enumName, { delimiter: '' }),
          typeName: pascalCase(enumName, { delimiter: '' }),
          enums: uniq(schema.enum),
        })
      )
      return factory.createTypeReferenceNode(pascalCase(enumName, { delimiter: '' }), undefined)
    }

    if ('items' in schema) {
      // items -> array
      const node = this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, name)
      if (node) {
        return factory.createArrayTypeNode(node)
      }
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema, name)
    }

    if (schema.type) {
      if (schema.type === 'object') {
        if (!schema.additionalProperties && !schema.properties && schema.type === 'object') {
          return null
        }
      }
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type, nullable] = schema.type

        return factory.createUnionTypeNode(
          [
            this.getBaseTypeFromSchema(
              {
                ...schema,
                type,
              },
              name
            )!,
            nullable ? factory.createLiteralTypeNode(factory.createNull()) : undefined,
          ].filter(Boolean) as ts.TypeNode[]
        )
      }
      // string, boolean, null, number
      if (schema.type in keywordTypeNodes) {
        return keywordTypeNodes[schema.type as keyof typeof keywordTypeNodes]
      }
    }

    if (schema.format === 'binary') {
      return factory.createTypeReferenceNode('Blob', [])
    }

    return keywordTypeNodes.any
  }
}
