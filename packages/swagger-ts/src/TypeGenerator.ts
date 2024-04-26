import {Generator} from '@kubb/core'
import transformers from '@kubb/core/transformers'
import {getUniqueName} from '@kubb/core/utils'
import * as factory from '@kubb/parser/factory'
import {keywordTypeNodes} from '@kubb/parser/factory'
import {getSchemaFactory, isReference} from '@kubb/swagger/utils'

import {pluginKey} from './plugin.ts'

import type {PluginManager} from '@kubb/core'
import type {ts} from '@kubb/parser'
import type {ImportMeta, Refs} from '@kubb/swagger'
import type {Oas, OasTypes, OpenAPIV3, OpenAPIV3_1} from '@kubb/swagger/oas'
import type {PluginOptions} from './types.ts'

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

type Context = {
  oas: Oas
  pluginManager: PluginManager
}


export class TypeGenerator extends Generator<PluginOptions['resolvedOptions'], Context> {
  refs: Refs = {}
  imports: ImportMeta[] = []

  extraNodes: ts.Node[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}

  build({
          schema,
          optional,
          baseName,
          description,
          keysToOmit,
        }: {
    schema: OasTypes.SchemaObject
    baseName: string
    description?: string
    optional?: boolean
    keysToOmit?: string[]
  }): ts.Node[] {
    const nodes: ts.Node[] = []
    let type = this.getTypeFromSchema(schema, baseName)

    if (!type) {
      return this.extraNodes
    }

    if (optional) {
      type = factory.createUnionDeclaration({nodes: [type, factory.keywordTypeNodes.undefined]}) as ts.TypeNode
    }

    const node = factory.createTypeAliasDeclaration({
      modifiers: [factory.modifiers.export],
      name: this.context.pluginManager.resolveName({name: baseName, pluginKey, type: 'type'}),
      type: keysToOmit?.length ? factory.createOmitDeclaration({keys: keysToOmit, type, nonNullable: true}) : type,
    })

    if (description) {
      nodes.push(
        factory.appendJSDocToNode({
          node,
          comments: [`@description ${transformers.trim(description)}`],
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
  getTypeFromSchema(schema?: OasTypes.SchemaObject, name?: string): ts.TypeNode | null {
    const type = this.#getBaseTypeFromSchema(schema, name)

    if (!type) {
      return null
    }

    if (schema && !schema.nullable) {
      return type
    }

    return factory.createUnionDeclaration({nodes: [type, factory.keywordTypeNodes.null]})
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #getTypeFromProperties(baseSchema?: OasTypes.SchemaObject, baseName?: string): ts.TypeNode | null {
    const {optionalType} = this.options
    const properties = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const members: Array<ts.TypeElement | null> = Object.keys(properties).map((name) => {
      const schema = properties[name] as OasTypes.SchemaObject

      const isRequired = Array.isArray(required) ? required.includes(name) : !!required
      let type = this.getTypeFromSchema(schema, this.context.pluginManager.resolveName({
        name: `${baseName || ''} ${name}`,
        pluginKey,
        type: 'type'
      }))

      if (!type) {
        return null
      }

      if (!isRequired && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
        type = factory.createUnionDeclaration({nodes: [type, factory.keywordTypeNodes.undefined]})
      }
      const propertySignature = factory.createPropertySignature({
        questionToken: ['questionToken', 'questionTokenAndUndefined'].includes(optionalType as string) && !isRequired,
        name,
        type: type as ts.TypeNode,
        readOnly: schema.readOnly,
      })

      return factory.appendJSDocToNode({
        node: propertySignature,
        comments: [
          schema.description ? `@description ${schema.description}` : undefined,
          schema.type ? `@type ${schema.type?.toString()}${isRequired ? '' : ' | undefined'} ${schema.format || ''}` : undefined,
          schema.example ? `@example ${schema.example as string}` : undefined,
          schema.deprecated ? `@deprecated` : undefined,
          schema.default !== undefined && typeof schema.default === 'string' ? `@default '${schema.default}'` : undefined,
          schema.default !== undefined && typeof schema.default !== 'string' ? `@default ${schema.default as string}` : undefined,
        ].filter(Boolean),
      })
    })
    if (additionalProperties) {
      const type = additionalProperties === true ? this.#unknownReturn : this.getTypeFromSchema(additionalProperties as OasTypes.SchemaObject)

      if (type) {
        members.push(factory.createIndexSignature(type))
      }
    }
    return factory.createTypeLiteralNode(members.filter(Boolean))
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(obj: OpenAPIV3.ReferenceObject, _baseName?: string) {
    const {$ref} = obj
    let ref = this.refs[$ref]

    if (ref) {
      return factory.createTypeReferenceNode(ref.propertyName, undefined)
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.context.pluginManager.resolveName({name: originalName, pluginKey, type: 'type'})

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    const fileName = this.context.pluginManager.resolveName({name: originalName, pluginKey, type: 'file'})
    const path = this.context.pluginManager.resolvePath({baseName: fileName, pluginKey})

    this.imports.push({
      ref,
      path: path || '',
      isTypeOnly: true,
    })

    return factory.createTypeReferenceNode(ref.propertyName, undefined)
  }

  #getParsedSchema(schema?: OasTypes.SchemaObject) {
    const parsedSchema = getSchemaFactory(this.context.oas)(schema)
    return parsedSchema
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #getBaseTypeFromSchema(
    _schema: OasTypes.SchemaObject | undefined,
    baseName?: string,
  ): ts.TypeNode | null {
    const {schema, version} = this.#getParsedSchema(_schema)

    if (!schema) {
      return this.#unknownReturn
    }

    if (isReference(schema)) {
      return this.#getRefAlias(schema, baseName)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = {...schema, oneOf: undefined} as OasTypes.SchemaObject

      const union = factory.createUnionDeclaration({
        withParentheses: true,
        nodes: schema.oneOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)
          })
          .filter((item) => {
            return item && item !== this.#unknownReturn
          }) as Array<ts.TypeNode>,
      })

      if (schemaWithoutOneOf.properties) {
        return factory.createIntersectionDeclaration({
          nodes: [this.getTypeFromSchema(schemaWithoutOneOf, baseName), union].filter(Boolean),
        })
      }

      return union
    }

    if (schema.anyOf) {
      const schemaWithoutAnyOf = {...schema, anyOf: undefined} as OasTypes.SchemaObject

      const union = factory.createUnionDeclaration({
        withParentheses: true,
        nodes: schema.anyOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)
          })
          .filter((item) => {
            return item && item !== this.#unknownReturn
          }) as Array<ts.TypeNode>,
      })

      if (schemaWithoutAnyOf.properties) {
        return factory.createIntersectionDeclaration({
          nodes: [this.getTypeFromSchema(schemaWithoutAnyOf, baseName), union].filter(Boolean),
        })
      }

      return union
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = {...schema, allOf: undefined} as OasTypes.SchemaObject

      const and = factory.createIntersectionDeclaration({
        withParentheses: true,
        nodes: schema.allOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)
          })
          .filter((item) => {
            return item && item !== this.#unknownReturn
          }) as Array<ts.TypeNode>,
      })

      if (schemaWithoutAllOf.properties) {
        return factory.createIntersectionDeclaration({
          nodes: [this.getTypeFromSchema(schemaWithoutAllOf, baseName), and].filter(Boolean),
        })
      }

      return and
    }

    /**
     * Enum will be defined outside the baseType(hints the baseName check)
     */
    if (schema.enum && baseName) {
      const enumName = getUniqueName(baseName, this.options.usedEnumNames)

      let enums: [key: string, value: string | number][] = [...new Set(schema.enum)].map((key) => [key, key])

      const extensionEnums: Array<typeof enums> = ['x-enumNames', 'x-enum-varnames']
        .filter(extensionKey => extensionKey in schema)
        .map((extensionKey) =>
          [...new Set(schema[extensionKey as keyof typeof schema] as string[])].map((key, index) => [key, schema.enum?.[index] as string] as const)
        )

      if (extensionEnums.length > 0 && extensionEnums[0]) {
        enums = extensionEnums[0]
      }

      this.extraNodes.push(
        ...factory.createEnumDeclaration({
          name: transformers.camelCase(enumName),
          typeName: this.context.pluginManager.resolveName({name: enumName, pluginKey, type: 'type'}),
          enums,
          type: this.options.enumType,
        }),
      )
      return factory.createTypeReferenceNode(this.context.pluginManager.resolveName({
        name: enumName,
        pluginKey,
        type: 'type'
      }), undefined)
    }

    if (schema.enum) {
      return factory.createUnionDeclaration({
        nodes: schema.enum.map((name) => {
          return factory.createLiteralTypeNode(typeof name === 'number' ? factory.createNumericLiteral(name) : factory.createStringLiteral(`${name}`))
        }) as unknown as Array<ts.TypeNode>,
      })
    }

    if ('items' in schema) {
      // items -> array
      const node = this.getTypeFromSchema(schema.items as OasTypes.SchemaObject, baseName)
      if (node) {
        return factory.createArrayTypeNode(node)
      }
    }

    /**
     * OpenAPI 3.1
     * @link https://json-schema.org/understanding-json-schema/reference/array.html#tuple-validation
     */

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OasTypes.SchemaObject[]

      return factory.createTupleDeclaration({
        nodes: prefixItems.map((item) => {
          // no baseType so we can fall back on an union when using enum
          return this.getTypeFromSchema(item, undefined)
        }) as Array<ts.TypeNode>,
      })
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.#getTypeFromProperties(schema, baseName)
    }

    /**
     * validate "const" property as defined in JSON-Schema-Validation
     *
     * https://json-schema.org/draft/2020-12/json-schema-validation#name-const
     *
     * > 6.1.3. const
     * > The value of this keyword MAY be of any type, including null.
     * > Use of this keyword is functionally equivalent to an "enum" (Section 6.1.2) with a single value.
     * > An instance validates successfully against this keyword if its value is equal to the value of the keyword.
     */
    if (version === '3.1' && 'const' in schema) {
      // const keyword takes precendence over the actual type.
      if (schema['const']) {
        if (typeof schema['const'] === 'string') {
          return factory.createLiteralTypeNode(factory.createStringLiteral(schema['const']))
        } else if (typeof schema['const'] === 'number') {
          return factory.createLiteralTypeNode(factory.createNumericLiteral(schema['const']))
        }
      } else {
        return keywordTypeNodes.null
      }
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        // TODO  remove hardcoded first type, second nullable
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type, nullable] = schema.type as Array<OpenAPIV3_1.NonArraySchemaObjectType>

        return factory.createUnionDeclaration({
          nodes: [
            this.getTypeFromSchema(
              {
                ...schema,
                type,
              },
              baseName,
            ),
            nullable ? factory.createLiteralTypeNode(factory.createNull()) : undefined,
          ].filter(Boolean),
        })
      }

      /**
       * > Structural validation alone may be insufficient to allow an application to correctly utilize certain values. The "format"
       * > annotation keyword is defined to allow schema authors to convey semantic information for a fixed subset of values which are
       * > accurately described by authoritative resources, be they RFCs or other external specifications.
       *
       * In other words: format is more specific than type alone, hence it should override the type value, if possible.
       *
       * see also https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7
       */
      if (schema.format) {
        switch (schema.format) {
          case "binary":
            if (schema.type === "string") {
              return factory.createTypeReferenceNode('Blob', []);
            }
            break;
          // 7.3.1. Dates, Times, and Duration
          case "date-time":
          case "date":
          case "time":
            if (this.options.dateType === 'date') {
              return factory.createTypeReferenceNode(factory.createIdentifier('Date'))
            }
          case "uuid":
            // TODO how to work with this? use https://www.npmjs.com/package/uuid for it?
            break;
          case "duration":
          case "email":
          case "idn-email":
          case "hostname":
          case "idn-hostname":
          case "ipv4":
          case "ipv6":
          case "uri":
          case "uri-reference":
          case "json-pointer":
          case "relative-json-pointer":
          default:
            // formats not yet implemented: ignore.
            break;
        }
      }

      // string, boolean, null, number
      if (schema.type in factory.keywordTypeNodes) {
        return factory.keywordTypeNodes[schema.type as keyof typeof factory.keywordTypeNodes]
      }
    }

    return this.#unknownReturn
  }

  get #unknownReturn() {
    if (this.options.unknownType === 'any') {
      return factory.keywordTypeNodes.any
    }

    return factory.keywordTypeNodes.unknown
  }
}
