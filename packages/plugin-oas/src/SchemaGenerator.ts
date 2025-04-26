import { BaseGenerator, type FileMetaBase } from '@kubb/core'
import transformers, { pascalCase } from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'

import { isDiscriminator, isNullable, isReference } from '@kubb/oas'
import { isDeepEqual, isNumber, uniqueWith } from 'remeda'
import { isKeyword, schemaKeywords } from './SchemaMapper.ts'
import { getSchemaFactory } from './utils/getSchemaFactory.ts'
import { getSchemas } from './utils/getSchemas.ts'

import type { Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { Oas, OpenAPIV3, SchemaObject, contentType } from '@kubb/oas'
import type { Schema, SchemaKeywordMapper } from './SchemaMapper.ts'
import type { Generator } from './generator.tsx'
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
  unknownType: 'any' | 'unknown' | 'void'
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

export class SchemaGenerator<
  TOptions extends SchemaGeneratorOptions = SchemaGeneratorOptions,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends FileMetaBase = FileMetaBase,
> extends BaseGenerator<TOptions, Context<TOptions, TPluginOptions>> {
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

  deepSearch<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): Array<SchemaKeywordMapper[T]> {
    return SchemaGenerator.deepSearch<T>(tree, keyword)
  }

  find<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): SchemaKeywordMapper[T] | undefined {
    return SchemaGenerator.find<T>(tree, keyword)
  }

  static deepSearch<T extends keyof SchemaKeywordMapper>(tree: Schema[] | undefined, keyword: T): Array<SchemaKeywordMapper[T]> {
    const foundItems: SchemaKeywordMapper[T][] = []

    tree?.forEach((schema) => {
      if (schema.keyword === keyword) {
        foundItems.push(schema as SchemaKeywordMapper[T])
      }

      if (isKeyword(schema, schemaKeywords.object)) {
        Object.values(schema.args?.properties || {}).forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>(entrySchema, keyword))
        })

        Object.values(schema.args?.additionalProperties || {}).forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (isKeyword(schema, schemaKeywords.array)) {
        schema.args.items.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (isKeyword(schema, schemaKeywords.and)) {
        schema.args.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (isKeyword(schema, schemaKeywords.tuple)) {
        schema.args.items.forEach((entrySchema) => {
          foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
        })
      }

      if (isKeyword(schema, schemaKeywords.union)) {
        schema.args.forEach((entrySchema) => {
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

      if (isKeyword(schema, schemaKeywords.object)) {
        Object.values(schema.args?.properties || {}).forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>(entrySchema, keyword)
          }
        })

        Object.values(schema.args?.additionalProperties || {}).forEach((entrySchema) => {
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

      if (isKeyword(schema, schemaKeywords.array)) {
        schema.args.items.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }

      if (isKeyword(schema, schemaKeywords.and)) {
        schema.args.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }

      if (isKeyword(schema, schemaKeywords.tuple)) {
        schema.args.items.forEach((entrySchema) => {
          if (!foundItem) {
            foundItem = SchemaGenerator.find<T>([entrySchema], keyword)
          }
        })
      }

      if (isKeyword(schema, schemaKeywords.union)) {
        schema.args.forEach((entrySchema) => {
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
    if (options.unknownType === 'void') {
      return schemaKeywords.void
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
  #getRefAlias(schema: OpenAPIV3.ReferenceObject, name: string | undefined): Schema[] {
    const { $ref } = schema
    const ref = this.refs[$ref]

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.context.pluginManager.resolveName({
      name: originalName,
      pluginKey: this.context.plugin.key,
      type: 'function',
    })

    if (ref) {
      const dereferencedSchema = this.context.oas.dereferenceWithRef(schema)
      // pass name to getRefAlias and use that to find in discriminator.mapping value

      if (dereferencedSchema && isDiscriminator(dereferencedSchema)) {
        const [key] = Object.entries(dereferencedSchema.discriminator.mapping || {}).find(([_key, value]) => value === name) || []

        console.log(JSON.stringify({ dereferencedSchema, schema, $ref, name: `${name}` }, null, 2))

        if (!key) {
          throw new Error(`Can not find a key in discriminator ${JSON.stringify(schema)}`)
        }

        return [
          {
            keyword: schemaKeywords.and,
            args: [
              {
                keyword: schemaKeywords.ref,
                args: { name: ref.propertyName, $ref, path: ref.path, isImportable: !!this.context.oas.get($ref) },
              },
              {
                keyword: schemaKeywords.object,
                args: {
                  properties: {
                    [dereferencedSchema.discriminator.propertyName]: [
                      {
                        keyword: schemaKeywords.const,
                        args: {
                          name: key,
                          format: 'string',
                          value: key,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ] as Schema[]
      }

      return [
        {
          keyword: schemaKeywords.ref,
          args: { name: ref.propertyName, $ref, path: ref.path, isImportable: !!this.context.oas.get($ref) },
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
      extname: '.ts',
    })

    this.refs[$ref] = {
      propertyName,
      originalName,
      path: file.path,
    }

    return this.#getRefAlias(schema, name)
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
    const nullable = isNullable(schema)
    const defaultNullAndNullable = schema.default === null && nullable

    if (schema.default !== undefined && !defaultNullAndNullable && !Array.isArray(schema.default)) {
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

    if (schema.deprecated) {
      baseItems.push({
        keyword: schemaKeywords.deprecated,
      })
    }

    if (schema.description) {
      baseItems.push({
        keyword: schemaKeywords.describe,
        args: schema.description,
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
        ...this.#getRefAlias(schema, name),
        schema.description && {
          keyword: schemaKeywords.describe,
          args: schema.description,
        },
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
            // first item, this will be ref
            return item && this.parse({ schema: item as SchemaObject })[0]
          })
          .filter(Boolean)
          .filter((item) => !isKeyword(item, schemaKeywords.unknown)),
      }

      const discriminator = this.context.oas.getDiscriminator(schema)

      if (discriminator) {
        const objectPropertySchema = SchemaGenerator.find(this.parse({ schema: schemaWithoutOneOf, name, parentName }), schemaKeywords.object)

        union.args = [
          ...union.args.map((arg) => {
            const isRef = isKeyword(arg, schemaKeywords.ref)

            if (isRef) {
              const [key] = Object.entries(discriminator?.mapping || {}).find(([_key, value]) => value === arg.args.$ref) || []

              if (!key) {
                throw new Error(`Can not find a key in discriminator ${JSON.stringify(schema)}`)
              }

              return {
                keyword: schemaKeywords.and,
                args: [
                  arg,
                  {
                    keyword: schemaKeywords.object,
                    args: {
                      properties: {
                        ...(objectPropertySchema?.args?.properties || {}),
                        [discriminator.propertyName]: [
                          {
                            keyword: schemaKeywords.const,
                            args: {
                              name: key,
                              format: 'string',
                              value: key,
                            },
                          },
                          //enum and literal will conflict
                          ...(objectPropertySchema?.args?.properties[discriminator.propertyName] || []),
                        ].filter((item) => !isKeyword(item, schemaKeywords.enum)),
                      },
                    },
                  },
                ],
              }
            }

            return arg
          }),
        ]

        return [union, ...baseItems]
      }

      if (schemaWithoutOneOf.properties) {
        const propertySchemas = this.parse({ schema: schemaWithoutOneOf, name, parentName })

        union.args = [
          ...union.args.map((arg) => {
            return {
              keyword: schemaKeywords.and,
              args: [arg, ...propertySchemas],
            }
          }),
        ]

        return [union, ...baseItems]
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
            // first item, this will be ref
            return item && this.parse({ schema: item as SchemaObject })[0]
          })
          .filter(Boolean)
          .filter((item) => !isKeyword(item, schemaKeywords.unknown))
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

      const discriminator = this.context.oas.getDiscriminator(schema)

      if (discriminator) {
        const objectPropertySchema = SchemaGenerator.find(this.parse({ schema: schemaWithoutAnyOf, name, parentName }), schemaKeywords.object)

        union.args = [
          ...union.args.map((arg) => {
            const isRef = isKeyword(arg, schemaKeywords.ref)

            if (isRef) {
              const [key] = Object.entries(discriminator.mapping || {}).find(([_key, value]) => value === arg.args.$ref) || []

              if (!key) {
                throw new Error(`Can not find a key in discriminator ${JSON.stringify(schema)}`)
              }

              return {
                keyword: schemaKeywords.and,
                args: [
                  arg,
                  {
                    keyword: schemaKeywords.object,
                    args: {
                      properties: {
                        ...(objectPropertySchema?.args?.properties || {}),
                        [discriminator.propertyName]: [
                          {
                            keyword: schemaKeywords.const,
                            args: {
                              name: key,
                              format: 'string',
                              value: key,
                            },
                          },
                          //enum and literal will conflict
                          ...(objectPropertySchema?.args?.properties[discriminator.propertyName] || []),
                        ].filter((item) => !isKeyword(item, schemaKeywords.enum)),
                      },
                    },
                  },
                ],
              }
            }

            return arg
          }),
        ]
      }

      if (schemaWithoutAnyOf.properties) {
        const propertySchemas = this.parse({ schema: schemaWithoutAnyOf, name, parentName })

        union.args = [
          ...union.args.map((arg) => {
            return {
              keyword: schemaKeywords.and,
              args: [arg, ...propertySchemas],
            }
          }),
        ]

        return [union, ...baseItems]
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
            return item && this.parse({ schema: item as SchemaObject })[0]
          })
          .filter(Boolean)
          .filter((item) => !isKeyword(item, schemaKeywords.unknown)),
      }

      if (schemaWithoutAllOf.required) {
        // TODO use of Required ts helper instead
        const schemas = schema.allOf
          .map((item) => {
            if (isReference(item)) {
              return this.context.oas.get(item.$ref) as SchemaObject
            }
          })
          .filter(Boolean)

        const items = schemaWithoutAllOf.required
          .filter((key) => {
            // filter out keys that are already part of the properties(reduce duplicated keys(https://github.com/kubb-labs/kubb/issues/1492)
            if (schemaWithoutAllOf.properties) {
              return !Object.keys(schemaWithoutAllOf.properties).includes(key)
            }

            // schema should include required fields when necessary https://github.com/kubb-labs/kubb/issues/1522
            return true
          })
          .map((key) => {
            const schema = schemas.find((item) => item.properties && Object.keys(item.properties).find((propertyKey) => propertyKey === key))

            if (schema?.properties?.[key]) {
              return {
                ...schema,
                properties: {
                  [key]: schema.properties[key],
                },
                required: [key],
              }
            }
          })
          .filter(Boolean)

        and.args = [...(and.args || []), ...items.flatMap((item) => this.parse({ schema: item as SchemaObject, name, parentName }))]
      }

      if (schemaWithoutAllOf.properties) {
        and.args = [...(and.args || []), ...this.parse({ schema: schemaWithoutAllOf, name, parentName })]
      }

      return [and, ...baseItems]
    }

    if (schema.enum) {
      if (options.enumSuffix === '') {
        throw new Error('EnumSuffix set to an empty string does not work')
      }

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
          return baseItems
        case 'email':
        case 'idn-email':
          baseItems.unshift({ keyword: schemaKeywords.email })
          return baseItems
        case 'uri':
        case 'ipv4':
        case 'ipv6':
        case 'uri-reference':
        case 'hostname':
        case 'idn-hostname':
          baseItems.unshift({ keyword: schemaKeywords.url })
          return baseItems
        // case 'duration':
        // case 'json-pointer':
        // case 'relative-json-pointer':
        default:
          // formats not yet implemented: ignore.
          break
      }
    }

    if (schema.pattern) {
      baseItems.unshift({
        keyword: schemaKeywords.matches,
        args: schema.pattern,
      })

      return baseItems
    }

    // type based logic
    if ('items' in schema || schema.type === ('array' as 'string')) {
      const min = schema.minimum ?? schema.minLength ?? schema.minItems ?? undefined
      const max = schema.maximum ?? schema.maxLength ?? schema.maxItems ?? undefined
      const items = this.parse({ schema: 'items' in schema ? (schema.items as SchemaObject) : [], name, parentName })
      const unique = !!schema.uniqueItems

      return [
        {
          keyword: schemaKeywords.array,
          args: {
            items,
            min,
            max,
            unique,
          },
        },
        ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max),
      ]
    }

    if (schema.properties || schema.additionalProperties) {
      if (isDiscriminator(schema)) {
        // override schema to set type to be based on discriminator mapping, use of enum to convert type string to type 'mapping1' | 'mapping2'
        const schemaOverriden = Object.keys(schema.properties || {}).reduce((acc, propertyName) => {
          if (acc.properties?.[propertyName] && propertyName === schema.discriminator.propertyName) {
            return {
              ...acc,
              properties: {
                ...acc.properties,
                [propertyName]: {
                  ...((acc.properties[propertyName] as any) || {}),
                  enum: schema.discriminator.mapping ? Object.keys(schema.discriminator.mapping) : undefined,
                },
              },
            }
          }

          return acc
        }, schema || {}) as SchemaObject

        return [
          ...this.#parseProperties({
            schema: schemaOverriden,
            name,
          }),
          ...baseItems,
        ]
      }

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

  async build(...generators: Array<Generator<TPluginOptions>>): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas, contentType, include } = this.context

    const schemas = getSchemas({ oas, contentType, includes: include })

    const promises = Object.entries(schemas).reduce((acc, [name, value]) => {
      if (!value) {
        return acc
      }

      const options = this.#getOptions({ name })
      const promiseOperation = this.schema.call(this, name, value, {
        ...this.options,
        ...options,
      })

      if (promiseOperation) {
        acc.push(promiseOperation)
      }

      generators?.forEach((generator) => {
        const tree = this.parse({ schema: value, name: name })

        const promise = generator.schema?.({
          instance: this,
          schema: {
            name,
            value,
            tree,
          },
          options: {
            ...this.options,
            ...options,
          },
        } as any) as Promise<Array<KubbFile.File<TFileMeta>>>

        if (promise) {
          acc.push(promise)
        }
      })

      return acc
    }, [] as SchemaMethodResult<TFileMeta>[])

    const files = await Promise.all(promises)

    // using .flat because schemaGenerator[method] can return an array of files or just one file
    return files.flat().filter(Boolean)
  }

  /**
   * Schema
   */
  async schema(_name: string, _object: SchemaObject, _options: TOptions): SchemaMethodResult<TFileMeta> {
    return []
  }
}
