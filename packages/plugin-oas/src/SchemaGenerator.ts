import type { Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams } from '@kubb/core'
import { BaseGenerator, type FileMetaBase } from '@kubb/core'
import type { KubbFile } from '@kubb/core/fs'
import transformers, { pascalCase } from '@kubb/core/transformers'
import { getUniqueName } from '@kubb/core/utils'
import type { contentType, Oas, OpenAPIV3, SchemaObject } from '@kubb/oas'
import { isDiscriminator, isNullable, isReference } from '@kubb/oas'
import pLimit from 'p-limit'
import { isDeepEqual, isNumber, uniqueWith } from 'remeda'
import type { Generator } from './generator.tsx'
import type { Schema, SchemaKeywordMapper } from './SchemaMapper.ts'
import { isKeyword, schemaKeywords } from './SchemaMapper.ts'
import type { OperationSchema, Override, Refs } from './types.ts'
import { getSchemaFactory } from './utils/getSchemaFactory.ts'
import { getSchemas } from './utils/getSchemas.ts'

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
  emptySchemaType: 'any' | 'unknown' | 'void'
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
  schemaObject?: SchemaObject
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
    let foundItem: SchemaKeywordMapper[T] | undefined

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
    let foundItem: SchemaKeywordMapper[T] | undefined

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

  static combineObjects(tree: Schema[] | undefined): Schema[] {
    if (!tree) {
      return []
    }

    return tree.map((schema) => {
      if (!isKeyword(schema, schemaKeywords.and)) {
        return schema
      }

      let mergedProperties: Record<string, Schema[]> | null = null
      let mergedAdditionalProps: Schema[] = []

      const newArgs: Schema[] = []

      for (const subSchema of schema.args) {
        if (isKeyword(subSchema, schemaKeywords.object)) {
          const { properties = {}, additionalProperties = [] } = subSchema.args ?? {}

          if (!mergedProperties) {
            mergedProperties = {}
          }

          for (const [key, value] of Object.entries(properties)) {
            mergedProperties[key] = value
          }

          if (additionalProperties.length > 0) {
            mergedAdditionalProps = additionalProperties
          }
        } else {
          newArgs.push(subSchema)
        }
      }

      if (mergedProperties) {
        newArgs.push({
          keyword: schemaKeywords.object,
          args: {
            properties: mergedProperties,
            additionalProperties: mergedAdditionalProps,
          },
        })
      }

      return {
        keyword: schemaKeywords.and,
        args: newArgs,
      }
    })
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

  #getUnknownType(props: SchemaProps) {
    const options = this.#getOptions(props)

    if (options.unknownType === 'any') {
      return schemaKeywords.any
    }
    if (options.unknownType === 'void') {
      return schemaKeywords.void
    }

    return schemaKeywords.unknown
  }

  #getEmptyType(props: SchemaProps) {
    const options = this.#getOptions(props)

    if (options.emptySchemaType === 'any') {
      return schemaKeywords.any
    }
    if (options.emptySchemaType === 'void') {
      return schemaKeywords.void
    }

    return schemaKeywords.unknown
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  #parseProperties({ schemaObject, name }: SchemaProps): Schema[] {
    const properties = schemaObject?.properties || {}
    const additionalProperties = schemaObject?.additionalProperties
    const required = schemaObject?.required

    const propertiesSchemas = Object.keys(properties)
      .map((propertyName) => {
        const validationFunctions: Schema[] = []
        const propertySchema = properties[propertyName] as SchemaObject

        const isRequired = Array.isArray(required) ? required?.includes(propertyName) : !!required
        const nullable = propertySchema.nullable ?? propertySchema['x-nullable'] ?? false

        validationFunctions.push(...this.parse({ schemaObject: propertySchema, name: propertyName, parentName: name }))

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
          ? [{ keyword: this.#getUnknownType({ schemaObject, name }) }]
          : this.parse({ schemaObject: additionalProperties as SchemaObject, parentName: name })
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
  #getRefAlias(schemaObject: OpenAPIV3.ReferenceObject, name: string | undefined): Schema[] {
    const { $ref } = schemaObject
    const ref = this.refs[$ref]

    if (ref) {
      const dereferencedSchema = this.context.oas.dereferenceWithRef(schemaObject)
      // pass name to getRefAlias and use that to find in discriminator.mapping value

      if (dereferencedSchema && isDiscriminator(dereferencedSchema)) {
        const [key] = Object.entries(dereferencedSchema.discriminator.mapping || {}).find(([_key, value]) => value.replace(/.+\//, '') === name) || []

        if (key) {
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
      }

      return [
        {
          keyword: schemaKeywords.ref,
          args: { name: ref.propertyName, $ref, path: ref.path, isImportable: !!this.context.oas.get($ref) },
        },
      ]
    }

    const originalName = getUniqueName($ref.replace(/.+\//, ''), this.#usedAliasNames)
    const propertyName = this.context.pluginManager.resolveName({
      name: originalName,
      pluginKey: this.context.plugin.key,
      type: 'function',
    })

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

    return this.#getRefAlias(schemaObject, name)
  }

  #getParsedSchemaObject(schema?: SchemaObject) {
    return getSchemaFactory(this.context.oas)(schema)
  }

  #addDiscriminatorToSchema<TSchema extends Schema>({
    schema,
    schemaObject,
    discriminator,
  }: {
    schemaObject: SchemaObject
    schema: TSchema
    discriminator: OpenAPIV3.DiscriminatorObject
  }): TSchema {
    if (!isKeyword(schema, schemaKeywords.union)) {
      return schema
    }

    const objectPropertySchema = SchemaGenerator.find(this.parse({ schemaObject: schemaObject }), schemaKeywords.object)

    return {
      ...schema,
      args: Object.entries(discriminator.mapping || {}).map(([key, value]) => {
        const arg = schema.args.find((item) => isKeyword(item, schemaKeywords.ref) && item.args.$ref === value)
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
      }),
    }
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #parseSchemaObject({ schemaObject: _schemaObject, name, parentName }: SchemaProps): Schema[] {
    const { schemaObject, version } = this.#getParsedSchemaObject(_schemaObject)

    const options = this.#getOptions({ schemaObject, name })
    const emptyType = this.#getEmptyType({ schemaObject, name })

    if (!schemaObject) {
      return [{ keyword: emptyType }]
    }

    const baseItems: Schema[] = [
      {
        keyword: schemaKeywords.schema,
        args: {
          type: schemaObject.type as any,
          format: schemaObject.format,
        },
      },
    ]
    const min = schemaObject.minimum ?? schemaObject.minLength ?? schemaObject.minItems ?? undefined
    const max = schemaObject.maximum ?? schemaObject.maxLength ?? schemaObject.maxItems ?? undefined
    const nullable = isNullable(schemaObject)
    const defaultNullAndNullable = schemaObject.default === null && nullable

    if (schemaObject.default !== undefined && !defaultNullAndNullable && !Array.isArray(schemaObject.default)) {
      if (typeof schemaObject.default === 'string') {
        baseItems.push({
          keyword: schemaKeywords.default,
          args: transformers.stringify(schemaObject.default),
        })
      } else if (typeof schemaObject.default === 'boolean') {
        baseItems.push({
          keyword: schemaKeywords.default,
          args: schemaObject.default ?? false,
        })
      } else {
        baseItems.push({
          keyword: schemaKeywords.default,
          args: schemaObject.default,
        })
      }
    }

    if (schemaObject.deprecated) {
      baseItems.push({
        keyword: schemaKeywords.deprecated,
      })
    }

    if (schemaObject.description) {
      baseItems.push({
        keyword: schemaKeywords.describe,
        args: schemaObject.description,
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

    if (schemaObject.type && Array.isArray(schemaObject.type)) {
      // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
      const items = schemaObject.type.filter((value) => value !== 'null') as Array<OpenAPIV3.NonArraySchemaObjectType>
      const hasNull = (schemaObject.type as string[]).includes('null')

      if (hasNull && !nullable) {
        baseItems.push({ keyword: schemaKeywords.nullable })
      }

      if (items.length > 1) {
        const parsedItems = [
          {
            keyword: schemaKeywords.union,
            args: items
              .map(
                (item) =>
                  this.parse({
                    schemaObject: { ...schemaObject, type: item },
                    name,
                    parentName,
                  })[0],
              )
              .filter(Boolean)
              .filter((item) => !isKeyword(item, schemaKeywords.unknown))
              .map((item) => (isKeyword(item, schemaKeywords.object) ? { ...item, args: { ...item.args, strict: true } } : item)),
          },
        ]

        return [...parsedItems, ...baseItems].filter(Boolean)
      }
    }

    if (schemaObject.readOnly) {
      baseItems.push({ keyword: schemaKeywords.readOnly })
    }

    if (schemaObject.writeOnly) {
      baseItems.push({ keyword: schemaKeywords.writeOnly })
    }

    if (isReference(schemaObject)) {
      return [
        ...this.#getRefAlias(schemaObject, name),
        schemaObject.description && {
          keyword: schemaKeywords.describe,
          args: schemaObject.description,
        },
        schemaObject.pattern &&
          schemaObject.type === 'string' && {
            keyword: schemaKeywords.matches,
            args: schemaObject.pattern,
          },
        nullable && { keyword: schemaKeywords.nullable },
        schemaObject.readOnly && { keyword: schemaKeywords.readOnly },
        schemaObject.writeOnly && { keyword: schemaKeywords.writeOnly },
        {
          keyword: schemaKeywords.schema,
          args: {
            type: schemaObject.type as any,
            format: schemaObject.format,
          },
        },
      ].filter(Boolean)
    }

    if (schemaObject.oneOf || schemaObject.anyOf) {
      // union
      const schemaWithoutOneOf = { ...schemaObject, oneOf: undefined, anyOf: undefined }
      const discriminator = this.context.oas.getDiscriminator(schemaObject)

      const union: SchemaKeywordMapper['union'] = {
        keyword: schemaKeywords.union,
        args: (schemaObject.oneOf || schemaObject.anyOf)!
          .map((item) => {
            // first item, this will be ref
            return item && this.parse({ schemaObject: item as SchemaObject, name, parentName })[0]
          })
          .filter(Boolean)
          .filter((item) => !isKeyword(item, schemaKeywords.unknown)),
      }

      if (discriminator) {
        if (this.context) return [this.#addDiscriminatorToSchema({ schemaObject: schemaWithoutOneOf, schema: union, discriminator }), ...baseItems]
      }

      if (schemaWithoutOneOf.properties) {
        const propertySchemas = this.parse({ schemaObject: schemaWithoutOneOf, name, parentName })

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

    if (schemaObject.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schemaObject, allOf: undefined }

      const and: Schema = {
        keyword: schemaKeywords.and,
        args: schemaObject.allOf
          .map((item) => {
            return item && this.parse({ schemaObject: item as SchemaObject, name, parentName })[0]
          })
          .filter(Boolean)
          .filter((item) => !isKeyword(item, schemaKeywords.unknown)),
      }

      if (schemaWithoutAllOf.required?.length) {
        const allOfItems = schemaObject.allOf
        const resolvedSchemas: SchemaObject[] = []

        for (const item of allOfItems) {
          const resolved = isReference(item) ? (this.context.oas.get(item.$ref) as SchemaObject) : item

          if (resolved) {
            resolvedSchemas.push(resolved)
          }
        }

        const existingKeys = schemaWithoutAllOf.properties ? new Set(Object.keys(schemaWithoutAllOf.properties)) : null

        const parsedItems: SchemaObject[] = []

        for (const key of schemaWithoutAllOf.required) {
          if (existingKeys?.has(key)) {
            continue
          }

          for (const schema of resolvedSchemas) {
            if (schema.properties?.[key]) {
              parsedItems.push({
                properties: {
                  [key]: schema.properties[key],
                },
                required: [key],
              } as SchemaObject)
              break
            }
          }
        }

        for (const item of parsedItems) {
          const parsed = this.parse({ schemaObject: item, name, parentName })

          if (Array.isArray(parsed)) {
            and.args = and.args ? and.args.concat(parsed) : parsed
          }
        }
      }

      if (schemaWithoutAllOf.properties) {
        and.args = [...(and.args || []), ...this.parse({ schemaObject: schemaWithoutAllOf, name, parentName })]
      }

      return SchemaGenerator.combineObjects([and, ...baseItems])
    }

    if (schemaObject.enum) {
      if (options.enumSuffix === '') {
        this.context.pluginManager.logger.emit('info', 'EnumSuffix set to an empty string does not work')
      }

      const enumName = getUniqueName(pascalCase([parentName, name, options.enumSuffix].join(' ')), this.#getUsedEnumNames({ schemaObject, name }))
      const typeName = this.context.pluginManager.resolveName({
        name: enumName,
        pluginKey: this.context.plugin.key,
        type: 'type',
      })

      const nullableEnum = schemaObject.enum.includes(null)
      if (nullableEnum) {
        baseItems.push({ keyword: schemaKeywords.nullable })
      }
      const filteredValues = schemaObject.enum.filter((value) => value !== null)

      // x-enumNames has priority
      const extensionEnums = ['x-enumNames', 'x-enum-varnames']
        .filter((extensionKey) => extensionKey in schemaObject)
        .map((extensionKey) => {
          return [
            {
              keyword: schemaKeywords.enum,
              args: {
                name,
                typeName,
                asConst: false,
                items: [...new Set(schemaObject[extensionKey as keyof typeof schemaObject] as string[])].map((name: string | number, index) => ({
                  name: transformers.stringify(name),
                  value: schemaObject.enum?.[index] as string | number,
                  format: isNumber(schemaObject.enum?.[index]) ? 'number' : 'string',
                })),
              },
            },
            ...baseItems.filter(
              (item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max && item.keyword !== schemaKeywords.matches,
            ),
          ]
        })

      if (schemaObject.type === 'number' || schemaObject.type === 'integer') {
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

      if (schemaObject.type === 'boolean') {
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

    if ('prefixItems' in schemaObject) {
      const prefixItems = schemaObject.prefixItems as SchemaObject[]
      const items = 'items' in schemaObject ? (schemaObject.items as SchemaObject[]) : []
      const min = schemaObject.minimum ?? schemaObject.minLength ?? schemaObject.minItems ?? undefined
      const max = schemaObject.maximum ?? schemaObject.maxLength ?? schemaObject.maxItems ?? undefined

      return [
        {
          keyword: schemaKeywords.tuple,
          args: {
            min,
            max,
            items: prefixItems
              .map((item) => {
                return this.parse({ schemaObject: item, name, parentName })[0]
              })
              .filter(Boolean),
            rest: this.parse({
              schemaObject: items,
              name,
              parentName,
            })[0],
          },
        },
        ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max),
      ]
    }

    if (version === '3.1' && 'const' in schemaObject) {
      // const keyword takes precendence over the actual type.

      if (schemaObject['const'] === null) {
        return [{ keyword: schemaKeywords.null }]
      }
      if (schemaObject['const'] === undefined) {
        return [{ keyword: schemaKeywords.undefined }]
      }

      let format = typeof schemaObject['const']
      if (format !== 'number' && format !== 'boolean') {
        format = 'string'
      }

      return [
        {
          keyword: schemaKeywords.const,
          args: {
            name: schemaObject['const'],
            format,
            value: schemaObject['const'],
          },
        },
        ...baseItems,
      ]
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
    if (schemaObject.format) {
      if (schemaObject.type === 'integer' && (schemaObject.format === 'int32' || schemaObject.format === 'int64')) {
        baseItems.unshift({ keyword: schemaKeywords.integer })
        return baseItems
      }

      if (schemaObject.type === 'number' && (schemaObject.format === 'float' || schemaObject.format === 'double')) {
        baseItems.unshift({ keyword: schemaKeywords.number })
        return baseItems
      }

      switch (schemaObject.format) {
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

    if (schemaObject.pattern && schemaObject.type === 'string') {
      baseItems.unshift({
        keyword: schemaKeywords.matches,
        args: schemaObject.pattern,
      })

      return baseItems
    }

    // type based logic
    if ('items' in schemaObject || schemaObject.type === ('array' as 'string')) {
      const min = schemaObject.minimum ?? schemaObject.minLength ?? schemaObject.minItems ?? undefined
      const max = schemaObject.maximum ?? schemaObject.maxLength ?? schemaObject.maxItems ?? undefined
      const items = this.parse({ schemaObject: 'items' in schemaObject ? (schemaObject.items as SchemaObject) : [], name, parentName })
      const unique = !!schemaObject.uniqueItems

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

    if (schemaObject.properties || schemaObject.additionalProperties) {
      if (isDiscriminator(schemaObject)) {
        // override schema to set type to be based on discriminator mapping, use of enum to convert type string to type 'mapping1' | 'mapping2'
        const schemaObjectOverriden = Object.keys(schemaObject.properties || {}).reduce((acc, propertyName) => {
          if (acc.properties?.[propertyName] && propertyName === schemaObject.discriminator.propertyName) {
            return {
              ...acc,
              properties: {
                ...acc.properties,
                [propertyName]: {
                  ...((acc.properties[propertyName] as any) || {}),
                  enum: schemaObject.discriminator.mapping ? Object.keys(schemaObject.discriminator.mapping) : undefined,
                },
              },
            }
          }

          return acc
        }, schemaObject || {}) as SchemaObject

        return [
          ...this.#parseProperties({
            schemaObject: schemaObjectOverriden,
            name,
          }),
          ...baseItems,
        ]
      }

      return [...this.#parseProperties({ schemaObject, name }), ...baseItems]
    }

    if (schemaObject.type) {
      const type = (
        Array.isArray(schemaObject.type) ? schemaObject.type.filter((item) => item !== 'null')[0] : schemaObject.type
      ) as OpenAPIV3.NonArraySchemaObjectType

      if (!['boolean', 'object', 'number', 'string', 'integer', 'null'].includes(type)) {
        this.context.pluginManager.logger.emit('warning', `Schema type '${schemaObject.type}' is not valid for schema ${parentName}.${name}`)
      }

      // 'string' | 'number' | 'integer' | 'boolean'
      return [{ keyword: type }, ...baseItems]
    }

    return [{ keyword: emptyType }]
  }

  async build(...generators: Array<Generator<TPluginOptions>>): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas, contentType, include } = this.context
    const schemas = getSchemas({ oas, contentType, includes: include })
    const schemaEntries = Object.entries(schemas)

    const generatorLimit = pLimit(1)
    const schemaLimit = pLimit(10)

    const writeTasks = generators.map((generator) =>
      generatorLimit(async () => {
        const schemaTasks = schemaEntries.map(([name, schemaObject]) =>
          schemaLimit(async () => {
            const options = this.#getOptions({ name })
            const tree = this.parse({ name, schemaObject })

            const result = await generator.schema?.({
              instance: this,
              schema: {
                name,
                value: schemaObject,
                tree,
              },
              options: {
                ...this.options,
                ...options,
              },
            })

            return result ?? []
          }),
        )

        const schemaResults = await Promise.all(schemaTasks)
        return schemaResults.flat() as unknown as KubbFile.File<TFileMeta>
      }),
    )

    const nestedResults = await Promise.all(writeTasks)

    return nestedResults.flat()
  }
}
