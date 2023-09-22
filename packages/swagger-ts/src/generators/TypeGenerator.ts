import { getUniqueName, SchemaGenerator } from '@kubb/core'
import { isReference } from '@kubb/swagger'
import {
  appendJSDocToNode,
  createEnumDeclaration,
  createIndexSignature,
  createIntersectionDeclaration,
  createPropertySignature,
  createTupleDeclaration,
  createTypeAliasDeclaration,
  createUnionDeclaration,
  modifiers,
} from '@kubb/ts-codegen'

import { camelCase } from 'case-anything'
import ts from 'typescript'

import { pluginName } from '../plugin.ts'
import { keywordTypeNodes } from '../utils/index.ts'

import type { PluginContext } from '@kubb/core'
import type { OpenAPIV3, Refs } from '@kubb/swagger'
import type { ArrayTwoOrMore } from '@kubb/ts-codegen'

const { factory } = ts

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

type Options = {
  withJSDocs?: boolean
  resolveName: PluginContext['resolveName']
  enumType: 'enum' | 'asConst' | 'asPascalConst'
  dateType: 'string' | 'date'
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
}
export class TypeGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, ts.Node[]> {
  // Collect the types of all referenced schemas so we can export them later
  public static usedEnumNames: Record<string, number> = {}

  refs: Refs = {}

  extraNodes: ts.Node[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  usedAliasNames: Record<string, number> = {}

  constructor(
    options: Options = { withJSDocs: true, resolveName: ({ name }) => name, enumType: 'asConst', dateType: 'string', optionalType: 'questionToken' },
  ) {
    super(options)

    return this
  }

  build({ schema, baseName, description }: { schema: OpenAPIV3.SchemaObject; baseName: string; description?: string }): ts.Node[] {
    const nodes: ts.Node[] = []
    const type = this.getTypeFromSchema(schema, baseName)

    if (!type) {
      return this.extraNodes
    }

    const node = createTypeAliasDeclaration({
      modifiers: [modifiers.export],
      name: this.options.resolveName({ name: baseName, pluginName }) || baseName,
      type,
    })

    if (description) {
      nodes.push(
        appendJSDocToNode({
          node,
          comments: [`@description ${description}`],
        }),
      )
    } else {
      nodes.push(node)
    }

    // filter out if the export name is the same as one that we already defined in extraNodes(see enum)
    const filterdNodes = nodes.filter(
      (node: ts.Node) =>
        !this.extraNodes.some(
          (extraNode: ts.Node) => (extraNode as ts.TypeAliasDeclaration)?.name?.escapedText === (node as ts.TypeAliasDeclaration)?.name?.escapedText,
        ),
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

    return createUnionDeclaration({ nodes: [type, keywordTypeNodes.null] })
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  private getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, baseName?: string) {
    const { optionalType } = this.options
    const properties = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const members: Array<ts.TypeElement | null> = Object.keys(properties).map((name) => {
      const schema = properties[name] as OpenAPIV3.SchemaObject

      const isRequired = required && required.includes(name)

      let type = this.getTypeFromSchema(schema, `${baseName || ''}${this.options.resolveName({ name, pluginName })}`)

      if (!type) {
        return null
      }

      if (!isRequired && ['undefined', 'questionTokenAndUndefined'].includes(optionalType)) {
        type = createUnionDeclaration({ nodes: [type, keywordTypeNodes.undefined] })
      }
      const propertySignature = createPropertySignature({
        questionToken: ['questionToken', 'questionTokenAndUndefined'].includes(optionalType) && !isRequired,
        name,
        type: type as ts.TypeNode,
      })
      if (this.options.withJSDocs) {
        return appendJSDocToNode({
          node: propertySignature,
          comments: [
            schema.description ? `@description ${schema.description}` : undefined,
            schema.type ? `@type ${schema.type}${isRequired ? '' : ' | undefined'} ${schema.format || ''}` : undefined,
            schema.example ? `@example ${schema.example as string}` : undefined,
            schema.deprecated ? `@deprecated` : undefined,
            schema.default !== undefined && typeof schema.default === 'string' ? `@default '${schema.default}'` : undefined,
            schema.default !== undefined && typeof schema.default !== 'string' ? `@default ${schema.default as string}` : undefined,
          ].filter(Boolean),
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
    return factory.createTypeLiteralNode(members.filter(Boolean))
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject, baseName?: string) {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (ref) {
      return factory.createTypeReferenceNode(ref.propertyName, undefined)
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.usedAliasNames)
    const propertyName = this.options.resolveName({ name: originalName, pluginName }) || originalName

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    return factory.createTypeReferenceNode(ref.propertyName, undefined)
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined, baseName?: string): ts.TypeNode | null {
    if (!schema) {
      return keywordTypeNodes.any
    }

    if (isReference(schema)) {
      return this.getRefAlias(schema, baseName)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union = createUnionDeclaration({
        withParentheses: true,
        nodes: schema.oneOf
          .map((item: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) => {
            return this.getBaseTypeFromSchema(item)
          })
          .filter((item) => {
            return item && item !== keywordTypeNodes.any
          }) as ArrayTwoOrMore<ts.TypeNode>,
      })

      if (schemaWithoutOneOf.properties) {
        return createIntersectionDeclaration({
          nodes: [this.getBaseTypeFromSchema(schemaWithoutOneOf, baseName), union].filter(Boolean) as ArrayTwoOrMore<ts.TypeNode>,
        })
      }

      return union
    }

    if (schema.anyOf) {
      const schemaWithoutAnyOf = { ...schema, anyOf: undefined }

      const union = createUnionDeclaration({
        withParentheses: true,
        nodes: schema.anyOf
          .map((item: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) => {
            return this.getBaseTypeFromSchema(item)
          })
          .filter((item) => {
            return item && item !== keywordTypeNodes.any
          }) as ArrayTwoOrMore<ts.TypeNode>,
      })

      if (schemaWithoutAnyOf.properties) {
        return createIntersectionDeclaration({
          nodes: [this.getBaseTypeFromSchema(schemaWithoutAnyOf, baseName), union].filter(Boolean) as ArrayTwoOrMore<ts.TypeNode>,
        })
      }

      return union
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      const and = createIntersectionDeclaration({
        withParentheses: true,
        nodes: schema.allOf
          .map((item: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) => {
            return this.getBaseTypeFromSchema(item)
          })
          .filter((item) => {
            return item && item !== keywordTypeNodes.any
          }) as ArrayTwoOrMore<ts.TypeNode>,
      })

      if (schemaWithoutAllOf.properties) {
        return createIntersectionDeclaration({
          nodes: [this.getBaseTypeFromSchema(schemaWithoutAllOf, baseName), and].filter(Boolean) as ArrayTwoOrMore<ts.TypeNode>,
        })
      }

      return and
    }

    /**
     * Enum will be defined outside the baseType(hints the baseName check)
     */
    if (schema.enum && baseName) {
      const enumName = getUniqueName(baseName, TypeGenerator.usedEnumNames)

      let enums: [key: string, value: string | number][] = [...new Set(schema.enum)].map((key) => [key, key])

      if ('x-enumNames' in schema) {
        enums = [...new Set(schema['x-enumNames'] as string[])].map((key: string, index) => {
          return [key, schema.enum?.[index]]
        })
      }

      this.extraNodes.push(
        ...createEnumDeclaration({
          name: camelCase(enumName),
          typeName: this.options.resolveName({ name: enumName, pluginName }),
          enums,
          type: this.options.enumType,
        }),
      )
      return factory.createTypeReferenceNode(this.options.resolveName({ name: enumName, pluginName }), undefined)
    }

    if (schema.enum) {
      return createUnionDeclaration({
        nodes: schema.enum.map((name: string) => {
          return factory.createLiteralTypeNode(typeof name === 'number' ? factory.createNumericLiteral(name) : factory.createStringLiteral(`${name}`))
        }) as unknown as ArrayTwoOrMore<ts.TypeNode>,
      })
    }

    if ('items' in schema) {
      // items -> array
      const node = this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, baseName)
      if (node) {
        return factory.createArrayTypeNode(node)
      }
    }
    /**
     * OpenAPI 3.1
     * @link https://json-schema.org/understanding-json-schema/reference/array.html#tuple-validation
     */
    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OpenAPIV3.SchemaObject[]

      return createTupleDeclaration({
        nodes: prefixItems.map((item) => {
          // no baseType so we can fall back on an union when using enum
          return this.getBaseTypeFromSchema(item, undefined)
        }) as ArrayTwoOrMore<ts.TypeNode>,
      })
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema, baseName)
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type, nullable] = schema.type as Array<OpenAPIV3.NonArraySchemaObjectType>

        return createUnionDeclaration({
          nodes: [
            this.getBaseTypeFromSchema(
              {
                ...schema,
                type,
              },
              baseName,
            ),
            nullable ? factory.createLiteralTypeNode(factory.createNull()) : undefined,
          ].filter(Boolean) as ArrayTwoOrMore<ts.TypeNode>,
        })
      }

      if (this.options.dateType === 'date' && ['date', 'date-time'].some((item) => item === schema.format)) {
        return factory.createTypeReferenceNode(factory.createIdentifier('Date'))
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
