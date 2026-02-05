import transformers from '@kubb/core/transformers'
import type { SchemaKeywordMapper, SchemaMapper } from '@kubb/plugin-oas'
import { createParser, isKeyword, schemaKeywords } from '@kubb/plugin-oas'
import type ts from 'typescript'
import * as factory from './factory.ts'

export const typeKeywordMapper = {
  any: () => factory.keywordTypeNodes.any,
  unknown: () => factory.keywordTypeNodes.unknown,
  void: () => factory.keywordTypeNodes.void,
  number: () => factory.keywordTypeNodes.number,
  integer: () => factory.keywordTypeNodes.number,
  object: (nodes?: ts.TypeElement[]) => {
    if (!nodes || !nodes.length) {
      return factory.keywordTypeNodes.object
    }

    return factory.createTypeLiteralNode(nodes)
  },
  string: () => factory.keywordTypeNodes.string,
  boolean: () => factory.keywordTypeNodes.boolean,
  undefined: () => factory.keywordTypeNodes.undefined,
  nullable: undefined,
  null: () => factory.keywordTypeNodes.null,
  nullish: undefined,
  array: (nodes?: ts.TypeNode[], arrayType?: 'array' | 'generic') => {
    if (!nodes) {
      return undefined
    }

    return factory.createArrayDeclaration({ nodes, arrayType })
  },
  tuple: (nodes?: ts.TypeNode[], rest?: ts.TypeNode, min?: number, max?: number) => {
    if (!nodes) {
      return undefined
    }

    if (max) {
      nodes = nodes.slice(0, max)

      if (nodes.length < max && rest) {
        nodes = [...nodes, ...Array(max - nodes.length).fill(rest)]
      }
    }

    if (min) {
      nodes = nodes.map((node, index) => (index >= min ? factory.createOptionalTypeNode(node) : node))
    }

    if (typeof max === 'undefined' && rest) {
      nodes.push(factory.createRestTypeNode(factory.createArrayTypeNode(rest)))
    }

    return factory.createTupleTypeNode(nodes)
  },
  enum: (name?: string) => {
    if (!name) {
      return undefined
    }

    return factory.createTypeReferenceNode(name, undefined)
  },
  union: (nodes?: ts.TypeNode[]) => {
    if (!nodes) {
      return undefined
    }

    return factory.createUnionDeclaration({
      withParentheses: true,
      nodes,
    })
  },
  const: (name?: string | number | boolean, format?: 'string' | 'number' | 'boolean') => {
    if (name === null || name === undefined || name === '') {
      return undefined
    }

    if (format === 'boolean') {
      if (name === true) {
        return factory.createLiteralTypeNode(factory.createTrue())
      }

      return factory.createLiteralTypeNode(factory.createFalse())
    }

    if (format === 'number' && typeof name === 'number') {
      return factory.createLiteralTypeNode(factory.createNumericLiteral(name))
    }

    return factory.createLiteralTypeNode(factory.createStringLiteral(name.toString()))
  },
  datetime: () => factory.keywordTypeNodes.string,
  date: (type: 'date' | 'string' = 'string') =>
    type === 'string' ? factory.keywordTypeNodes.string : factory.createTypeReferenceNode(factory.createIdentifier('Date')),
  time: (type: 'date' | 'string' = 'string') =>
    type === 'string' ? factory.keywordTypeNodes.string : factory.createTypeReferenceNode(factory.createIdentifier('Date')),
  uuid: () => factory.keywordTypeNodes.string,
  url: () => factory.keywordTypeNodes.string,
  default: undefined,
  and: (nodes?: ts.TypeNode[]) => {
    if (!nodes) {
      return undefined
    }

    return factory.createIntersectionDeclaration({
      withParentheses: true,
      nodes,
    })
  },
  describe: undefined,
  min: undefined,
  max: undefined,
  optional: undefined,
  matches: () => factory.keywordTypeNodes.string,
  email: () => factory.keywordTypeNodes.string,
  firstName: undefined,
  lastName: undefined,
  password: undefined,
  phone: undefined,
  readOnly: undefined,
  writeOnly: undefined,
  ref: (propertyName?: string) => {
    if (!propertyName) {
      return undefined
    }

    return factory.createTypeReferenceNode(propertyName, undefined)
  },
  blob: () => factory.createTypeReferenceNode('Blob', []),
  deprecated: undefined,
  example: undefined,
  schema: undefined,
  catchall: undefined,
  name: undefined,
  interface: undefined,
  exclusiveMaximum: undefined,
  exclusiveMinimum: undefined,
} satisfies SchemaMapper<ts.TypeNode | null | undefined>

type ParserOptions = {
  /**
   * @default `'questionToken'`
   */
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * @default `'array'`
   */
  arrayType: 'array' | 'generic'
  /**
   * Choose to use `enum`, `asConst`, `asPascalConst`, `constEnum`, `literal`, or `inlineLiteral` for enums.
   * - `enum`: TypeScript enum
   * - `asConst`: const with camelCase name (e.g., `petType`)
   * - `asPascalConst`: const with PascalCase name (e.g., `PetType`)
   * - `constEnum`: const enum
   * - `literal`: literal union type
   * - `inlineLiteral`: inline enum values directly into the type (default in v5)
   * @default `'asConst'`
   * @note In Kubb v5, `inlineLiteral` becomes the default.
   */
  enumType: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal' | 'inlineLiteral'
  mapper?: Record<string, ts.PropertySignature>
}

/**
 * Recursively parses a schema tree node into a corresponding TypeScript AST node.
 *
 * Maps OpenAPI schema keywords to TypeScript AST nodes using the `typeKeywordMapper`, handling complex types such as unions, intersections, arrays, tuples (with optional/rest elements and length constraints), enums, constants, references, and objects with property modifiers and documentation annotations.
 *
 * @param current - The schema node to parse.
 * @param siblings - Sibling schema nodes, used for context in certain mappings.
 * @param name - The name of the schema or property being parsed.
 * @param options - Parsing options controlling output style, property handling, and custom mappers.
 * @returns The generated TypeScript AST node, or `undefined` if the schema keyword is not mapped.
 */
export const parse = createParser<ts.Node | null, ParserOptions>({
  mapper: typeKeywordMapper,
  handlers: {
    union(tree, options) {
      const { current, schema, name } = tree

      return typeKeywordMapper.union(
        current.args.map((it) => this.parse({ schema, parent: current, name, current: it, siblings: [] }, options)).filter(Boolean) as ts.TypeNode[],
      )
    },
    and(tree, options) {
      const { current, schema, name } = tree

      return typeKeywordMapper.and(
        current.args.map((it) => this.parse({ schema, parent: current, name, current: it, siblings: [] }, options)).filter(Boolean) as ts.TypeNode[],
      )
    },
    array(tree, options) {
      const { current, schema, name } = tree

      return typeKeywordMapper.array(
        current.args.items.map((it) => this.parse({ schema, parent: current, name, current: it, siblings: [] }, options)).filter(Boolean) as ts.TypeNode[],
        options.arrayType,
      )
    },
    enum(tree, options) {
      const { current } = tree

      // If enumType is 'inlineLiteral', generate the literal union inline instead of a type reference
      if (options.enumType === 'inlineLiteral') {
        const enumValues = current.args.items
          .map((item) => item.value)
          .filter((value): value is string | number | boolean => value !== undefined && value !== null)
          .map((value) => {
            const format = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string'
            return typeKeywordMapper.const(value, format)
          })
          .filter(Boolean) as ts.TypeNode[]

        return typeKeywordMapper.union(enumValues)
      }

      // Adding suffix to enum (see https://github.com/kubb-labs/kubb/issues/1873)
      return typeKeywordMapper.enum(options.enumType === 'asConst' ? `${current.args.typeName}Key` : current.args.typeName)
    },
    ref(tree, _options) {
      const { current } = tree

      return typeKeywordMapper.ref(current.args.name)
    },
    blob() {
      return typeKeywordMapper.blob()
    },
    tuple(tree, options) {
      const { current, schema, name } = tree

      return typeKeywordMapper.tuple(
        current.args.items.map((it) => this.parse({ schema, parent: current, name, current: it, siblings: [] }, options)).filter(Boolean) as ts.TypeNode[],
        current.args.rest &&
          ((this.parse({ schema, parent: current, name, current: current.args.rest, siblings: [] }, options) ?? undefined) as ts.TypeNode | undefined),
        current.args.min,
        current.args.max,
      )
    },
    const(tree, _options) {
      const { current } = tree

      return typeKeywordMapper.const(current.args.name, current.args.format)
    },
    object(tree, options) {
      const { current, schema, name } = tree

      const properties = Object.entries(current.args?.properties || {})
        .filter((item) => {
          const schemas = item[1]
          return schemas && typeof schemas.map === 'function'
        })
        .map(([name, schemas]) => {
          const nameSchema = schemas.find((schema) => schema.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']
          const mappedName = nameSchema?.args || name

          // custom mapper(pluginOptions)
          // Use Object.hasOwn to avoid matching inherited properties like 'toString', 'valueOf', etc.
          if (options.mapper && Object.hasOwn(options.mapper, mappedName)) {
            return options.mapper[mappedName]
          }

          const isNullish = schemas.some((schema) => schema.keyword === schemaKeywords.nullish)
          const isNullable = schemas.some((schema) => schema.keyword === schemaKeywords.nullable)
          const isOptional = schemas.some((schema) => schema.keyword === schemaKeywords.optional)
          const isReadonly = schemas.some((schema) => schema.keyword === schemaKeywords.readOnly)
          const describeSchema = schemas.find((schema) => schema.keyword === schemaKeywords.describe) as SchemaKeywordMapper['describe'] | undefined
          const deprecatedSchema = schemas.find((schema) => schema.keyword === schemaKeywords.deprecated) as SchemaKeywordMapper['deprecated'] | undefined
          const defaultSchema = schemas.find((schema) => schema.keyword === schemaKeywords.default) as SchemaKeywordMapper['default'] | undefined
          const exampleSchema = schemas.find((schema) => schema.keyword === schemaKeywords.example) as SchemaKeywordMapper['example'] | undefined
          const schemaSchema = schemas.find((schema) => schema.keyword === schemaKeywords.schema) as SchemaKeywordMapper['schema'] | undefined
          const minSchema = schemas.find((schema) => schema.keyword === schemaKeywords.min) as SchemaKeywordMapper['min'] | undefined
          const maxSchema = schemas.find((schema) => schema.keyword === schemaKeywords.max) as SchemaKeywordMapper['max'] | undefined
          const matchesSchema = schemas.find((schema) => schema.keyword === schemaKeywords.matches) as SchemaKeywordMapper['matches'] | undefined

          let type = schemas
            .map((it) =>
              this.parse(
                {
                  schema,
                  parent: current,
                  name,
                  current: it,
                  siblings: schemas,
                },
                options,
              ),
            )
            .filter(Boolean)[0] as ts.TypeNode

          if (isNullable) {
            type = factory.createUnionDeclaration({
              nodes: [type, factory.keywordTypeNodes.null],
            }) as ts.TypeNode
          }

          if (isNullish && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType as string)) {
            type = factory.createUnionDeclaration({
              nodes: [type, factory.keywordTypeNodes.undefined],
            }) as ts.TypeNode
          }

          if (isOptional && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType as string)) {
            type = factory.createUnionDeclaration({
              nodes: [type, factory.keywordTypeNodes.undefined],
            }) as ts.TypeNode
          }

          const propertyNode = factory.createPropertySignature({
            questionToken: isOptional || isNullish ? ['questionToken', 'questionTokenAndUndefined'].includes(options.optionalType as string) : false,
            name: mappedName,
            type,
            readOnly: isReadonly,
          })

          return factory.appendJSDocToNode({
            node: propertyNode,
            comments: [
              describeSchema ? `@description ${transformers.jsStringEscape(describeSchema.args)}` : undefined,
              deprecatedSchema ? '@deprecated' : undefined,
              minSchema ? `@minLength ${minSchema.args}` : undefined,
              maxSchema ? `@maxLength ${maxSchema.args}` : undefined,
              matchesSchema ? `@pattern ${matchesSchema.args}` : undefined,
              defaultSchema ? `@default ${defaultSchema.args}` : undefined,
              exampleSchema ? `@example ${exampleSchema.args}` : undefined,
              schemaSchema?.args?.type || schemaSchema?.args?.format
                ? [`@type ${schemaSchema?.args?.type || 'unknown'}${!isOptional ? '' : ' | undefined'}`, schemaSchema?.args?.format].filter(Boolean).join(', ')
                : undefined,
            ].filter(Boolean),
          })
        })

      let additionalProperties: any

      if (current.args?.additionalProperties?.length) {
        let additionalPropertiesType = current.args.additionalProperties
          .map((it) => this.parse({ schema, parent: current, name, current: it, siblings: [] }, options))
          .filter(Boolean)
          .at(0) as ts.TypeNode

        const isNullable = current.args?.additionalProperties.some((schema) => isKeyword(schema, schemaKeywords.nullable))
        if (isNullable) {
          additionalPropertiesType = factory.createUnionDeclaration({
            nodes: [additionalPropertiesType, factory.keywordTypeNodes.null],
          }) as ts.TypeNode
        }

        // When there are typed properties alongside additionalProperties, use 'unknown' type
        // for the index signature to avoid TS2411 errors (index signature type conflicts with property types).
        // This occurs commonly in QueryParams where some params are typed (enums, objects) and
        // others are dynamic (additionalProperties with explode=true).
        const hasTypedProperties = properties.length > 0
        const indexSignatureType = hasTypedProperties ? factory.keywordTypeNodes.unknown : additionalPropertiesType

        additionalProperties = factory.createIndexSignature(indexSignatureType)
      }

      let patternProperties: ts.TypeNode | ts.IndexSignatureDeclaration | undefined

      if (current.args?.patternProperties) {
        const allPatternSchemas = Object.values(current.args.patternProperties).flat()

        if (allPatternSchemas.length > 0) {
          patternProperties = allPatternSchemas
            .map((it) => this.parse({ schema, parent: current, name, current: it, siblings: [] }, options))
            .filter(Boolean)
            .at(0) as ts.TypeNode

          const isNullable = allPatternSchemas.some((schema) => isKeyword(schema, schemaKeywords.nullable))
          if (isNullable) {
            patternProperties = factory.createUnionDeclaration({
              nodes: [patternProperties, factory.keywordTypeNodes.null],
            }) as ts.TypeNode
          }

          patternProperties = factory.createIndexSignature(patternProperties)
        }
      }

      return typeKeywordMapper.object([...properties, additionalProperties, patternProperties].filter(Boolean))
    },
    datetime() {
      return typeKeywordMapper.datetime()
    },
    date(tree) {
      const { current } = tree

      return typeKeywordMapper.date(current.args.type)
    },
    time(tree) {
      const { current } = tree

      return typeKeywordMapper.time(current.args.type)
    },
  },
})
