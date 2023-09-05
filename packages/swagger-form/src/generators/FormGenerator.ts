import { getUniqueName, SchemaGenerator } from '@kubb/core'
import { isReference } from '@kubb/swagger'

import { formKeywords, formParser } from '../parsers/index.ts'
import { pluginName } from '../plugin.ts'

import type { PluginContext } from '@kubb/core'
import type { OpenAPIV3, Refs } from '@kubb/swagger'
import type ts from 'typescript'
import type { FormKeyword, FormMeta } from '../parsers/index.ts'

type Options = {
  withJSDocs?: boolean
  resolveName: PluginContext['resolveName']
  mapper?: Record<FormKeyword, string>
}
export class FormGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, string[]> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  usedAliasNames: Record<string, number> = {}

  constructor(options: Options = { withJSDocs: true, resolveName: ({ name }) => name }) {
    super(options)

    return this
  }

  build({ schema, baseName, description }: { schema: OpenAPIV3.SchemaObject; baseName?: string; description?: string }): string[] {
    const texts: string[] = []
    const zodInput = this.getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(`
      {
        /**
         * @description ${description}
         */
      }`)
    }

    const zodOutput = formParser(zodInput, { mapper: this.options.mapper })

    texts.push(zodOutput)

    return [...this.extraTexts, ...texts]
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  private getTypeFromSchema(schema: OpenAPIV3.SchemaObject, baseName?: string, fullName?: string): FormMeta[] {
    const validationFunctions = this.getBaseTypeFromSchema(schema, baseName, fullName)
    if (validationFunctions) {
      return validationFunctions
    }

    return []
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  private getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, baseName?: string, fullName?: string): FormMeta[] {
    const properties = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(properties)
      .map((name) => {
        const validationFunctions: FormMeta[] = []

        const schema = properties[name] as OpenAPIV3.SchemaObject
        const isRequired = required && required.includes(name)

        validationFunctions.push(...this.getTypeFromSchema(schema, name, [fullName ?? baseName, name].filter(Boolean).join('.')))

        if (this.options.withJSDocs && schema.description) {
          validationFunctions.push({ keyword: formKeywords.describe, args: schema.description.replaceAll('\n', ' ').replaceAll('`', "'") })
        }

        const min = schema.minimum ?? schema.minLength ?? undefined
        const max = schema.maximum ?? schema.maxLength ?? undefined
        const matches = schema.pattern ?? undefined
        const isEnum = validationFunctions.some((item) => item.keyword === formKeywords.enum)

        if (!isEnum && min !== undefined) {
          // enums cannot have a min/max set in Zod
          validationFunctions.push({ keyword: formKeywords.min, args: min })
        }
        if (!isEnum && max !== undefined) {
          // enums cannot have a min/max set in Zod
          validationFunctions.push({ keyword: formKeywords.max, args: max })
        }
        if (matches) {
          const isStartWithSlash = matches.startsWith('/')
          const isEndWithSlash = matches.endsWith('/')

          const regexp = `new RegExp('${escape(matches.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined))}')`

          validationFunctions.push({ keyword: formKeywords.matches, args: regexp })
        }

        if (schema.format === 'date-time' || baseName === 'date') {
          validationFunctions.push({ keyword: formKeywords.datetime })
        }

        if (schema.format === 'email' || baseName === 'email') {
          validationFunctions.push({ keyword: formKeywords.email })
        }

        if (schema.format === 'uri' || schema.format === 'hostname') {
          validationFunctions.push({ keyword: formKeywords.url })
        }
        if (schema.format === 'uuid') {
          validationFunctions.push({ keyword: formKeywords.uuid })
        }

        if (schema.default !== undefined && !Array.isArray(schema.default)) {
          if (typeof schema.default === 'string') {
            validationFunctions.push({ keyword: formKeywords.default, args: `'${schema.default}'` })
          }
          if (typeof schema.default === 'boolean') {
            validationFunctions.push({ keyword: formKeywords.default, args: schema.default ?? false })
          }
        }

        if (isRequired) {
          validationFunctions.push({ keyword: formKeywords.required })
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: FormMeta[] = []

    members.push({ keyword: formKeywords.object, args: objectMembers })

    if (additionalProperties) {
      const addionalValidationFunctions: FormMeta[] =
        additionalProperties === true ? [{ keyword: formKeywords.any }] : this.getTypeFromSchema(additionalProperties as OpenAPIV3.SchemaObject)

      members.push({ keyword: formKeywords.catchall, args: addionalValidationFunctions })
    }

    return members
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject, baseName?: string): FormMeta[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (ref) {
      return [{ keyword: formKeywords.ref, args: ref.propertyName }]
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.usedAliasNames)
    const propertyName = this.options.resolveName({ name: originalName, pluginName }) || originalName

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
    }

    return [{ keyword: formKeywords.ref, args: ref.propertyName }]
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined, baseName?: string, fullName?: string): FormMeta[] {
    if (!schema) {
      return [{ keyword: formKeywords.any }]
    }

    if (isReference(schema)) {
      return this.getRefAlias(schema, baseName)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: FormMeta = {
        keyword: formKeywords.union,
        args: schema.oneOf
          .map((item) => {
            return this.getBaseTypeFromSchema(item)[0]
          })
          .filter((item) => {
            return item && item.keyword !== formKeywords.any
          }),
      }
      if (schemaWithoutOneOf.properties) {
        return [...this.getBaseTypeFromSchema(schemaWithoutOneOf, baseName, fullName), union]
      }

      return [union]
    }

    if (schema.anyOf) {
      // union
      const schemaWithoutAnyOf = { ...schema, anyOf: undefined }

      const union: FormMeta = {
        keyword: formKeywords.union,
        args: schema.anyOf
          .map((item) => {
            return this.getBaseTypeFromSchema(item)[0]
          })
          .filter((item) => {
            return item && item.keyword !== formKeywords.any
          }),
      }
      if (schemaWithoutAnyOf.properties) {
        return [...this.getBaseTypeFromSchema(schemaWithoutAnyOf, baseName, fullName), union]
      }

      return [union]
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      const and: FormMeta = {
        keyword: formKeywords.and,
        args: schema.allOf
          .map((item) => {
            return this.getBaseTypeFromSchema(item)[0]
          })
          .filter((item) => {
            return item && item.keyword !== formKeywords.any
          }),
      }

      if (schemaWithoutAllOf.properties) {
        return [...this.getBaseTypeFromSchema(schemaWithoutAllOf, baseName, fullName), and]
      }

      return [{ keyword: formKeywords.object, args: {} }, and]
    }

    if (schema.enum) {
      if ('x-enumNames' in schema) {
        return [
          {
            keyword: formKeywords.enum,
            args: [`[${[...new Set(schema['x-enumNames'] as string[])].map((value) => `\`${value}\``).join(', ')}]`],
          },
        ]
      }

      return [
        {
          keyword: formKeywords.enum,
          args: [`[${[...new Set(schema.enum)].map((value: string) => `\`${value}\``).join(', ')}]`],
        },
      ]
    }

    if ('items' in schema) {
      // items -> array
      return [{ keyword: formKeywords.array, args: this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, baseName, fullName) }]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OpenAPIV3.SchemaObject[]

      return [
        {
          keyword: formKeywords.tuple,
          args: prefixItems.map((item) => {
            // no baseType so we can fall back on an union when using enum
            return this.getBaseTypeFromSchema(item, undefined, fullName)[0]
          }),
        },
      ]
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema, baseName, fullName)
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type] = schema.type as Array<OpenAPIV3.NonArraySchemaObjectType>

        return [
          ...this.getBaseTypeFromSchema(
            {
              ...schema,
              type,
            },
            baseName,
            fullName,
          ),
          { keyword: formKeywords.null, args: { name: baseName, fullName } },
        ]
      }

      // string, boolean, null, number
      if (schema.type in formKeywords) {
        return [{ keyword: schema.type, args: { name: baseName, fullName } } as FormMeta]
      }
    }

    if (schema.format === 'binary') {
      // TODO binary
    }

    return [{ keyword: formKeywords.any }]
  }
}
