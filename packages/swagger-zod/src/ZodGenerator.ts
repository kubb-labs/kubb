import { Generator } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'
import { getSchemaFactory, isReference } from '@kubb/swagger/utils'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { isKeyword, zodKeywords, zodParser } from './zodParser.ts'

import type { PluginManager } from '@kubb/core'
import type { ts } from '@kubb/parser'
import type { ImportMeta, Refs } from '@kubb/swagger'
import type { Oas, OasTypes, OpenAPIV3, Operation } from '@kubb/swagger/oas'
import type { PluginOptions } from './types.ts'
import type { ZodMeta } from './zodParser.ts'

type Context = {
  oas: Oas
  pluginManager: PluginManager
}
export class ZodGenerator extends Generator<PluginOptions['resolvedOptions'], Context> {
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
    optional,
    keysToOmit,
    operation,
  }: {
    schema: OasTypes.SchemaObject
    baseName: string
    description?: string
    optional?: boolean
    keysToOmit?: string[]
    operation?: Operation
  }): string[] {
    const texts: string[] = []
    const zodInput = this.getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(`
      /**
       * @description ${transformers.trim(description)}
       */`)
    }

    if (optional) {
      zodInput.push({
        keyword: zodKeywords.optional,
      })
    }

    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const zodOutput = zodParser(zodInput, {
      required: !!schema?.required,
      keysToOmit,
      name: this.context.pluginManager.resolveName({ name: baseName, pluginKey, type: 'function' }),
      typeName: withTypeAnnotation
        ? typeName
        : undefined,
    })

    if (withTypeAnnotation && typeName) {
      const typeFileName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'file' })
      const typePath = this.context.pluginManager.resolvePath({ baseName: typeFileName, pluginKey: swaggerTypeScriptPluginKey })

      if (typePath) {
        this.imports.push({
          ref: {
            propertyName: typeName,
            originalName: baseName,
            pluginKey: swaggerTypeScriptPluginKey,
          },
          path: typePath,
          isTypeOnly: true,
        })
      }
    }

    texts.push(zodOutput)

    return [...this.extraTexts, ...texts]
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  getTypeFromSchema(schema: OasTypes.SchemaObject, baseName?: string): ZodMeta[] {
    return this.#getBaseTypeFromSchema(schema, baseName) || []
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #getTypeFromProperties(baseSchema?: OasTypes.SchemaObject, baseName?: string): ZodMeta[] {
    const properties = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(properties)
      .map((name) => {
        const validationFunctions: ZodMeta[] = []

        const schema = properties[name] as OasTypes.SchemaObject
        const isRequired = Array.isArray(required) ? required.includes(name) : !!required

        validationFunctions.push(...this.getTypeFromSchema(schema, name))

        const nullable = schema.nullable ?? false

        if (!isRequired && nullable) {
          validationFunctions.push({ keyword: zodKeywords.nullish })
        } else if (nullable) {
          validationFunctions.push({ keyword: zodKeywords.nullable })
        } else if (!isRequired) {
          validationFunctions.push({ keyword: zodKeywords.optional })
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: ZodMeta[] = []

    members.push({ keyword: zodKeywords.object, args: { entries: objectMembers } })

    if (additionalProperties) {
      const addionalValidationFunctions: ZodMeta[] = additionalProperties === true
        ? [{ keyword: this.#unknownReturn }]
        : this.getTypeFromSchema(additionalProperties as OasTypes.SchemaObject)

      members.push({ keyword: zodKeywords.catchall, args: addionalValidationFunctions })
    }

    return members
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(obj: OpenAPIV3.ReferenceObject, baseName?: string): ZodMeta[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.context.pluginManager.resolveName({ name: originalName, pluginKey, 'type': 'function' })

    if (ref) {
      return [{ keyword: zodKeywords.ref, args: { name: ref.propertyName } }]
    }

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    const fileName = this.context.pluginManager.resolveName({ name: originalName, pluginKey, type: 'file' })
    const path = this.context.pluginManager.resolvePath({ baseName: fileName, pluginKey })

    if (path) {
      this.imports.push({
        ref,
        path,
        isTypeOnly: false,
      })
    }

    return [{ keyword: zodKeywords.ref, args: { name: ref.propertyName } }]
  }

  #getParsedSchema(schema?: OasTypes.SchemaObject) {
    const parsedSchema = getSchemaFactory(this.context.oas)(schema)
    return parsedSchema
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #getBaseTypeFromSchema(_schema: OasTypes.SchemaObject | undefined, baseName?: string): ZodMeta[] {
    const { schema, version } = this.#getParsedSchema(_schema)

    if (!schema) {
      return [{ keyword: this.#unknownReturn }]
    }

    if (isReference(schema)) {
      return this.#getRefAlias(schema, baseName)
    }

    const baseItems: ZodMeta[] = []

    if (schema.default !== undefined && !Array.isArray(schema.default)) {
      if (typeof schema.default === 'string') {
        baseItems.push({ keyword: zodKeywords.default, args: `"${schema.default}"` })
      }
      if (typeof schema.default === 'boolean') {
        baseItems.push({ keyword: zodKeywords.default, args: schema.default ?? false })
      }
    }

    if (schema.description) {
      baseItems.push({ keyword: zodKeywords.describe, args: `\`${schema.description.replaceAll('\n', ' ').replaceAll('`', "'")}\`` })
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: ZodMeta = {
        keyword: zodKeywords.union,
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

      const union: ZodMeta = {
        keyword: zodKeywords.union,
        args: schema.anyOf
          .map((item) => {
            return item && this.getTypeFromSchema(item as OasTypes.SchemaObject)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }).map(item => {
            if (isKeyword(item, zodKeywords.object)) {
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

      const and: ZodMeta = {
        keyword: zodKeywords.and,
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
            keyword: zodKeywords.enum,
            args: [...new Set(schema[extensionKey as keyof typeof schema] as string[])].map((_value, index) => `\`${schema.enum![index]}\``),
          }, ...baseItems]
        })

      if (schema.type === 'number' || schema.type === 'integer') {
        // we cannot use z.enum when enum type is number/integer
        const enumNames = extensionEnums[0]?.find(item => item.keyword === zodKeywords.enum) as {
          keyword: typeof zodKeywords.enum
          args?: Array<string | number>
        }
        return [
          {
            keyword: zodKeywords.union,
            args: enumNames
              ? enumNames?.args?.map((_value, index) => {
                return {
                  keyword: zodKeywords.literal,
                  args: schema.enum![index],
                }
              })
              : [...new Set(schema.enum)].map((value: string) => {
                return {
                  keyword: zodKeywords.literal,
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
          keyword: zodKeywords.enum,
          args: [...new Set(schema.enum)].map((value: string) => `\`${value}\``),
        },
        ...baseItems,
      ]
    }

    if ('items' in schema) {
      const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
      const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined

      if (max !== undefined) {
        baseItems.unshift({ keyword: zodKeywords.max, args: max })
      }

      if (min !== undefined) {
        baseItems.unshift({ keyword: zodKeywords.min, args: min })
      }

      // items -> array
      return [{ keyword: zodKeywords.array, args: this.getTypeFromSchema(schema.items as OasTypes.SchemaObject, baseName) }, ...baseItems]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OasTypes.SchemaObject[]

      return [
        {
          keyword: zodKeywords.tuple,
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
          return [{ keyword: zodKeywords.literal, args: `"${schema['const']}"` }]
        } else if (typeof schema['const'] === 'number') {
          return [{ keyword: zodKeywords.literal, args: schema['const'] }]
        }
      } else {
        return [{ keyword: zodKeywords.literal, args: 'z.null()' }]
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
          nullable ? { keyword: zodKeywords.nullable } : undefined,
        ].filter(Boolean)
      }

      if (schema.readOnly) {
        baseItems.unshift({ keyword: zodKeywords.readOnly })
      }

      if ([zodKeywords.number as string, zodKeywords.integer as string, zodKeywords.string as string].includes(schema.type)) {
        const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
        const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined

        if (max !== undefined) {
          baseItems.unshift({ keyword: zodKeywords.max, args: max })
        }

        if (min !== undefined) {
          baseItems.unshift({ keyword: zodKeywords.min, args: min })
        }
      }

      if (schema.pattern) {
        const isStartWithSlash = schema.pattern.startsWith('/')
        const isEndWithSlash = schema.pattern.endsWith('/')

        const regexp = `new RegExp('${transformers.jsStringEscape(schema.pattern.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined))}')`
        baseItems.unshift({ keyword: zodKeywords.matches, args: regexp })
      }

      if (schema.format === 'date-time' || baseName === 'date') {
        if (this.options.dateType === 'date' && ['date', 'date-time'].some((item) => item === schema.format)) {
          baseItems.unshift({ keyword: zodKeywords.date })

          return baseItems
        } else {
          baseItems.unshift({ keyword: zodKeywords.datetime })
        }
      }

      if (schema.format === 'email' || baseName === 'email') {
        baseItems.unshift({ keyword: zodKeywords.email })
      }

      if (schema.format === 'hostname') {
        baseItems.unshift({ keyword: zodKeywords.url })
      }
      if (schema.format === 'uuid') {
        baseItems.unshift({ keyword: zodKeywords.uuid })
      }

      // string, boolean, null, number
      if (schema.type in zodKeywords) {
        return [{ keyword: schema.type }, ...baseItems]
      }

      return baseItems
    }

    if (schema.format === 'binary') {
      // TODO binary
    }

    return [{ keyword: this.#unknownReturn }]
  }
  get #unknownReturn() {
    if (this.options.unknownType === 'any') {
      return zodKeywords.any
    }

    return zodKeywords.unknown
  }
}
