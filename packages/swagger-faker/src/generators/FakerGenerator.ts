import { SchemaGenerator } from '@kubb/core'
import { getUniqueName, transformers } from '@kubb/core/utils'
import { isReference } from '@kubb/swagger/utils'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { fakerKeywords, fakerParser } from '../parsers/index.ts'
import { pluginKey } from '../plugin.ts'

import type { PluginContext } from '@kubb/core'
import type { ts } from '@kubb/parser'
import type { FileResolver, ImportMeta, Oas, OasTypes, OpenAPIV3, Refs } from '@kubb/swagger'
import type { FakerKeyword, FakerMeta } from '../parsers/index.ts'

type Options = {
  oas: Oas
  fileResolver?: FileResolver
  withJSDocs?: boolean
  resolveName: PluginContext['resolveName']
  dateType: 'string' | 'date'
}
export class FakerGenerator extends SchemaGenerator<Options, OasTypes.SchemaObject, string[]> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  imports: ImportMeta[] = []

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}

  constructor(options: Options) {
    super(options)

    return this
  }

  build({
    schema,
    baseName,
    description,
    operationName,
  }: {
    schema: OasTypes.SchemaObject
    baseName: string
    description?: string
    operationName?: string
  }): string[] {
    const texts: string[] = []
    const fakerInput = this.#getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(transformers.JSDoc.createJSDocBlockText({ comments: [`@description ${description}`] }))
    }

    const name = this.options.resolveName({ name: baseName, pluginKey }) || baseName
    const typeName = this.options.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey })

    const fakerOutput = fakerParser(fakerInput, {
      name,
      typeName,
    })
    // hack to create import with recreating the ImportGenerator
    if (typeName) {
      const ref = {
        propertyName: typeName,
        originalName: baseName,
        pluginKey: swaggerTypeScriptPluginKey,
      }
      this.imports.push({
        ref,
        path: this.options.fileResolver?.(operationName || typeName, ref) || '',
      })
    }

    texts.push(fakerOutput)

    return [...this.extraTexts, ...texts]
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  #getTypeFromSchema(schema: OasTypes.SchemaObject, baseName?: string): FakerMeta[] {
    const validationFunctions = this.#getBaseTypeFromSchema(schema, baseName)
    if (validationFunctions) {
      return validationFunctions
    }

    return []
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #getTypeFromProperties(baseSchema?: OasTypes.SchemaObject, _baseName?: string): FakerMeta[] {
    const properties = baseSchema?.properties || {}
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(properties)
      .map((name) => {
        const validationFunctions: FakerMeta[] = []

        const schema = properties[name] as OasTypes.SchemaObject

        validationFunctions.push(...this.#getTypeFromSchema(schema, name))

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: FakerMeta[] = []

    if (additionalProperties) {
      const addionalValidationFunctions: FakerMeta[] = additionalProperties === true
        ? [{ keyword: fakerKeywords.any }]
        : this.#getTypeFromSchema(additionalProperties as OasTypes.SchemaObject)

      members.push({ keyword: fakerKeywords.catchall, args: addionalValidationFunctions })
    }

    return [{ keyword: fakerKeywords.object, args: objectMembers }]
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(obj: OpenAPIV3.ReferenceObject, _baseName?: string): FakerMeta[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (ref) {
      return [{ keyword: fakerKeywords.ref, args: ref.propertyName }]
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.options.resolveName({ name: originalName, pluginKey }) || originalName

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    return [{ keyword: fakerKeywords.ref, args: ref.propertyName }]
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #getBaseTypeFromSchema(schema: OasTypes.SchemaObject | OpenAPIV3.ReferenceObject | undefined, baseName?: string): FakerMeta[] {
    if (!schema) {
      return [{ keyword: fakerKeywords.any }]
    }

    if (isReference(schema)) {
      return this.#getRefAlias(schema, baseName)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: FakerMeta = {
        keyword: fakerKeywords.union,
        args: schema.oneOf
          .map((item) => {
            return item && this.#getBaseTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== fakerKeywords.any
          }),
      }
      if (schemaWithoutOneOf.properties && union.args) {
        return [{ ...union, args: [...this.#getBaseTypeFromSchema(schemaWithoutOneOf, baseName), ...union.args] }]
      }

      return [union]
    }

    if (schema.anyOf) {
      // union
      const schemaWithouAnyOf = { ...schema, anyOf: undefined }

      const union: FakerMeta = {
        keyword: fakerKeywords.union,
        args: schema.anyOf
          .map((item) => {
            return item && this.#getBaseTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== fakerKeywords.any
          }),
      }
      if (schemaWithouAnyOf.properties && union.args) {
        return [{ ...union, args: [...this.#getBaseTypeFromSchema(schemaWithouAnyOf, baseName), ...union.args] }]
      }

      return [union]
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      const and: FakerMeta = {
        keyword: fakerKeywords.and,
        args: schema.allOf
          .map((item) => {
            return item && this.#getBaseTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== fakerKeywords.any
          }),
      }

      if (schemaWithoutAllOf.properties && and.args) {
        return [{ ...and, args: [...this.#getBaseTypeFromSchema(schemaWithoutAllOf, baseName), ...and.args] }]
      }

      return [and]
    }

    if (schema.enum) {
      if ('x-enumNames' in schema) {
        return [
          {
            keyword: fakerKeywords.enum,
            args: [`[${[...new Set(schema['x-enumNames'] as string[])].map((value) => `\`${value}\``).join(', ')}]`],
          },
        ]
      }

      if (schema.type === 'number' || schema.type === 'integer') {
        return [
          {
            keyword: fakerKeywords.enum,
            args: [`[${[...new Set(schema.enum)].join(', ')}]`],
          },
        ]
      }

      return [
        {
          keyword: fakerKeywords.enum,
          args: [`[${[...new Set(schema.enum)].map((value: string) => `\`${value}\``).join(', ')}]`],
        },
      ]
    }

    if ('items' in schema) {
      // items -> array
      return [{ keyword: fakerKeywords.array, args: this.#getTypeFromSchema(schema.items as OasTypes.SchemaObject, baseName) }]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OasTypes.SchemaObject[]

      return [
        {
          keyword: fakerKeywords.tuple,
          args: prefixItems
            .map((item) => {
              // no baseType so we can fall back on an union when using enum
              return this.#getBaseTypeFromSchema(item, undefined)?.[0]
            })
            .filter(Boolean),
        },
      ]
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.#getTypeFromProperties(schema, baseName)
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type] = schema.type as Array<OpenAPIV3.NonArraySchemaObjectType>

        return [
          ...this.#getBaseTypeFromSchema(
            {
              ...schema,
              type,
            },
            baseName,
          ),
          { keyword: fakerKeywords.null },
        ]
      }

      if (schema.type === fakerKeywords.number || schema.type === fakerKeywords.integer) {
        const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
        const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined

        return [{ keyword: fakerKeywords.number, args: { min, max } }]
      }

      if (schema.pattern) {
        return [{ keyword: fakerKeywords.matches, args: `/${schema.pattern}/` }]
      }

      if (this.options.dateType === 'date' && ['date', 'date-time'].some((item) => item === schema.format)) {
        return [{ keyword: fakerKeywords.datetime }]
      }

      if (schema.format === 'email' || baseName === 'email') {
        return [{ keyword: fakerKeywords.email }]
      }

      if (schema.format === 'uri' || schema.format === 'hostname') {
        return [{ keyword: fakerKeywords.url }]
      }
      if (schema.format === 'uuid') {
        return [{ keyword: fakerKeywords.uuid }]
      }

      // based on baseName
      if (baseName === 'firstName') {
        return [{ keyword: fakerKeywords.firstName }]
      }

      if (baseName === 'lastName') {
        return [{ keyword: fakerKeywords.lastName }]
      }

      if (baseName === 'password') {
        return [{ keyword: fakerKeywords.password }]
      }

      if (baseName === 'phone') {
        return [{ keyword: fakerKeywords.phone }]
      }

      // string, boolean, null, number
      if (schema.type in fakerKeywords) {
        return [{ keyword: schema.type as FakerKeyword }]
      }
    }

    if (schema.format === 'binary') {
      // TODO binary
    }

    return [{ keyword: fakerKeywords.any }]
  }
}
