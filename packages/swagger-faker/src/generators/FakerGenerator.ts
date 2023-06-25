import { getUniqueName, SchemaGenerator, uniqueId } from '@kubb/core'
import { isReference } from '@kubb/swagger'
import { pluginName as swaggerTypeScriptPluginName } from '@kubb/swagger-ts'

import { fakerKeywords, fakerParser } from '../parsers/index.ts'
import { pluginName } from '../plugin.ts'

import type { PluginContext } from '@kubb/core'
import type { FileResolver, ImportMeta, OpenAPIV3, Refs } from '@kubb/swagger'
import type ts from 'typescript'
import type { FakerKeyword, FakerMeta } from '../parsers/index.ts'
import { camelCase } from 'change-case'

type Options = {
  fileResolver?: FileResolver
  withJSDocs?: boolean
  resolveName: PluginContext['resolveName']
}
export class FakerGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, string[]> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  imports: ImportMeta[] = []

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  usedAliasNames: Record<string, number> = {}

  constructor(options: Options = { withJSDocs: true, resolveName: ({ name }) => name }) {
    super(options)

    return this
  }

  build({
    schema,
    baseName,
    description,
    operationName,
  }: {
    schema: OpenAPIV3.SchemaObject
    baseName: string
    description?: string
    operationName?: string
  }): string[] {
    const texts: string[] = []
    const fakerInput = this.getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(`
      /**
       * @description ${description}
       */`)
    }

    const name = this.options.resolveName({ name: baseName, pluginName }) || baseName
    const typeName = this.options.resolveName({ name: baseName, pluginName: swaggerTypeScriptPluginName })

    const fakerOutput = fakerParser(fakerInput, {
      name,
      typeName,
    })
    // hack to create import with recreating the ImportGenerator
    if (typeName) {
      const ref = {
        propertyName: typeName,
        originalName: baseName,
        pluginName: swaggerTypeScriptPluginName,
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
  private getTypeFromSchema(schema: OpenAPIV3.SchemaObject, baseName?: string): FakerMeta[] {
    const validationFunctions = this.getBaseTypeFromSchema(schema, baseName)
    if (validationFunctions) {
      return validationFunctions
    }

    return []
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  private getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, _baseName?: string): FakerMeta[] {
    const properties = baseSchema?.properties || {}
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(properties)
      .map((name) => {
        const validationFunctions: FakerMeta[] = []

        const schema = properties[name] as OpenAPIV3.SchemaObject

        validationFunctions.push(...this.getTypeFromSchema(schema, name))

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: FakerMeta[] = []

    if (additionalProperties) {
      const addionalValidationFunctions: FakerMeta[] =
        additionalProperties === true ? [{ keyword: fakerKeywords.any }] : this.getTypeFromSchema(additionalProperties as OpenAPIV3.SchemaObject)

      members.push({ keyword: fakerKeywords.catchall, args: addionalValidationFunctions })
    }

    return [{ keyword: fakerKeywords.object, args: objectMembers }]
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject, baseName?: string): FakerMeta[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (ref) {
      return [{ keyword: fakerKeywords.ref, args: ref.name ?? ref.propertyName }]
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.usedAliasNames)
    const propertyName = this.options.resolveName({ name: originalName, pluginName }) || originalName

    if (baseName && camelCase(originalName, { delimiter: '' }) === camelCase(baseName, { delimiter: '' })) {
      ref = this.refs[$ref] = {
        propertyName,
        originalName,
        name: uniqueId(propertyName),
      }

      return [{ keyword: fakerKeywords.ref, args: ref.name }]
    }

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
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined, baseName?: string): FakerMeta[] {
    if (!schema) {
      return [{ keyword: fakerKeywords.any }]
    }

    if (isReference(schema)) {
      return this.getRefAlias(schema, baseName)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: FakerMeta = {
        keyword: fakerKeywords.union,
        args: schema.oneOf.map((item) => {
          return this.getBaseTypeFromSchema(item)[0]
        }),
      }
      if (schemaWithoutOneOf.properties && union.args) {
        return [{ ...union, args: [...this.getBaseTypeFromSchema(schemaWithoutOneOf, baseName), ...union.args] }]
      }

      return [union]
    }

    if (schema.anyOf) {
      // TODO anyOf -> union
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      const and: FakerMeta = {
        keyword: fakerKeywords.and,
        args: schema.allOf.map((item) => {
          return this.getBaseTypeFromSchema(item)[0]
        }),
      }

      if (schemaWithoutAllOf.properties && and.args) {
        return [{ ...and, args: [...this.getBaseTypeFromSchema(schemaWithoutAllOf, baseName), ...and.args] }]
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

      return [
        {
          keyword: fakerKeywords.enum,
          args: [`[${[...new Set(schema.enum)].map((value: string) => `\`${value}\``).join(', ')}]`],
        },
      ]
    }

    if ('items' in schema) {
      // items -> array
      return [{ keyword: fakerKeywords.array, args: this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, baseName) }]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as OpenAPIV3.SchemaObject[]

      return [
        {
          keyword: fakerKeywords.tuple,
          args: prefixItems
            .map((item) => {
              // no baseType so we can fall back on an union when using enum
              return this.getBaseTypeFromSchema(item, undefined)?.[0]
            })
            .filter(Boolean),
        },
      ]
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema, baseName)
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
            baseName
          ),
          { keyword: fakerKeywords.null },
        ]
      }

      if (schema.type === fakerKeywords.number || schema.type === fakerKeywords.integer) {
        const min = schema.minimum ?? schema.minLength ?? undefined
        const max = schema.maximum ?? schema.maxLength ?? undefined

        return [{ keyword: fakerKeywords.number, args: { min, max } }]
      }

      if (schema.pattern) {
        return [{ keyword: fakerKeywords.matches, args: `/${schema.pattern}/` }]
      }

      if (schema.type !== 'string' && (schema.format === 'date-time' || baseName === 'date')) {
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
