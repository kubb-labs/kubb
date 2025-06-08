import transformers from '@kubb/core/transformers'
import * as factory from '@kubb/parser-ts/factory'
import type { SchemaKeywordMapper, SchemaMapper } from '@kubb/plugin-oas'
import { isKeyword, type SchemaTree, schemaKeywords } from '@kubb/plugin-oas'
import type ts from 'typescript'

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
  array: (nodes?: ts.TypeNode[]) => {
    if (!nodes) {
      return undefined
    }

    return factory.createArrayDeclaration({ nodes })
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
    if (!name) {
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
} satisfies SchemaMapper<ts.Node | null | undefined>

type ParserOptions = {
  name: string
  typedName?: string
  description?: string
  /**
   * @default `'questionToken'`
   */
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * @default `'asConst'`
   * asPascalConst is deprecated
   */
  enumType: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  syntaxType: 'type' | 'interface'
  keysToOmit?: string[]
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
export function parse({ current, siblings, name }: SchemaTree, options: ParserOptions): ts.Node | null | undefined {
  const value = typeKeywordMapper[current.keyword as keyof typeof typeKeywordMapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    return typeKeywordMapper.union(
      current.args.map((schema) => parse({ parent: current, name: name, current: schema, siblings }, options)).filter(Boolean) as ts.TypeNode[],
    )
  }

  if (isKeyword(current, schemaKeywords.and)) {
    return typeKeywordMapper.and(
      current.args.map((schema) => parse({ parent: current, name: name, current: schema, siblings }, options)).filter(Boolean) as ts.TypeNode[],
    )
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return typeKeywordMapper.array(
      current.args.items.map((schema) => parse({ parent: current, name: name, current: schema, siblings }, options)).filter(Boolean) as ts.TypeNode[],
    )
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    return typeKeywordMapper.enum(current.args.typeName)
  }

  if (isKeyword(current, schemaKeywords.ref)) {
    return typeKeywordMapper.ref(current.args.name)
  }

  if (isKeyword(current, schemaKeywords.blob)) {
    return value()
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    return typeKeywordMapper.tuple(
      current.args.items.map((schema) => parse({ parent: current, name: name, current: schema, siblings }, options)).filter(Boolean) as ts.TypeNode[],
      current.args.rest && ((parse({ parent: current, name: name, current: current.args.rest, siblings }, options) ?? undefined) as ts.TypeNode | undefined),
      current.args.min,
      current.args.max,
    )
  }

  if (isKeyword(current, schemaKeywords.const)) {
    return typeKeywordMapper.const(current.args.name, current.args.format)
  }

  if (isKeyword(current, schemaKeywords.object)) {
    const properties = Object.entries(current.args?.properties || {})
      .filter((item) => {
        const schemas = item[1]
        return schemas && typeof schemas.map === 'function'
      })
      .map(([name, schemas]) => {
        const nameSchema = schemas.find((schema) => schema.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']
        const mappedName = nameSchema?.args || name

        // custom mapper(pluginOptions)
        if (options.mapper?.[mappedName]) {
          return options.mapper?.[mappedName]
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
          .map((schema) =>
            parse(
              {
                parent: current,
                name: name,
                current: schema,
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

        const propertySignature = factory.createPropertySignature({
          questionToken: isOptional || isNullish ? ['questionToken', 'questionTokenAndUndefined'].includes(options.optionalType as string) : false,
          name: mappedName,
          type,
          readOnly: isReadonly,
        })

        return factory.appendJSDocToNode({
          node: propertySignature,
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
      additionalProperties = current.args.additionalProperties
        .map((schema) => parse({ parent: current, name: name, current: schema, siblings }, options))
        .filter(Boolean)
        .at(0) as ts.TypeNode

      const isNullable = current.args?.additionalProperties.some((schema) => isKeyword(schema, schemaKeywords.nullable))
      if (isNullable) {
        additionalProperties = factory.createUnionDeclaration({
          nodes: [additionalProperties, factory.keywordTypeNodes.null],
        }) as ts.TypeNode
      }

      additionalProperties = factory.createIndexSignature(additionalProperties)
    }

    return typeKeywordMapper.object([...properties, additionalProperties].filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.datetime)) {
    return typeKeywordMapper.datetime()
  }

  if (isKeyword(current, schemaKeywords.date)) {
    return typeKeywordMapper.date(current.args.type)
  }

  if (isKeyword(current, schemaKeywords.time)) {
    return typeKeywordMapper.time(current.args.type)
  }
  if (current.keyword in typeKeywordMapper) {
    return value()
  }

  return undefined
}
