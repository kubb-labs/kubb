/* eslint-disable no-param-reassign */
import { factory } from 'typescript'
import { pascalCase } from 'change-case'

import { SchemaGenerator } from '@kubb/core'

import { appendJSDocToNode, createIndexSignature, createPropertySignature, createTypeAliasDeclaration, keywordTypeNodes, modifier } from '../utils/codegen'
import { isReference } from '../utils/isReference'
import { getReference } from '../utils/getReference'

import type ts from 'typescript'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

export type FileResolver = (name: string) => Promise<string | null | undefined>
type Name = string
export type Refs = Record<string, Name>

type Options = {
  withJSDocs?: boolean
  nameResolver?: (name: string) => string
}
export class TypeGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, ts.TypeAliasDeclaration> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  typeAliases: Record<string, number> = {}

  constructor(public readonly oas: Oas, options: Options = { withJSDocs: true, nameResolver: (name) => name }) {
    super(options)

    return this
  }

  build(schema: OpenAPIV3.SchemaObject, name: string, description?: string) {
    const type = this.getTypeFromSchema(schema, name)

    const node = createTypeAliasDeclaration({
      modifiers: [modifier.export],
      name,
      type,
    })

    if (description) {
      return appendJSDocToNode({
        node,
        comments: [`@description ${description}`],
      })
    }

    return node
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  private getTypeFromSchema(schema: OpenAPIV3.SchemaObject, name?: string): ts.TypeNode {
    const type = this.getBaseTypeFromSchema(schema, name)
    if (schema) {
      return type
    }

    return factory.createUnionTypeNode([type, keywordTypeNodes.null])
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  private getTypeFromProperties(
    props: {
      [prop: string]: OpenAPIV3.SchemaObject
    },
    required?: string[],
    additionalProperties?: boolean | OpenAPIV3.SchemaObject
  ) {
    const members: ts.TypeElement[] = Object.keys(props).map((name) => {
      const schema = props[name]

      const isRequired = required && required.includes(name)
      let type = this.getTypeFromSchema(schema, name)
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
      const type = additionalProperties === true ? keywordTypeNodes.any : this.getTypeFromSchema(additionalProperties)

      members.push(createIndexSignature(type))
    }
    return factory.createTypeLiteralNode(members)
  }

  private resolve<T>(obj: T | OpenAPIV3.ReferenceObject) {
    if (!isReference(obj)) return obj
    const ref = obj.$ref
    if (!ref.startsWith('#/')) {
      throw new Error(`External refs are not supported (${ref}). Make sure to call SwaggerParser.bundle() first.`)
    }
    return getReference(this.oas.api, ref) as T
  }

  private getUniqueAlias(name: string) {
    let used = this.typeAliases[name] || 0
    if (used) {
      this.typeAliases[name] = ++used
      name += used
    }
    this.typeAliases[name] = 1
    return name
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject) {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (!ref) {
      const schema = this.resolve<OpenAPIV3.SchemaObject>(obj)
      const name = this.getUniqueAlias(pascalCase(schema.title || $ref.replace(/.+\//, '')))

      // eslint-disable-next-line no-multi-assign
      ref = this.refs[$ref] = this.options.nameResolver?.(name) || name
    }

    return factory.createTypeReferenceNode(ref, undefined)
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | undefined, name?: string): ts.TypeNode {
    if (!schema) {
      return keywordTypeNodes.any
    }

    if (isReference(schema)) {
      return this.getRefAlias(schema)
    }

    if (schema.oneOf) {
      // TODO oneOf -> union
    }

    if (schema.anyOf) {
      // TODO anyOf -> union
    }
    if (schema.allOf) {
      // TODO allOf -> intersection
    }

    if (schema.enum) {
      // TODO enum
    }

    if ('items' in schema) {
      // items -> array
      return factory.createArrayTypeNode(this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, name))
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema.properties || ({} as any), schema.required, schema.additionalProperties as any)
    }

    if (schema.type) {
      // string, boolean, null, number
      if (schema.type in keywordTypeNodes) {
        return keywordTypeNodes[schema.type]
      }
    }

    if (schema.format === 'binary') {
      return factory.createTypeReferenceNode('Blob', [])
    }

    return keywordTypeNodes.any
  }
}
