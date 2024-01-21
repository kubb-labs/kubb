import { Generator } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'
import { getSchemaFactory, isReference } from '@kubb/swagger/utils'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { fakerKeywords, fakerParser } from './fakerParser.ts'
import { pluginKey } from './plugin.ts'

import type { PluginManager } from '@kubb/core'
import type { ts } from '@kubb/parser'
import type { ImportMeta, Refs } from '@kubb/swagger'
import type { Oas, OasTypes, OpenAPIV3, Operation } from '@kubb/swagger/oas'
import type { FakerKeyword, FakerMeta } from './fakerParser.ts'
import type { PluginOptions } from './types.ts'

type Context = {
  oas: Oas
  pluginManager: PluginManager
}

export class FakerGenerator extends Generator<PluginOptions['resolvedOptions'], Context> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  imports: ImportMeta[] = []

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}

  build({
    schema,
    baseName,
    description,
    operationName,
    operation,
  }: {
    schema: OasTypes.SchemaObject
    baseName: string
    description?: string
    operationName?: string
    operation?: Operation
  }): string[] {
    const texts: string[] = []
    const fakerInput = this.getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(transformers.JSDoc.createJSDocBlockText({ comments: [`@description ${transformers.trim(description)}`] }))
    }

    const name = this.context.pluginManager.resolveName({ name: baseName, pluginKey, type: 'function' })
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const fakerOutput = fakerParser(fakerInput, {
      name,
      typeName,
      mapper: this.options.mapper,
      seed: this.options.seed,
    })
    // hack to add typescript imports
    if (typeName) {
      const ref = {
        propertyName: typeName,
        originalName: baseName,
      }
      const path = this.context.pluginManager.resolvePath({
        baseName: operationName || typeName,
        pluginKey: swaggerTypeScriptPluginKey,
        options: { tag: operation?.getTags()[0]?.name },
      })

      this.imports.push({
        ref,
        path: path || '',
        isTypeOnly: true,
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
  getTypeFromSchema(schema: OasTypes.SchemaObject, baseName?: string): FakerMeta[] {
    return this.options.transformers.schema?.(schema, baseName) || this.#getBaseTypeFromSchema(schema, baseName) || []
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

        validationFunctions.push(...this.getTypeFromSchema(schema, name))

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: FakerMeta[] = []

    if (additionalProperties) {
      const addionalValidationFunctions: FakerMeta[] = additionalProperties === true
        ? [{ keyword: this.#unknownReturn }]
        : this.getTypeFromSchema(additionalProperties as OasTypes.SchemaObject)

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
    const propertyName = this.context.pluginManager.resolveName({ name: originalName, pluginKey, type: 'function' })

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    const path = this.context.pluginManager.resolvePath({ baseName: propertyName, pluginKey })

    this.imports.push({
      ref,
      path: path || '',
      isTypeOnly: false,
    })

    return [{ keyword: fakerKeywords.ref, args: ref.propertyName }]
  }

  #getParsedSchema(schema?: OasTypes.SchemaObject) {
    const parsedSchema = getSchemaFactory(this.context.oas)(schema)
    return parsedSchema
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #getBaseTypeFromSchema(_schema: OasTypes.SchemaObject | undefined, baseName?: string): FakerMeta[] {
    const { schema, version } = this.#getParsedSchema(_schema)

    if (!schema) {
      return [{ keyword: this.#unknownReturn }]
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
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }),
      }
      if (schemaWithoutOneOf.properties && union.args) {
        return [{ ...union, args: [...this.getTypeFromSchema(schemaWithoutOneOf, baseName), ...union.args] }]
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
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }),
      }
      if (schemaWithouAnyOf.properties && union.args) {
        return [{ ...union, args: [...this.getTypeFromSchema(schemaWithouAnyOf, baseName), ...union.args] }]
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
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }),
      }

      if (schemaWithoutAllOf.properties && and.args) {
        return [{ ...and, args: [...this.getTypeFromSchema(schemaWithoutAllOf, baseName), ...and.args] }]
      }

      return [and]
    }

    if (schema.enum) {
      const extensionEnums = ['x-enumNames', 'x-enum-varnames']
        .filter(extensionKey => extensionKey in schema)
        .map((extensionKey) => [
          {
            keyword: fakerKeywords.enum,
            args: [`[${[...new Set(schema[extensionKey as keyof typeof schema] as string[])].map((value) => `\`${value}\``).join(', ')}]`],
          },
        ])

      if (extensionEnums.length > 0 && extensionEnums[0]) {
        return extensionEnums[0]
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
      return [{ keyword: fakerKeywords.array, args: this.getTypeFromSchema(schema.items as OasTypes.SchemaObject, baseName) }]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OasTypes.SchemaObject[]

      return [
        {
          keyword: fakerKeywords.tuple,
          args: prefixItems
            .map((item) => {
              // no baseType so we can fall back on an union when using enum
              return this.getTypeFromSchema(item, undefined)?.[0]
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
        // TODO  remove hardcoded first type, second nullable
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type, nullable] = schema.type as Array<OpenAPIV3.NonArraySchemaObjectType>

        return [
          ...this.getTypeFromSchema(
            {
              ...schema,
              type,
            },
            baseName,
          ),
          nullable ? { keyword: fakerKeywords.null } : undefined,
        ].filter(Boolean)
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

    return [{ keyword: this.#unknownReturn }]
  }

  get #unknownReturn() {
    if (this.options.unknownType === 'any') {
      return fakerKeywords.any
    }

    return fakerKeywords.unknown
  }
}
