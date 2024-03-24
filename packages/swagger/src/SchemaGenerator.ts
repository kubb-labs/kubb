import { Generator } from '@kubb/core'
import transformers, { pascalCase } from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'

import { getSchemaFactory } from './utils/getSchemaFactory.ts'
import { getSchemas } from './utils/getSchemas.ts'
import { isReference } from './utils/isReference.ts'
import { isKeyword, schemaKeywords } from './SchemaMapper.ts'

import type { KubbFile, Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams } from '@kubb/core'
import type { Oas, OpenAPIV3, SchemaObject } from './oas/index.ts'
import type { Schema, SchemaKeywordMapper, SchemaMapper } from './SchemaMapper.ts'
import type { ContentType, ImportMeta, OperationSchema, Refs } from './types.ts'

export type SchemaMethodResult<TFileMeta extends KubbFile.FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  oas: Oas
  pluginManager: PluginManager
  /**
   * Current plugin
   */
  plugin: Plugin<TPluginOptions>
  include?: Array<'schemas' | 'responses' | 'requestBodies'>
  contentType?: ContentType
  mode?: KubbFile.Mode
  output?: string
}

export type SchemaGeneratorOptions = {
  dateType: 'string' | 'date'
  unknownType: 'any' | 'unknown'
  enumType?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  enumSuffix?: string
  usedEnumNames?: Record<string, number>
  mapper?: SchemaMapper
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
    schema?: (schema: SchemaObject | undefined, baseName?: string) => Schema[] | undefined
  }
}

export type SchemaGeneratorBuildOptions = Omit<OperationSchema, 'name' | 'schema'>

export abstract class SchemaGenerator<
  TOptions extends SchemaGeneratorOptions = SchemaGeneratorOptions,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase,
> extends Generator<TOptions, Context<TOptions, TPluginOptions>> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}
  /**
   * @deprecated use ref in schema instead(it has path)
   */
  imports: ImportMeta[] = []

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}
  #usedEnumNames = this.options.usedEnumNames || {}
  /**
   * Cached schemas
   */
  #schemas?: Schema[] = undefined
  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  buildSchemas(schema: SchemaObject | undefined, baseName?: string): Schema[] {
    // use cached schemas so we have the same state for usedEnumNames
    if (this.#schemas) {
      return this.#schemas
    }

    this.#schemas = this.options.transformers.schema?.(schema, baseName) || this.#parseSchemaObject(schema, baseName) || []

    return this.#schemas
  }

  deepSearch<T extends keyof SchemaKeywordMapper>(schemas: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T][] {
    return SchemaGenerator.deepSearch<T>(schemas, keyword)
  }

  static deepSearch<T extends keyof SchemaKeywordMapper>(schemas: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T][] {
    const foundItems: SchemaKeywordMapper[T][] = []

    schemas?.forEach(schema => {
      if (schema.keyword === keyword) {
        foundItems.push(schema as SchemaKeywordMapper[T])
      }

      if (schema.keyword === schemaKeywords.object) {
        const subItem = schema as SchemaKeywordMapper['object']

        Object.values(subItem.args?.properties || {}).forEach(entrySchema => {
          foundItems.push(...SchemaGenerator.deepSearch<T>(entrySchema, keyword))
        })
      }

      if (schema.keyword === schemaKeywords.array) {
        const subItem = schema as SchemaKeywordMapper['array']

        subItem.args.items.forEach(entrySchema => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (schema.keyword === schemaKeywords.and) {
        const subItem = schema as SchemaKeywordMapper['and']

        subItem.args.forEach(entrySchema => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (schema.keyword === schemaKeywords.tuple) {
        const subItem = schema as SchemaKeywordMapper['tuple']

        subItem.args.forEach(entrySchema => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }
    })

    return foundItems
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
  #parseProperties(baseSchema?: SchemaObject, baseName?: string): Schema[] {
    const properties = baseSchema?.properties || {}
    const additionalProperties = baseSchema?.additionalProperties
    const required = baseSchema?.required

    const propertiesSchemas = Object.keys(properties)
      .map((name) => {
        const validationFunctions: Schema[] = []
        const schema = properties[name] as SchemaObject
        const resolvedName = this.context.pluginManager.resolveName({ name: `${baseName || ''} ${name}`, pluginKey: this.context.plugin.key, type: 'type' })

        const isRequired = Array.isArray(required) ? required && required.includes(name) : !!required
        const nullable = (schema.nullable ?? schema['x-nullable']) ?? false

        validationFunctions.push(...this.buildSchemas(schema, resolvedName))

        if (!isRequired && nullable) {
          validationFunctions.push({ keyword: schemaKeywords.nullish })
        } else if (!isRequired) {
          validationFunctions.push({ keyword: schemaKeywords.optional })
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})
    let additionalPropertieschemas: Schema[] = []
    const members: Schema[] = []

    if (additionalProperties) {
      additionalPropertieschemas = additionalProperties === true
        ? [{ keyword: this.#unknownReturn }]
        : this.buildSchemas(additionalProperties as SchemaObject)
    }

    members.push({ keyword: schemaKeywords.object, args: { properties: propertiesSchemas, additionalProperties: additionalPropertieschemas } })

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
      return [{ keyword: schemaKeywords.ref, args: { name: ref.propertyName, path: ref.path } }]
    }

    const fileName = this.context.pluginManager.resolveName({ name: originalName, pluginKey: this.context.plugin.key, type: 'file' })
    const path = this.context.pluginManager.resolvePath({ baseName: fileName, pluginKey: this.context.plugin.key })

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
      path,
    }

    if (path) {
      this.imports.push({
        ref,
        path,
        isTypeOnly: false,
      })
    }

    return [{ keyword: schemaKeywords.ref, args: { name: ref.propertyName, path: ref?.path } }]
  }

  #getParsedSchemaObject(schema?: SchemaObject) {
    const parsedSchema = getSchemaFactory(this.context.oas)(schema)
    return parsedSchema
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #parseSchemaObject(_schema: SchemaObject | undefined, baseName?: string): Schema[] {
    const { schema, version } = this.#getParsedSchemaObject(_schema)

    if (!schema) {
      return [{ keyword: this.#unknownReturn }]
    }

    const baseItems: Schema[] = []

    if (schema.default !== undefined && !Array.isArray(schema.default)) {
      if (typeof schema.default === 'string') {
        baseItems.push({ keyword: schemaKeywords.default, args: transformers.stringify(schema.default) })
      }
      if (typeof schema.default === 'boolean') {
        baseItems.push({ keyword: schemaKeywords.default, args: schema.default ?? false })
      }
    }

    if (schema.description) {
      baseItems.push({ keyword: schemaKeywords.describe, args: schema.description })
    }

    if (schema.type) {
      baseItems.push({ keyword: schemaKeywords.type, args: schema.type as string })
    }

    if (schema.format) {
      baseItems.push({ keyword: schemaKeywords.format, args: schema.format })
    }

    const nullable = (schema.nullable ?? schema['x-nullable']) ?? false

    if (nullable) {
      baseItems.push({ keyword: schemaKeywords.nullable })
    }

    if (schema.readOnly) {
      baseItems.push({ keyword: schemaKeywords.readOnly })
    }

    if (isReference(schema)) {
      return [...this.#getRefAlias(schema, baseName), ...baseItems]
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: Schema = {
        keyword: schemaKeywords.union,
        args: schema.oneOf
          .map((item) => {
            return item && this.buildSchemas(item as SchemaObject, baseName)[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== this.#unknownReturn
          }),
      }
      if (schemaWithoutOneOf.properties) {
        return [...this.buildSchemas(schemaWithoutOneOf, baseName), union, ...baseItems]
      }

      return [union, ...baseItems]
    }

    if (schema.anyOf) {
      // union
      const schemaWithoutAnyOf = { ...schema, anyOf: undefined }

      const union: Schema = {
        keyword: schemaKeywords.union,
        args: schema.anyOf
          .map((item) => {
            return item && this.buildSchemas(item as SchemaObject, baseName)[0]
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
        return [...this.buildSchemas(schemaWithoutAnyOf, baseName), union, ...baseItems]
      }

      return [union, ...baseItems]
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      const and: Schema = {
        keyword: schemaKeywords.and,
        args: schema.allOf
          .map((item) => {
            return item && this.buildSchemas(item as SchemaObject, baseName)[0]
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
            args: [...(and.args || []), ...this.buildSchemas(schemaWithoutAllOf, baseName)],
          },
          ...baseItems,
        ]
      }

      return [and, ...baseItems]
    }

    if (schema.enum) {
      const name = getUniqueName(pascalCase([baseName, this.options.enumSuffix].join(' ')), this.#usedEnumNames)
      const typeName = this.context.pluginManager.resolveName({ name, pluginKey: this.context.plugin.key, type: 'type' })

      // x-enumNames has priority
      const extensionEnums = ['x-enumNames', 'x-enum-varnames']
        .filter(extensionKey => extensionKey in schema)
        .map((extensionKey) => {
          return [{
            keyword: schemaKeywords.enum,
            args: {
              name,
              typeName,
              asConst: false,
              items: [...new Set(schema[extensionKey as keyof typeof schema] as string[])].map((name: string | number, index) => ({
                name: transformers.stringify(name),
                value: schema.enum![index] as string | number,
                format: transformers.isNumber(schema.enum![index]) ? 'number' : 'string',
              })),
            },
          }, ...baseItems]
        })

      if (schema.type === 'number' || schema.type === 'integer') {
        // we cannot use z.enum when enum type is number/integer
        const enumNames = extensionEnums[0]?.find(item => isKeyword(item, schemaKeywords.enum)) as SchemaKeywordMapper['enum']
        return [
          {
            keyword: schemaKeywords.enum,
            args: {
              name,
              typeName,
              asConst: true,
              items: enumNames?.args?.items
                ? [...new Set(enumNames.args.items)].map(({ name, value }) => ({
                  name,
                  value,
                  format: 'number',
                }))
                : [...new Set(schema.enum)].map((value: string) => {
                  return {
                    name: value,
                    value,
                    format: 'number',
                  }
                }),
            },
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
          args: {
            name,
            typeName,
            asConst: false,
            items: [...new Set(schema.enum)].map((value: string) => ({
              name: transformers.stringify(value),
              value,
              format: transformers.isNumber(value) ? 'number' : 'string',
            })),
          },
        },
        ...baseItems,
      ]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as SchemaObject[]

      return [
        {
          keyword: schemaKeywords.tuple,
          args: prefixItems
            .map((item) => {
              return this.buildSchemas(item, baseName)[0]
            })
            .filter(Boolean),
        },
      ]
    }

    if ('items' in schema) {
      const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
      const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined
      const items = this.buildSchemas(schema.items as SchemaObject, baseName)

      return [{
        keyword: schemaKeywords.array,
        args: {
          items,
          min,
          max,
        },
      }, ...baseItems]
    }

    if (schema.properties || schema.additionalProperties) {
      return [...this.#parseProperties(schema, baseName), ...baseItems]
    }

    if (version === '3.1' && 'const' in schema) {
      // const keyword takes precendence over the actual type.
      if (schema['const']) {
        return [{
          keyword: schemaKeywords.const,
          args: { name: schema['const'], format: typeof schema['const'] === 'number' ? 'number' : 'string', value: schema['const'] },
        }]
      } else {
        return [{ keyword: schemaKeywords.null }]
      }
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type, nullable] = schema.type as Array<OpenAPIV3.NonArraySchemaObjectType>

        return [
          ...this.buildSchemas(
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
        baseItems.unshift({ keyword: schemaKeywords.matches, args: schema.pattern })
      }

      if (['date', 'date-time'].some((item) => item === schema.format)) {
        if (this.options.dateType === 'date') {
          baseItems.unshift({ keyword: schemaKeywords.date })

          return baseItems
        } else {
          baseItems.unshift({ keyword: schemaKeywords.datetime })

          return baseItems
        }
      }

      if (schema.format === 'email') {
        baseItems.unshift({ keyword: schemaKeywords.email })
      }

      if (schema.format === 'uri' || schema.format === 'hostname') {
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
      return [{ keyword: schemaKeywords.blob }]
    }

    return [{ keyword: this.#unknownReturn }]
  }

  async build(): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas, contentType, include } = this.context

    const object = getSchemas({ oas, contentType, includes: include })

    const promises = Object.keys(object).reduce(
      (acc, name) => {
        if (!object[name]) {
          return acc
        }

        const promiseOperation = this.schema.call(this, name, object[name]!)

        if (promiseOperation) {
          acc.push(promiseOperation)
        }

        return acc
      },
      [] as SchemaMethodResult<TFileMeta>[],
    )

    const files = await Promise.all(promises)

    // using .flat because schemaGenerator[method] can return a array of files or just one file
    return files.flat().filter(Boolean)
  }

  /**
   * Schema
   */
  abstract schema(name: string, object: SchemaObject): SchemaMethodResult<TFileMeta>

  /**
   * Returns the source, in the future it an return a react component
   */
  abstract buildSource(
    name: string,
    object: SchemaObject | undefined,
    options?: SchemaGeneratorBuildOptions,
  ): string[]
}
