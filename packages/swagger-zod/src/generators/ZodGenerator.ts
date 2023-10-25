import { SchemaGenerator } from '@kubb/core'
import { getUniqueName, transformers } from '@kubb/core/utils'
import { isReference } from '@kubb/swagger'

import { zodKeywords, zodParser } from '../parsers/index.ts'
import { pluginKey } from '../plugin.ts'

import type { PluginContext } from '@kubb/core'
import type { OpenAPIV3, Refs } from '@kubb/swagger'
import type ts from 'typescript'
import type { ZodMeta } from '../parsers/index.ts'

type Options = {
  withJSDocs?: boolean
  resolveName: PluginContext['resolveName']
}
export class ZodGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, string[]> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}

  constructor(options: Options = { withJSDocs: true, resolveName: ({ name }) => name }) {
    super(options)

    return this
  }

  build({
    schema,
    baseName,
    description,
    keysToOmit,
  }: {
    schema: OpenAPIV3.SchemaObject
    baseName: string
    description?: string
    keysToOmit?: string[]
  }): string[] {
    const texts: string[] = []
    const zodInput = this.#getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(`
      /**
       * @description ${description}
       */`)
    }

    const zodOutput = zodParser(zodInput, { keysToOmit, name: this.options.resolveName({ name: baseName, pluginKey }) || baseName })

    texts.push(zodOutput)

    return [...this.extraTexts, ...texts]
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  #getTypeFromSchema(schema: OpenAPIV3.SchemaObject, baseName?: string): ZodMeta[] {
    const validationFunctions = this.#getBaseTypeFromSchema(schema, baseName)
    if (validationFunctions) {
      return validationFunctions
    }

    return []
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, baseName?: string): ZodMeta[] {
    const properties = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(properties)
      .map((name) => {
        const validationFunctions: ZodMeta[] = []

        const schema = properties[name] as OpenAPIV3.SchemaObject
        const isRequired = required && required.includes(name)

        validationFunctions.push(...this.#getTypeFromSchema(schema, name))

        if (this.options.withJSDocs && schema.description) {
          validationFunctions.push({ keyword: zodKeywords.describe, args: `\`${schema.description.replaceAll('\n', ' ').replaceAll('`', "'")}\`` })
        }
        const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
        const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined
        const matches = schema.pattern ?? undefined
        const nullable = schema.nullable ?? false
        const isEnum = validationFunctions.some((item) => item.keyword === zodKeywords.enum)

        if (!isEnum && min !== undefined) {
          // enums cannot have a min/max set in Zod
          validationFunctions.push({ keyword: zodKeywords.min, args: min })
        }
        if (!isEnum && max !== undefined) {
          // enums cannot have a min/max set in Zod
          validationFunctions.push({ keyword: zodKeywords.max, args: max })
        }
        if (matches) {
          const isStartWithSlash = matches.startsWith('/')
          const isEndWithSlash = matches.endsWith('/')

          const regexp = `new RegExp('${transformers.jsStringEscape(matches.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined))}')`

          validationFunctions.push({ keyword: zodKeywords.matches, args: regexp })
        }

        if (schema.format === 'date-time' || baseName === 'date') {
          validationFunctions.push({ keyword: zodKeywords.datetime })
        }

        if (schema.format === 'email' || baseName === 'email') {
          validationFunctions.push({ keyword: zodKeywords.email })
        }

        if (schema.format === 'uri' || schema.format === 'hostname') {
          validationFunctions.push({ keyword: zodKeywords.url })
        }
        if (schema.format === 'uuid') {
          validationFunctions.push({ keyword: zodKeywords.uuid })
        }

        if (schema.readOnly) {
          validationFunctions.push({ keyword: zodKeywords.readOnly })
        }

        if (schema.default !== undefined && !Array.isArray(schema.default)) {
          if (typeof schema.default === 'string') {
            validationFunctions.push({ keyword: zodKeywords.default, args: `'${schema.default}'` })
          }
          if (typeof schema.default === 'boolean') {
            validationFunctions.push({ keyword: zodKeywords.default, args: schema.default ?? false })
          }
        }

        if (!isRequired && nullable) {
          validationFunctions.push({ keyword: zodKeywords.nullish })
        } else if (nullable) {
          validationFunctions.push({ keyword: zodKeywords.null })
        } else if (!isRequired) {
          validationFunctions.push({ keyword: zodKeywords.optional })
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: ZodMeta[] = []

    members.push({ keyword: zodKeywords.object, args: objectMembers })

    if (additionalProperties) {
      const addionalValidationFunctions: ZodMeta[] = additionalProperties === true
        ? [{ keyword: zodKeywords.any }]
        : this.#getTypeFromSchema(additionalProperties as OpenAPIV3.SchemaObject)

      members.push({ keyword: zodKeywords.catchall, args: addionalValidationFunctions })
    }

    return members
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(obj: OpenAPIV3.ReferenceObject, _baseName?: string): ZodMeta[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (ref) {
      return [{ keyword: zodKeywords.ref, args: ref.propertyName }]
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.options.resolveName({ name: originalName, pluginKey }) || originalName

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    return [{ keyword: zodKeywords.ref, args: ref.propertyName }]
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined, baseName?: string): ZodMeta[] {
    if (!schema) {
      return [{ keyword: zodKeywords.any }]
    }

    if (isReference(schema)) {
      return this.#getRefAlias(schema, baseName)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: ZodMeta = {
        keyword: zodKeywords.union,
        args: schema.oneOf
          .map((item) => {
            return this.#getBaseTypeFromSchema(item)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== zodKeywords.any
          }),
      }
      if (schemaWithoutOneOf.properties) {
        return [...this.#getBaseTypeFromSchema(schemaWithoutOneOf, baseName), union]
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
            return this.#getBaseTypeFromSchema(item)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== zodKeywords.any
          }),
      }
      if (schemaWithoutAnyOf.properties) {
        return [...this.#getBaseTypeFromSchema(schemaWithoutAnyOf, baseName), union]
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
            return this.#getBaseTypeFromSchema(item)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== zodKeywords.any
          }),
      }

      if (schemaWithoutAllOf.properties) {
        return [
          {
            ...and,
            args: [...(and.args || []), ...this.#getBaseTypeFromSchema(schemaWithoutAllOf, baseName)],
          },
        ]
      }

      return [and]
    }

    if (schema.enum) {
      if ('x-enumNames' in schema) {
        return [
          {
            keyword: zodKeywords.enum,
            args: [...new Set(schema['x-enumNames'] as string[])].map((value: string) => `\`${value}\``),
          },
        ]
      }

      if (schema.type === 'number' || schema.type === 'integer') {
        // we cannot use z.enum when enum type is number/integer
        return [
          {
            keyword: zodKeywords.union,
            args: [...new Set(schema.enum)].map((value: string) => {
              return {
                keyword: zodKeywords.literal,
                args: value,
              }
            }),
          },
        ]
      }

      return [
        {
          keyword: zodKeywords.enum,
          args: [...new Set(schema.enum)].map((value: string) => `\`${value}\``),
        },
      ]
    }

    if ('items' in schema) {
      // items -> array
      return [{ keyword: zodKeywords.array, args: this.#getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, baseName) }]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OpenAPIV3.SchemaObject[]

      return [
        {
          keyword: zodKeywords.tuple,
          args: prefixItems
            .map((item) => {
              // no baseType so we can fall back on an union when using enum
              return this.#getBaseTypeFromSchema(item, undefined)[0]
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
          { keyword: zodKeywords.null },
        ]
      }

      // string, boolean, null, number
      if (schema.type in zodKeywords) {
        return [{ keyword: schema.type }]
      }
    }

    if (schema.format === 'binary') {
      // TODO binary
    }

    return [{ keyword: zodKeywords.any }]
  }
}
