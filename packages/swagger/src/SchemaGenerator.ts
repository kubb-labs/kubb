import { Generator } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'

import { getSchemaFactory } from './utils/getSchemaFactory.ts'
import { isReference } from './utils/isReference.ts'
import { isKeyword, schemaKeywords } from './SchemaMapper.ts'

import type { Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams } from '@kubb/core'
import type { ts } from '@kubb/parser'
import type { Oas, OasTypes, OpenAPIV3, Operation } from './oas/index.ts'
import type { Schema } from './SchemaMapper.ts'
import type { ImportMeta, Refs } from './types.ts'

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  oas: Oas
  pluginManager: PluginManager
  /**
   * Current plugin
   */
  plugin: Plugin<TPluginOptions>
}

export type SchemaGeneratorOptions = {
  dateType: 'string' | 'date'
  unknownType: 'any' | 'unknown'
  mapper?: Record<string, string>
  typed?: boolean
  transformers: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
    /**
     * Receive schema and baseName(propertName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (schema: OasTypes.SchemaObject | undefined, baseName?: string) => Schema[] | undefined
  }
}

export type SchemaGeneratorBuildOptions = {
  schema: OasTypes.SchemaObject
  baseName: string
  description?: string
  optional?: boolean
  keysToOmit?: string[]
  operationName?: string
  operation?: Operation
}

export abstract class SchemaGenerator<
  TOptions extends SchemaGeneratorOptions = SchemaGeneratorOptions,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
> extends Generator<TOptions, Context<TOptions, TPluginOptions>> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}
  imports: ImportMeta[] = []

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  getTypeFromSchema(schema: OasTypes.SchemaObject, baseName?: string): Schema[] {
    return this.options.transformers.schema?.(schema, baseName) || this.#getBaseTypeFromSchema(schema, baseName) || []
  }

  get #unknownReturn() {
    if (this.options.unknownType === 'any') {
      return schemaKeywords.any
    }

    return schemaKeywords.unknown
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #getTypeFromProperties(baseSchema?: OasTypes.SchemaObject, _baseName?: string): Schema[] {
    const properties = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(properties)
      .map((name) => {
        const validationFunctions: Schema[] = []

        const schema = properties[name] as OasTypes.SchemaObject & { 'x-nullable': boolean }
        const isRequired = Array.isArray(required) ? required.includes(name) : !!required

        validationFunctions.push(...this.getTypeFromSchema(schema, name))

        const nullable = (schema.nullable ?? schema['x-nullable']) ?? false

        if (!isRequired && nullable) {
          validationFunctions.push({ keyword: schemaKeywords.nullish })
        } else if (nullable) {
          validationFunctions.push({ keyword: schemaKeywords.nullable })
        } else if (!isRequired) {
          validationFunctions.push({ keyword: schemaKeywords.optional })
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: Schema[] = []

    members.push({ keyword: schemaKeywords.object, args: { entries: objectMembers } })

    if (additionalProperties) {
      const addionalValidationFunctions: Schema[] = additionalProperties === true
        ? [{ keyword: this.#unknownReturn }]
        : this.getTypeFromSchema(additionalProperties as OasTypes.SchemaObject)

      members.push({ keyword: schemaKeywords.catchall, args: addionalValidationFunctions })
    }

    return members
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(obj: OpenAPIV3.ReferenceObject, _baseName?: string): Schema[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.context.pluginManager.resolveName({ name: originalName, pluginKey: this.context.plugin.key, 'type': 'function' })

    if (ref) {
      return [{ keyword: schemaKeywords.ref, args: { name: ref.propertyName } }]
    }

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    const fileName = this.context.pluginManager.resolveName({ name: originalName, pluginKey: this.context.plugin.key, type: 'file' })
    const path = this.context.pluginManager.resolvePath({ baseName: fileName, pluginKey: this.context.plugin.key })

    if (path) {
      this.imports.push({
        ref,
        path,
        isTypeOnly: false,
      })
    }

    return [{ keyword: schemaKeywords.ref, args: { name: ref.propertyName } }]
  }

  #getParsedSchema(schema?: OasTypes.SchemaObject) {
    const parsedSchema = getSchemaFactory(this.context.oas)(schema)
    return parsedSchema
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #getBaseTypeFromSchema(_schema: OasTypes.SchemaObject | undefined, baseName?: string): Schema[] {
    const { schema, version } = this.#getParsedSchema(_schema)

    if (!schema) {
      return [{ keyword: this.#unknownReturn }]
    }

    if (isReference(schema)) {
      return this.#getRefAlias(schema, baseName)
    }

    const baseItems: Schema[] = []

    if (schema.default !== undefined && !Array.isArray(schema.default)) {
      if (typeof schema.default === 'string') {
        baseItems.push({ keyword: schemaKeywords.default, args: `"${schema.default}"` })
      }
      if (typeof schema.default === 'boolean') {
        baseItems.push({ keyword: schemaKeywords.default, args: schema.default ?? false })
      }
    }

    if (schema.description) {
      baseItems.push({ keyword: schemaKeywords.describe, args: `\`${schema.description.replaceAll('\n', ' ').replaceAll('`', "'")}\`` })
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: Schema = {
        keyword: schemaKeywords.union,
        args: schema.oneOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }),
      }
      if (schemaWithoutOneOf.properties) {
        return [...this.getTypeFromSchema(schemaWithoutOneOf, baseName), union]
      }

      return [union]
    }

    if (schema.anyOf) {
      // union
      const schemaWithoutAnyOf = { ...schema, anyOf: undefined }

      const union: Schema = {
        keyword: schemaKeywords.union,
        args: schema.anyOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }).map(item => {
            if (isKeyword(item, schemaKeywords.object)) {
              return {
                ...item,
                args: {
                  ...item.args,
                  strict: true,
                },
              }
            }
            return item
          }),
      }
      if (schemaWithoutAnyOf.properties) {
        return [...this.getTypeFromSchema(schemaWithoutAnyOf, baseName), union]
      }

      return [union]
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      const and: Schema = {
        keyword: schemaKeywords.and,
        args: schema.allOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }),
      }

      if (schemaWithoutAllOf.properties) {
        return [
          {
            ...and,
            args: [...(and.args || []), ...this.getTypeFromSchema(schemaWithoutAllOf, baseName)],
          },
        ]
      }

      return [and]
    }

    if (schema.enum) {
      // x-enumNames has priority
      const extensionEnums = ['x-enumNames', 'x-enum-varnames']
        .filter(extensionKey => extensionKey in schema)
        .map((extensionKey) => {
          return [{
            keyword: schemaKeywords.enum,
            args: [...new Set(schema[extensionKey as keyof typeof schema] as string[])].map((_value, index) => `\`${schema.enum![index]}\``),
          }, ...baseItems]
        })

      if (schema.type === 'number' || schema.type === 'integer') {
        // we cannot use z.enum when enum type is number/integer
        const enumNames = extensionEnums[0]?.find(item => item.keyword === schemaKeywords.enum) as {
          keyword: typeof schemaKeywords.enum
          args?: Array<string | number>
        }
        return [
          {
            keyword: schemaKeywords.union,
            args: enumNames
              ? enumNames?.args?.map((_value, index) => {
                return {
                  keyword: schemaKeywords.literal,
                  args: schema.enum![index],
                }
              })
              : [...new Set(schema.enum)].map((value: string) => {
                return {
                  keyword: schemaKeywords.literal,
                  args: value,
                }
              }),
          },
          ...baseItems,
        ]
      }

      if (extensionEnums.length > 0 && extensionEnums[0]) {
        return extensionEnums[0]
      }

      return [
        {
          keyword: schemaKeywords.enum,
          args: [...new Set(schema.enum)].map((value: string) => `\`${value}\``),
        },
        ...baseItems,
      ]
    }

    if ('items' in schema) {
      const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
      const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined

      if (max !== undefined) {
        baseItems.unshift({ keyword: schemaKeywords.max, args: max })
      }

      if (min !== undefined) {
        baseItems.unshift({ keyword: schemaKeywords.min, args: min })
      }

      // items -> array
      return [{ keyword: schemaKeywords.array, args: this.getTypeFromSchema(schema.items as OasTypes.SchemaObject, baseName) }, ...baseItems]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OasTypes.SchemaObject[]

      return [
        {
          keyword: schemaKeywords.tuple,
          args: prefixItems
            .map((item) => {
              // no baseType so we can fall back on an union when using enum
              return this.getTypeFromSchema(item, undefined)[0]
            })
            .filter(Boolean),
        },
      ]
    }

    if (schema.properties || schema.additionalProperties) {
      return [...this.#getTypeFromProperties(schema, baseName), ...baseItems]
    }

    if (version === '3.1' && 'const' in schema) {
      // const keyword takes precendence over the actual type.
      if (schema['const']) {
        if (typeof schema['const'] === 'string') {
          return [{ keyword: schemaKeywords.literal, args: `"${schema['const']}"` }]
        } else if (typeof schema['const'] === 'number') {
          return [{ keyword: schemaKeywords.literal, args: schema['const'] }]
        }
      } else {
        return [{ keyword: schemaKeywords.literal, args: 'z.null()' }]
      }
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
          nullable ? { keyword: schemaKeywords.nullable } : undefined,
        ].filter(Boolean)
      }

      if ([schemaKeywords.number as string, schemaKeywords.integer as string, schemaKeywords.string as string].includes(schema.type)) {
        const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
        const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined

        if (max !== undefined) {
          baseItems.unshift({ keyword: schemaKeywords.max, args: max })
        }

        if (min !== undefined) {
          baseItems.unshift({ keyword: schemaKeywords.min, args: min })
        }
      }

      if (schema.pattern) {
        const isStartWithSlash = schema.pattern.startsWith('/')
        const isEndWithSlash = schema.pattern.endsWith('/')

        const regexp = `new RegExp('${transformers.jsStringEscape(schema.pattern.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined))}')`
        baseItems.unshift({ keyword: schemaKeywords.matches, args: regexp })
      }

      if (schema.format === 'date-time') {
        if (this.options.dateType === 'date' && ['date', 'date-time'].some((item) => item === schema.format)) {
          baseItems.unshift({ keyword: schemaKeywords.date })

          return baseItems
        } else {
          baseItems.unshift({ keyword: schemaKeywords.datetime })
        }
      }

      if (schema.format === 'email') {
        baseItems.unshift({ keyword: schemaKeywords.email })
      }

      if (schema.format === 'uri' || schema.format === 'hostname') {
        baseItems.unshift({ keyword: schemaKeywords.url })
      }

      if (schema.format === 'hostname') {
        baseItems.unshift({ keyword: schemaKeywords.url })
      }
      if (schema.format === 'uuid') {
        baseItems.unshift({ keyword: schemaKeywords.uuid })
      }

      // string, boolean, null, number
      if (schema.type in schemaKeywords) {
        return [{ keyword: schema.type }, ...baseItems]
      }

      return baseItems
    }

    if (schema.format === 'binary') {
      // TODO binary
    }

    return [{ keyword: this.#unknownReturn }]
  }

  abstract build(
    options: SchemaGeneratorBuildOptions,
  ): string[]
}
