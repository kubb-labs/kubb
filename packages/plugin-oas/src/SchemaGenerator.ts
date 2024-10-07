import { type FileMetaBase, Generator } from '@kubb/core'
import transformers, { pascalCase } from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'

import { isReference } from '@kubb/oas'
import { isDeepEqual, isNumber, uniqueWith } from 'remeda'
import { isKeyword, schemaKeywords } from './SchemaMapper.ts'
import { getSchemaFactory } from './utils/getSchemaFactory.ts'
import { getSchemas } from './utils/getSchemas.ts'

import type { Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { Oas, OpenAPIV3, SchemaObject, contentType } from '@kubb/oas'
import type { Schema, SchemaKeywordMapper } from './SchemaMapper.ts'
import type { OperationSchema, Override, Refs } from './types.ts'

export type GetSchemaGeneratorOptions<T extends SchemaGenerator<any, any, any>> = T extends SchemaGenerator<infer Options, any, any> ? Options : never

export type SchemaMethodResult<TFileMeta extends FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  oas: Oas
  pluginManager: PluginManager
  /**
   * Current plugin
   */
  plugin: Plugin<TPluginOptions>
  mode: KubbFile.Mode
  include?: Array<'schemas' | 'responses' | 'requestBodies'>
  override: Array<Override<TOptions>> | undefined
  contentType?: contentType
  output?: string
}

export type SchemaGeneratorOptions = {
  dateType: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  unknownType: 'any' | 'unknown'
  enumType?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  enumSuffix?: string
  usedEnumNames?: Record<string, number>
  mapper?: Record<string, string>
  typed?: boolean
  transformers: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
    /**
     * Receive schema and name(propertName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (schemaProps: SchemaProps, defaultSchemas: Schema[]) => Schema[] | undefined
  }
}

export type SchemaGeneratorBuildOptions = Omit<OperationSchema, 'name' | 'schema'>

type SchemaProps = {
  schema?: SchemaObject
  name?: string
  parentName?: string
}

export abstract class SchemaGenerator<
  TOptions extends SchemaGeneratorOptions = SchemaGeneratorOptions,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends FileMetaBase = FileMetaBase,
> extends Generator<TOptions, Context<TOptions, TPluginOptions>> {
  // Collect the types of all referenced schemas, so we can export them later
  refs: Refs = {}

  // Keep track of already used type aliases
  #usedAliasNames: Record<string, number> = {}

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  parse(props: SchemaProps): Schema[] {
    const options = this.#getOptions(props)

    const defaultSchemas = this.#parseSchemaObject(props)
    const schemas = options.transformers?.schema?.(props, defaultSchemas) || defaultSchemas || []

    return uniqueWith(schemas, isDeepEqual)
  }

  deepSearch<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T][] {
    return SchemaGenerator.deepSearch<T>(tree, keyword)
  }

  find<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T] | undefined {
    return SchemaGenerator.find<T>(tree, keyword)
  }

  static deepSearch<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T][] {
    const foundItems: SchemaKeywordMapper[T][] = []

    tree?.forEach((schema) => {
      if (schema.keyword === keyword) {
        foundItems.push(schema as SchemaKeywordMapper[T])
      }

      if (schema.keyword === schemaKeywords.object) {
        const subItem = schema as SchemaKeywordMapper['object']

        Object.values(subItem.args?.properties || {}).forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>(entrySchema, keyword))
        })

        Object.values(subItem.args?.additionalProperties || {}).forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (schema.keyword === schemaKeywords.array) {
        const subItem = schema as SchemaKeywordMapper['array']

        subItem.args.items.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (schema.keyword === schemaKeywords.and) {
        const subItem = schema as SchemaKeywordMapper['and']

        subItem.args.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (schema.keyword === schemaKeywords.tuple) {
        const subItem = schema as SchemaKeywordMapper['tuple']

        subItem.args.items.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (schema.keyword === schemaKeywords.union) {
        const subItem = schema as SchemaKeywordMapper['union']

        subItem.args.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }
    })

    return foundItems
  }

  static findInObject<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T] | undefined {
    let foundItem: SchemaKeywordMapper[T] | undefined = undefined

    tree?.forEach((schema) => {
      if (!foundItem && schema.keyword === keyword) {
        foundItem = schema as SchemaKeywordMapper[T]
      }

      if (schema.keyword === schemaKeywords.object) {
        const subItem = schema as SchemaKeywordMapper['object']

        Object.values(subItem.args?.properties || {}).forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>(entrySchema, keyword)
          }
        })

        Object.values(subItem.args?.additionalProperties || {}).forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }
    })

    return foundItem
  }

  static find<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T] | undefined {
    let foundItem: SchemaKeywordMapper[T] | undefined = undefined

    tree?.forEach((schema) => {
      if (!foundItem && schema.keyword === keyword) {
        foundItem = schema as SchemaKeywordMapper[T]
      }

      if (schema.keyword === schemaKeywords.array) {
        const subItem = schema as SchemaKeywordMapper['array']

        subItem.args.items.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }

      if (schema.keyword === schemaKeywords.and) {
        const subItem = schema as SchemaKeywordMapper['and']

        subItem.args.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }

      if (schema.keyword === schemaKeywords.tuple) {
        const subItem = schema as SchemaKeywordMapper['tuple']

        subItem.args.items.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }

      if (schema.keyword === schemaKeywords.union) {
        const subItem = schema as SchemaKeywordMapper['union']

        subItem.args.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }
    })

    return foundItem
  }

  #getUsedEnumNames(props: SchemaProps) {
    const options = this.#getOptions(props)

    return options.usedEnumNames || {}
  }

  #getOptions({ name }: SchemaProps): Partial<TOptions> {
    const { override = [] } = this.context

    return {
      ...this.options,
      ...(override.find(({ pattern, type }) => {
        if (name && type === 'schemaName') {
          return !!name.match(pattern)
        }

        return false
      })?.options || {}),
    }
  }

  #getUnknownReturn(props: SchemaProps) {
    const options = this.#getOptions(props)

    if (options.unknownType === 'any') {
      return schemaKeywords.any
    }

    return schemaKeywords.unknown
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #parseProperties({ schema, name }: SchemaProps): Schema[] {
    const properties = schema?.properties || {}
    const additionalProperties = schema?.additionalProperties
    const required = schema?.required

    const propertiesSchemas = Object.keys(properties)
      .map((propertyName) => {
        const validationFunctions: Schema[] = []
        const propertySchema = properties[propertyName] as SchemaObject

        const isRequired = Array.isArray(required) ? required?.includes(propertyName) : !!required
        const nullable = propertySchema.nullable ?? propertySchema['x-nullable'] ?? false

        validationFunctions.push(...this.parse({ schema: propertySchema, name: propertyName, parentName: name }))

        validationFunctions.push({
          keyword: schemaKeywords.name,
          args: propertyName,
        })

        if (!isRequired && nullable) {
          validationFunctions.push({ keyword: schemaKeywords.nullish })
        } else if (!isRequired) {
          validationFunctions.push({ keyword: schemaKeywords.optional })
        }

        return {
          [propertyName]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})
    let additionalPropertiesSchemas: Schema[] = []

    if (additionalProperties) {
      additionalPropertiesSchemas =
        additionalProperties === true || !Object.keys(additionalProperties).length
          ? [{ keyword: this.#getUnknownReturn({ schema, name }) }]
          : this.parse({ schema: additionalProperties as SchemaObject, parentName: name })
    }

    return [
      {
        keyword: schemaKeywords.object,
        args: {
          properties: propertiesSchemas,
          additionalProperties: additionalPropertiesSchemas,
        },
      },
    ]
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(obj: OpenAPIV3.ReferenceObject): Schema[] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.context.pluginManager.resolveName({
      name: originalName,
      pluginKey: this.context.plugin.key,
      type: 'function',
    })

    if (ref) {
      return [
        {
          keyword: schemaKeywords.ref,
          args: { name: ref.propertyName, path: ref.path },
        },
      ]
    }

    const fileName = this.context.pluginManager.resolveName({
      name: originalName,
      pluginKey: this.context.plugin.key,
      type: 'file',
    })
    const file = this.context.pluginManager.getFile({
      name: fileName,
      pluginKey: this.context.plugin.key,
      extName: '.ts',
    })

    ref = this.refs[$ref] = {
      propertyName,
      originalName,
      path: file.path,
    }

    return [
      {
        keyword: schemaKeywords.ref,
        args: { name: ref.propertyName, path: ref?.path },
      },
    ]
  }

  #getParsedSchemaObject(schema?: SchemaObject) {
    const parsedSchema = getSchemaFactory(this.context.oas)(schema)
    return parsedSchema
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #parseSchemaObject({ schema: _schema, name, parentName }: SchemaProps): Schema[] {
    const options = this.#getOptions({ schema: _schema, name })
    const unknownReturn = this.#getUnknownReturn({ schema: _schema, name })
    const { schema, version } = this.#getParsedSchemaObject(_schema)
    if (!schema) {
      return [{ keyword: unknownReturn }]
    }

    const baseItems: Schema[] = [
      {
        keyword: schemaKeywords.schema,
        args: {
          type: schema.type as any,
          format: schema.format,
        },
      },
    ]
    const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
    const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined
    const nullable = schema.nullable ?? schema['x-nullable'] ?? false

    if (schema.default !== undefined && !Array.isArray(schema.default)) {
      if (typeof schema.default === 'string') {
        baseItems.push({
          keyword: schemaKeywords.default,
          args: transformers.stringify(schema.default),
        })
      } else if (typeof schema.default === 'boolean') {
        baseItems.push({
          keyword: schemaKeywords.default,
          args: schema.default ?? false,
        })
      } else {
        baseItems.push({
          keyword: schemaKeywords.default,
          args: schema.default,
        })
      }
    }

    if (schema.description) {
      baseItems.push({
        keyword: schemaKeywords.describe,
        args: schema.description,
      })
    }

    if (schema.pattern) {
      baseItems.unshift({
        keyword: schemaKeywords.matches,
        args: schema.pattern,
      })
    }

    if (max !== undefined) {
      baseItems.unshift({ keyword: schemaKeywords.max, args: max })
    }

    if (min !== undefined) {
      baseItems.unshift({ keyword: schemaKeywords.min, args: min })
    }

    if (nullable) {
      baseItems.push({ keyword: schemaKeywords.nullable })
    }

    if (schema.type && Array.isArray(schema.type)) {
      const [_schema, nullable] = schema.type

      if (nullable === 'null') {
        baseItems.push({ keyword: schemaKeywords.nullable })
      }
    }

    if (schema.readOnly) {
      baseItems.push({ keyword: schemaKeywords.readOnly })
    }

    if (schema.writeOnly) {
      baseItems.push({ keyword: schemaKeywords.writeOnly })
    }

    if (isReference(schema)) {
      return [
        ...this.#getRefAlias(schema),
        nullable && { keyword: schemaKeywords.nullable },
        schema.readOnly && { keyword: schemaKeywords.readOnly },
        schema.writeOnly && { keyword: schemaKeywords.writeOnly },
        {
          keyword: schemaKeywords.schema,
          args: {
            type: schema.type as any,
            format: schema.format,
          },
        },
      ].filter(Boolean)
    }

    if (schema.oneOf) {
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      const union: Schema = {
        keyword: schemaKeywords.union,
        args: schema.oneOf
          .map((item) => {
            return item && this.parse({ schema: item as SchemaObject, name, parentName })[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== unknownReturn
          }),
      }
      if (schemaWithoutOneOf.properties) {
        const propertySchemas = this.parse({ schema: schemaWithoutOneOf, name, parentName })

        return [
          {
            ...union,
            args: union.args.map((arg) => {
              return {
                keyword: schemaKeywords.and,
                args: [arg, ...propertySchemas],
              }
            }),
          },
          ...baseItems,
        ]
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
            return item && this.parse({ schema: item as SchemaObject, name, parentName })[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== unknownReturn
          })
          .map((item) => {
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
        return [...this.parse({ schema: schemaWithoutAnyOf, name, parentName }), union, ...baseItems]
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
            return item && this.parse({ schema: item as SchemaObject, name, parentName })[0]
          })
          .filter(Boolean)
          .filter((item) => {
            return item && item.keyword !== unknownReturn
          }),
      }

      if (schemaWithoutAllOf.properties) {
        return [
          {
            ...and,
            args: [...(and.args || []), ...this.parse({ schema: schemaWithoutAllOf, name, parentName })],
          },
          ...baseItems,
        ]
      }

      return [and, ...baseItems]
    }

    if (schema.enum) {
      const enumName = getUniqueName(pascalCase([parentName, name, options.enumSuffix].join(' ')), this.#getUsedEnumNames({ schema, name }))
      const typeName = this.context.pluginManager.resolveName({
        name: enumName,
        pluginKey: this.context.plugin.key,
        type: 'type',
      })

      const nullableEnum = schema.enum.includes(null)
      if (nullableEnum) {
        baseItems.push({ keyword: schemaKeywords.nullable })
      }
      const filteredValues = schema.enum.filter((value) => value !== null)

      // x-enumNames has priority
      const extensionEnums = ['x-enumNames', 'x-enum-varnames']
        .filter((extensionKey) => extensionKey in schema)
        .map((extensionKey) => {
          return [
            {
              keyword: schemaKeywords.enum,
              args: {
                name,
                typeName,
                asConst: false,
                items: [...new Set(schema[extensionKey as keyof typeof schema] as string[])].map((name: string | number, index) => ({
                  name: transformers.stringify(name),
                  value: schema.enum?.[index] as string | number,
                  format: isNumber(schema.enum?.[index]) ? 'number' : 'string',
                })),
              },
            },
            ...baseItems.filter(
              (item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max && item.keyword !== schemaKeywords.matches,
            ),
          ]
        })

      if (schema.type === 'number' || schema.type === 'integer') {
        // we cannot use z.enum when enum type is number/integer
        const enumNames = extensionEnums[0]?.find((item) => isKeyword(item, schemaKeywords.enum)) as unknown as SchemaKeywordMapper['enum']
        return [
          {
            keyword: schemaKeywords.enum,
            args: {
              name: enumName,
              typeName,
              asConst: true,
              items: enumNames?.args?.items
                ? [...new Set(enumNames.args.items)].map(({ name, value }) => ({
                    name,
                    value,
                    format: 'number',
                  }))
                : [...new Set(filteredValues)].map((value: string) => {
                    return {
                      name: value,
                      value,
                      format: 'number',
                    }
                  }),
            },
          },
          ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max && item.keyword !== schemaKeywords.matches),
        ]
      }

      if (schema.type === 'boolean') {
        // we cannot use z.enum when enum type is boolean
        const enumNames = extensionEnums[0]?.find((item) => isKeyword(item, schemaKeywords.enum)) as unknown as SchemaKeywordMapper['enum']
        return [
          {
            keyword: schemaKeywords.enum,
            args: {
              name: enumName,
              typeName,
              asConst: true,
              items: enumNames?.args?.items
                ? [...new Set(enumNames.args.items)].map(({ name, value }) => ({
                    name,
                    value,
                    format: 'boolean',
                  }))
                : [...new Set(filteredValues)].map((value: string) => {
                    return {
                      name: value,
                      value,
                      format: 'boolean',
                    }
                  }),
            },
          },
          ...baseItems.filter((item) => item.keyword !== schemaKeywords.matches),
        ]
      }

      if (extensionEnums.length > 0 && extensionEnums[0]) {
        return extensionEnums[0]
      }

      return [
        {
          keyword: schemaKeywords.enum,
          args: {
            name: enumName,
            typeName,
            asConst: false,
            items: [...new Set(filteredValues)].map((value: string) => ({
              name: transformers.stringify(value),
              value,
              format: isNumber(value) ? 'number' : 'string',
            })),
          },
        },
        ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max && item.keyword !== schemaKeywords.matches),
      ]
    }

    if ('prefixItems' in schema) {
      const prefixItems = schema.prefixItems as SchemaObject[]
      const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
      const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined

      return [
        {
          keyword: schemaKeywords.tuple,
          args: {
            min,
            max,
            items: prefixItems
              .map((item) => {
                return this.parse({ schema: item, name, parentName })[0]
              })
              .filter(Boolean),
          },
        },
        ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max),
      ]
    }

    if (version === '3.1' && 'const' in schema) {
      // const keyword takes precendence over the actual type.
      if (schema['const']) {
        return [
          {
            keyword: schemaKeywords.const,
            args: {
              name: schema['const'],
              format: typeof schema['const'] === 'number' ? 'number' : 'string',
              value: schema['const'],
            },
          },
          ...baseItems,
        ]
      }
      return [{ keyword: schemaKeywords.null }]
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
        case 'binary':
          baseItems.push({ keyword: schemaKeywords.blob })
          return baseItems
        case 'date-time':
          if (options.dateType) {
            if (options.dateType === 'date') {
              baseItems.unshift({ keyword: schemaKeywords.date, args: { type: 'date' } })

              return baseItems
            }

            if (options.dateType === 'stringOffset') {
              baseItems.unshift({ keyword: schemaKeywords.datetime, args: { offset: true } })
              return baseItems
            }

            if (options.dateType === 'stringLocal') {
              baseItems.unshift({ keyword: schemaKeywords.datetime, args: { local: true } })
              return baseItems
            }

            baseItems.unshift({ keyword: schemaKeywords.datetime, args: { offset: false } })

            return baseItems
          }
          break
        case 'date':
          if (options.dateType) {
            if (options.dateType === 'date') {
              baseItems.unshift({ keyword: schemaKeywords.date, args: { type: 'date' } })

              return baseItems
            }

            baseItems.unshift({ keyword: schemaKeywords.date, args: { type: 'string' } })

            return baseItems
          }
          break
        case 'time':
          if (options.dateType) {
            if (options.dateType === 'date') {
              baseItems.unshift({ keyword: schemaKeywords.time, args: { type: 'date' } })

              return baseItems
            }

            baseItems.unshift({ keyword: schemaKeywords.time, args: { type: 'string' } })

            return baseItems
          }
          break
        case 'uuid':
          baseItems.unshift({ keyword: schemaKeywords.uuid })
          break
        case 'email':
        case 'idn-email':
          baseItems.unshift({ keyword: schemaKeywords.email })
          break
        case 'uri':
        case 'ipv4':
        case 'ipv6':
        case 'uri-reference':
        case 'hostname':
        case 'idn-hostname':
          baseItems.unshift({ keyword: schemaKeywords.url })
          break
        // case 'duration':
        // case 'json-pointer':
        // case 'relative-json-pointer':
        default:
          // formats not yet implemented: ignore.
          break
      }
    }

    // type based logic
    if ('items' in schema || schema.type === ('array' as 'string')) {
      const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
      const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined
      const items = this.parse({ schema: 'items' in schema ? (schema.items as SchemaObject) : [], name, parentName })

      return [
        {
          keyword: schemaKeywords.array,
          args: {
            items,
            min,
            max,
          },
        },
        ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max),
      ]
    }

    if (schema.properties || schema.additionalProperties) {
      return [...this.#parseProperties({ schema, name }), ...baseItems]
    }

    if (schema.type) {
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type] = schema.type as Array<OpenAPIV3.NonArraySchemaObjectType>

        return [
          ...this.parse({
            schema: {
              ...schema,
              type,
            },
            name,
            parentName,
          }),
          ...baseItems,
        ].filter(Boolean)
      }

      if (!['boolean', 'object', 'number', 'string', 'integer', 'null'].includes(schema.type)) {
        this.context.pluginManager.logger.emit('warning', `Schema type '${schema.type}' is not valid for schema ${parentName}.${name}`)
      }

      // 'string' | 'number' | 'integer' | 'boolean'
      return [{ keyword: schema.type }, ...baseItems]
    }

    return [{ keyword: unknownReturn }]
  }

  async build(): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas, contentType, include } = this.context

    oas.resolveDiscriminators()

    const schemas = getSchemas({ oas, contentType, includes: include })

    const promises = Object.entries(schemas).reduce((acc, [name, schema]) => {
      const options = this.#getOptions({ name })
      const promiseOperation = this.schema.call(this, name, schema, {
        ...this.options,
        ...options,
      })

      if (promiseOperation) {
        acc.push(promiseOperation)
      }

      return acc
    }, [] as SchemaMethodResult<TFileMeta>[])

    const files = await Promise.all(promises)

    // using .flat because schemaGenerator[method] can return a array of files or just one file
    return files.flat().filter(Boolean)
  }

  /**
   * Schema
   */
  abstract schema(name: string, object: SchemaObject, options: TOptions): SchemaMethodResult<TFileMeta>
}
