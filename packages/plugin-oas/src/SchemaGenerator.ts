import type { KubbEvents, Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams } from '@kubb/core'
import { BaseGenerator, type FileMetaBase } from '@kubb/core'
import transformers, { pascalCase } from '@kubb/core/transformers'
import { type AsyncEventEmitter, getUniqueName } from '@kubb/core/utils'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { contentType, Oas, OasTypes, OpenAPIV3, SchemaObject } from '@kubb/oas'
import { isDiscriminator, isNullable, isReference } from '@kubb/oas'
import type { Fabric } from '@kubb/react-fabric'
import pLimit from 'p-limit'
import { isDeepEqual, isNumber, uniqueWith } from 'remeda'
import type { Generator } from './generators/types.ts'
import { isKeyword, type Schema, type SchemaKeywordMapper, schemaKeywords } from './SchemaMapper.ts'
import type { OperationSchema, Override, Refs } from './types.ts'
import { getSchemaFactory } from './utils/getSchemaFactory.ts'
import { buildSchema } from './utils.tsx'

export type GetSchemaGeneratorOptions<T extends SchemaGenerator<any, any, any>> = T extends SchemaGenerator<infer Options, any, any> ? Options : never

export type SchemaMethodResult<TFileMeta extends FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  fabric: Fabric
  oas: Oas
  pluginManager: PluginManager
  events?: AsyncEventEmitter<KubbEvents>
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
  enumType?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal' | 'inlineLiteral'
  enumSuffix?: string
  /**
   * @deprecated Will be removed in v5. Use `collisionDetection: true` instead to prevent enum name collisions.
   * When `collisionDetection` is enabled, the rootName-based approach eliminates the need for numeric suffixes.
   * @internal
   */
  usedEnumNames?: Record<string, number>
  mapper?: Record<string, string>
  typed?: boolean
  transformers: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
    /**
     * Receive schema and name(propertyName) and return FakerMeta array
     * TODO TODO add docs
     * @beta
     */
    schema?: (schemaProps: SchemaProps, defaultSchemas: Schema[]) => Array<Schema> | undefined
  }
}

export type SchemaGeneratorBuildOptions = Omit<OperationSchema, 'name' | 'schema'>

type SchemaProps = {
  schema: SchemaObject | null
  name: string | null
  parentName: string | null
  rootName?: string | null
}

export class SchemaGenerator<
  TOptions extends SchemaGeneratorOptions = SchemaGeneratorOptions,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends FileMetaBase = FileMetaBase,
> extends BaseGenerator<TOptions, Context<TOptions, TPluginOptions>> {
  // Collect the types of all referenced schemas, so we can export them later
  refs: Refs = {}

  // Map from original component paths to resolved schema names (after collision resolution)
  // e.g., { '#/components/schemas/Order': 'OrderSchema', '#/components/responses/Product': 'ProductResponse' }
  #schemaNameMapping: Map<string, string> = new Map()

  // Flag to track if nameMapping has been initialized
  #nameMappingInitialized = false

  // Cache for parsed schemas to avoid redundant parsing
  // Using WeakMap for automatic garbage collection when schemas are no longer referenced
  #parseCache: Map<string, Schema[]> = new Map()

  /**
   * Ensure the name mapping is initialized (lazy initialization)
   */
  #ensureNameMapping() {
    if (this.#nameMappingInitialized) {
      return
    }

    const { oas, contentType, include } = this.context
    const { nameMapping } = oas.getSchemas({ contentType, includes: include })
    this.#schemaNameMapping = nameMapping
    this.#nameMappingInitialized = true
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  parse(props: SchemaProps): Schema[] {
    const options = this.#getOptions(props.name)

    // Only cache when schema is a simple object (not null/undefined)
    // and doesn't have transformers that could affect the result
    const shouldCache = props.schema && typeof props.schema === 'object' && !options.transformers?.schema
    let cacheKey = ''

    if (shouldCache) {
      // Create cache key using stable JSON stringify for correctness
      // Cache hit rate is still high for identical schemas across operations
      try {
        cacheKey = JSON.stringify({
          schema: props.schema,
          name: props.name,
          parentName: props.parentName,
          rootName: props.rootName,
        })

        const cached = this.#parseCache.get(cacheKey)
        if (cached) {
          return cached
        }
      } catch {
        // If JSON.stringify fails (circular refs), skip caching
        shouldCache && (shouldCache as any as boolean)
      }
    }

    const defaultSchemas = this.#parseSchemaObject(props)
    const schemas = options.transformers?.schema?.(props, defaultSchemas) || defaultSchemas || []

    const result = uniqueWith(schemas, isDeepEqual)

    // Cache the result only if we created a valid cache key
    if (shouldCache && cacheKey) {
      this.#parseCache.set(cacheKey, result)
    }

    return result
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

        if (schema.args?.patternProperties) {
          Object.values(schema.args.patternProperties).forEach((entrySchemas) => {
            entrySchemas.forEach((entrySchema) => {
              foundItems.push(...SchemaGenerator.deepSearch<T>([entrySchema], keyword))
            })
          })
        }
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

  #getOptions(name: string | null): Partial<TOptions> {
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

  #getUnknownType(name: string | null): string {
    const options = this.#getOptions(name)

    if (options.unknownType === 'any') {
      return schemaKeywords.any
    }
    if (options.unknownType === 'void') {
      return schemaKeywords.void
    }

    return schemaKeywords.unknown
  }

  #getEmptyType(name: string | null): string {
    const options = this.#getOptions(name)

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
  #parseProperties(name: string | null, schemaObject: SchemaObject, rootName?: string | null): Schema[] {
    const properties = schemaObject?.properties || {}
    const additionalProperties = schemaObject?.additionalProperties
    const required = schemaObject?.required
    const patternProperties = schemaObject && 'patternProperties' in schemaObject ? schemaObject.patternProperties : undefined

    const propertiesSchemas = Object.keys(properties)
      .map((propertyName) => {
        const validationFunctions: Schema[] = []
        const propertySchema = properties[propertyName] as SchemaObject

        const isRequired = Array.isArray(required) ? required?.includes(propertyName) : !!required
        const nullable = isNullable(propertySchema)

        validationFunctions.push(...this.parse({ schema: propertySchema, name: propertyName, parentName: name, rootName: rootName || name }))

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
          ? [{ keyword: this.#getUnknownType(name) }]
          : this.parse({ schema: additionalProperties as SchemaObject, name: null, parentName: name, rootName: rootName || name })
    }

    let patternPropertiesSchemas: Record<string, Schema[]> = {}

    if (patternProperties && typeof patternProperties === 'object') {
      patternPropertiesSchemas = Object.entries(patternProperties).reduce((acc, [pattern, patternSchema]) => {
        const schemas =
          patternSchema === true || !Object.keys(patternSchema as object).length
            ? [{ keyword: this.#getUnknownType(name) }]
            : this.parse({ schema: patternSchema, name: null, parentName: name, rootName: rootName || name })

        return {
          ...acc,
          [pattern]: schemas,
        }
      }, {})
    }

    const args: {
      properties: typeof propertiesSchemas
      additionalProperties: typeof additionalPropertiesSchemas
      patternProperties?: typeof patternPropertiesSchemas
    } = {
      properties: propertiesSchemas,
      additionalProperties: additionalPropertiesSchemas,
    }

    if (Object.keys(patternPropertiesSchemas).length > 0) {
      args['patternProperties'] = patternPropertiesSchemas
    }

    return [
      {
        keyword: schemaKeywords.object,
        args,
      },
    ]
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  #getRefAlias(schemaObject: OpenAPIV3.ReferenceObject, name: string | null): Schema[] {
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

    // Ensure name mapping is initialized before resolving names
    this.#ensureNameMapping()

    const originalName = $ref.replace(/.+\//, '')
    // Use the full $ref path to look up the collision-resolved name
    const resolvedName = this.#schemaNameMapping.get($ref) || originalName

    const propertyName = this.context.pluginManager.resolveName({
      name: resolvedName,
      pluginKey: this.context.plugin.key,
      type: 'function',
    })

    const fileName = this.context.pluginManager.resolveName({
      name: resolvedName,
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
      originalName: resolvedName,
      path: file.path,
    }

    return this.#getRefAlias(schemaObject, name)
  }

  #getParsedSchemaObject(schema: SchemaObject | null) {
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

    // If the discriminator property is an extension property (starts with x-),
    // its metadata and not an actual schema property, so we can't add constraints for it.
    // In this case, return the union as-is without adding discriminator constraints.
    if (discriminator.propertyName.startsWith('x-')) {
      return schema
    }

    const objectPropertySchema = SchemaGenerator.find(this.parse({ schema: schemaObject, name: null, parentName: null, rootName: null }), schemaKeywords.object)

    return {
      ...schema,
      args: Object.entries(discriminator.mapping || {})
        .map(([key, value]) => {
          let arg: Schema | undefined

          // Check if this is a synthetic ref for inline schemas (e.g., #kubb-inline-0)
          if (value.startsWith('#kubb-inline-')) {
            const index = Number.parseInt(value.replace('#kubb-inline-', ''), 10)
            // Validate index is within bounds
            if (!Number.isNaN(index) && index >= 0 && index < schema.args.length) {
              arg = schema.args[index]
            }
          } else {
            // Regular ref - find by $ref value
            arg = schema.args.find((item) => isKeyword(item, schemaKeywords.ref) && item.args.$ref === value)
          }

          // Skip discriminator mappings that don't have a corresponding schema in the oneOf/anyOf
          if (!arg) {
            return undefined
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
        })
        .filter(Boolean) as SchemaKeywordMapper['union']['args'],
    }
  }

  /**
   * Checks if an allOf item reference would create a circular reference.
   * This happens when a child schema extends a discriminator parent via allOf,
   * and the parent has a oneOf/anyOf that references or maps to the child.
   *
   * Without oneOf/anyOf, the discriminator is just for documentation/validation
   * purposes and doesn't create a TypeScript union type that would be circular.
   */
  #wouldCreateCircularReference(item: unknown, childSchemaName: string | null): boolean {
    if (!isReference(item) || !childSchemaName) {
      return false
    }

    const dereferencedSchema = this.context.oas.dereferenceWithRef(item)

    if (dereferencedSchema && isDiscriminator(dereferencedSchema)) {
      // Only check for circular references if parent has oneOf/anyOf
      // Without oneOf/anyOf, the discriminator doesn't create a union type
      const parentOneOf = dereferencedSchema.oneOf || dereferencedSchema.anyOf
      if (!parentOneOf) {
        return false
      }

      const childRef = `#/components/schemas/${childSchemaName}`

      const inOneOf = parentOneOf.some((oneOfItem) => {
        return isReference(oneOfItem) && oneOfItem.$ref === childRef
      })
      if (inOneOf) {
        return true
      }

      const mapping = dereferencedSchema.discriminator.mapping || {}
      const inMapping = Object.values(mapping).some((value) => value === childRef)

      if (inMapping) {
        return true
      }
    }
    return false
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  #parseSchemaObject({ schema: _schemaObject, name, parentName, rootName }: SchemaProps): Schema[] {
    const normalizedSchema = this.context.oas.flattenSchema(_schemaObject)

    const { schemaObject, version } = this.#getParsedSchemaObject(normalizedSchema)

    const options = this.#getOptions(name)
    const emptyType = this.#getEmptyType(name)

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

    const exclusiveMinimum = schemaObject.exclusiveMinimum
    const exclusiveMaximum = schemaObject.exclusiveMaximum

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
      if (exclusiveMaximum) {
        baseItems.unshift({ keyword: schemaKeywords.exclusiveMaximum, args: max })
      } else {
        baseItems.unshift({ keyword: schemaKeywords.max, args: max })
      }
    }

    if (min !== undefined) {
      if (exclusiveMinimum) {
        baseItems.unshift({ keyword: schemaKeywords.exclusiveMinimum, args: min })
      } else {
        baseItems.unshift({ keyword: schemaKeywords.min, args: min })
      }
    }

    if (typeof exclusiveMaximum === 'number') {
      //OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
      baseItems.unshift({ keyword: schemaKeywords.exclusiveMaximum, args: exclusiveMaximum })
    }
    if (typeof exclusiveMinimum === 'number') {
      //OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
      baseItems.unshift({ keyword: schemaKeywords.exclusiveMinimum, args: exclusiveMinimum })
    }
    if (nullable) {
      baseItems.push({ keyword: schemaKeywords.nullable })
    }

    if (schemaObject.type && Array.isArray(schemaObject.type)) {
      // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
      const items = schemaObject.type.filter((value) => value !== 'null') as Array<OpenAPIV3.NonArraySchemaObjectType>

      if (items.length > 1) {
        const parsedItems = [
          {
            keyword: schemaKeywords.union,
            args: items
              .map(
                (item) =>
                  this.parse({
                    schema: { ...schemaObject, type: item },
                    name,
                    parentName,
                    rootName,
                  })[0],
              )
              .filter(Boolean)
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
            // first item, this is ref
            return item && this.parse({ schema: item as SchemaObject, name, parentName, rootName })[0]
          })
          .filter(Boolean),
      }

      if (discriminator) {
        // In 'inherit' mode, the discriminator property is already added to child schemas by Oas.getDiscriminator()
        // so we should NOT add it at the union level
        if (this.context && this.context.oas.options.discriminator !== 'inherit') {
          return [this.#addDiscriminatorToSchema({ schemaObject: schemaWithoutOneOf, schema: union, discriminator }), ...baseItems]
        }
      }

      if (schemaWithoutOneOf.properties) {
        const propertySchemas = this.parse({ schema: schemaWithoutOneOf, name, parentName, rootName })

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
          .flatMap((item) => {
            // Skip items that would create circular references
            if (this.#wouldCreateCircularReference(item, name)) {
              return []
            }

            return item ? this.parse({ schema: item, name, parentName, rootName }) : []
          })
          .filter(Boolean),
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
          const parsed = this.parse({ schema: item, name, parentName, rootName })

          if (Array.isArray(parsed)) {
            and.args = and.args ? and.args.concat(parsed) : parsed
          }
        }
      }

      if (schemaWithoutAllOf.properties) {
        and.args = [...(and.args || []), ...this.parse({ schema: schemaWithoutAllOf, name, parentName, rootName })]
      }

      return SchemaGenerator.combineObjects([and, ...baseItems])
    }

    if (schemaObject.enum) {
      // Handle malformed schema where enum exists at array level instead of in items
      // This normalizes: { type: 'array', enum: [...], items: {...} }
      // Into: { type: 'array', items: { type: 'string', enum: [...] } }
      if (schemaObject.type === 'array') {
        const isItemsObject = typeof schemaObject.items === 'object' && !Array.isArray(schemaObject.items)
        const normalizedItems = {
          ...(isItemsObject ? schemaObject.items : {}),
          enum: schemaObject.enum,
        } as SchemaObject

        const { enum: _, ...schemaWithoutEnum } = schemaObject
        const normalizedSchema = {
          ...schemaWithoutEnum,
          items: normalizedItems,
        } as SchemaObject

        return this.parse({ schema: normalizedSchema, name, parentName, rootName })
      }

      // Removed verbose enum parsing debug log - too noisy for hundreds of enums

      // Include rootName in enum naming to avoid collisions for nested enums with same path
      // Only add rootName if it differs from parentName to avoid duplication
      // This is controlled by the collisionDetection flag to maintain backward compatibility
      const useCollisionDetection = this.context.oas.options.collisionDetection ?? false
      const enumNameParts =
        useCollisionDetection && rootName && rootName !== parentName ? [rootName, parentName, name, options.enumSuffix] : [parentName, name, options.enumSuffix]

      // @deprecated usedEnumNames will be removed in v5 - collisionDetection with rootName-based naming eliminates the need for numeric suffixes
      const enumName = useCollisionDetection
        ? pascalCase(enumNameParts.join(' '))
        : getUniqueName(pascalCase(enumNameParts.join(' ')), this.options.usedEnumNames || {})
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
                return this.parse({ schema: item, name, parentName, rootName })[0]
              })
              .filter(Boolean),
            rest: this.parse({
              schema: items,
              name,
              parentName,
              rootName,
            })[0],
          },
        },
        ...baseItems.filter((item) => item.keyword !== schemaKeywords.min && item.keyword !== schemaKeywords.max),
      ]
    }

    if (version === '3.1' && 'const' in schemaObject) {
      // const keyword takes precedence over the actual type.

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
      const items = this.parse({ schema: 'items' in schemaObject ? (schemaObject.items as SchemaObject) : [], name, parentName, rootName })
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

    if (schemaObject.properties || schemaObject.additionalProperties || 'patternProperties' in schemaObject) {
      if (isDiscriminator(schemaObject)) {
        // override schema to set type to be based on discriminator mapping, use of enum to convert type string to type 'mapping1' | 'mapping2'
        const schemaObjectOverridden = Object.keys(schemaObject.properties || {}).reduce((acc, propertyName) => {
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

        return [...this.#parseProperties(name, schemaObjectOverridden, rootName), ...baseItems]
      }

      return [...this.#parseProperties(name, schemaObject, rootName), ...baseItems]
    }

    if (schemaObject.type) {
      const type = (
        Array.isArray(schemaObject.type) ? schemaObject.type.filter((item) => item !== 'null')[0] : schemaObject.type
      ) as OpenAPIV3.NonArraySchemaObjectType

      if (!['boolean', 'object', 'number', 'string', 'integer', 'null'].includes(type)) {
        this.context.events?.emit('warn', `Schema type '${schemaObject.type}' is not valid for schema ${parentName}.${name}`)
        // Removed duplicate debug log - warning already provides the information needed
      }

      // 'string' | 'number' | 'integer' | 'boolean'
      return [{ keyword: type }, ...baseItems]
    }

    // Infer type from constraints when no explicit type is provided
    let inferredType: OpenAPIV3.NonArraySchemaObjectType | undefined
    if (schemaObject.minLength !== undefined || schemaObject.maxLength !== undefined || schemaObject.pattern !== undefined) {
      inferredType = 'string'
    } else if (schemaObject.minimum !== undefined || schemaObject.maximum !== undefined) {
      inferredType = 'number'
    }
    // Note: minItems/maxItems don't infer type 'array' because arrays are handled
    // specially with schemaKeywords.array and require an items property

    if (inferredType) {
      return [{ keyword: inferredType }, ...baseItems]
    }

    return [{ keyword: emptyType }, ...baseItems]
  }

  async build(...generators: Array<Generator<TPluginOptions>>): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas, contentType, include } = this.context

    // Initialize the name mapping if not already done
    if (!this.#nameMappingInitialized) {
      const { schemas, nameMapping } = oas.getSchemas({ contentType, includes: include })
      this.#schemaNameMapping = nameMapping
      this.#nameMappingInitialized = true
      const schemaEntries = Object.entries(schemas)

      this.context.events?.emit('debug', {
        date: new Date(),
        logs: [`Building ${schemaEntries.length} schemas`, `  • Content Type: ${contentType || 'application/json'}`, `  • Generators: ${generators.length}`],
      })

      // Continue with build using the schemas
      return this.#doBuild(schemas, generators)
    }
    // If already initialized, just get the schemas (without mapping)
    const { schemas } = oas.getSchemas({ contentType, includes: include })
    return this.#doBuild(schemas, generators)
  }

  async #doBuild(schemas: Record<string, OasTypes.SchemaObject>, generators: Array<Generator<TPluginOptions>>): Promise<Array<KubbFile.File<TFileMeta>>> {
    const schemaEntries = Object.entries(schemas)

    // Increased parallelism for better performance
    // - generatorLimit increased from 1 to 3 to allow parallel generator processing
    // - schemaLimit increased from 10 to 30 to process more schemas concurrently
    const generatorLimit = pLimit(3)
    const schemaLimit = pLimit(30)

    const writeTasks = generators.map((generator) =>
      generatorLimit(async () => {
        const schemaTasks = schemaEntries.map(([name, schemaObject]) =>
          schemaLimit(async () => {
            const options = this.#getOptions(name)
            const tree = this.parse({ schema: schemaObject, name, parentName: null, rootName: name })

            if (generator.type === 'react') {
              await buildSchema(
                {
                  name,
                  value: schemaObject,
                  tree,
                },
                {
                  config: this.context.pluginManager.config,
                  fabric: this.context.fabric,
                  Component: generator.Schema,
                  generator: this,
                  plugin: {
                    ...this.context.plugin,
                    options: {
                      ...this.options,
                      ...options,
                    },
                  },
                },
              )

              return []
            }

            const result = await generator.schema?.({
              config: this.context.pluginManager.config,
              generator: this,
              schema: {
                name,
                value: schemaObject,
                tree,
              },
              plugin: {
                ...this.context.plugin,
                options: {
                  ...this.options,
                  ...options,
                },
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
