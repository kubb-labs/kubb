import transformers from '@kubb/core/transformers'
import * as factory from '@kubb/parser-ts/factory'
import { isKeyword, schemaKeywords } from '@kubb/plugin-oas'

import type { ts } from '@kubb/parser-ts'
import type { Schema, SchemaKeywordMapper, SchemaMapper } from '@kubb/plugin-oas'

export const typeKeywordMapper = {
  any: () => factory.keywordTypeNodes.any,
  unknown: () => factory.keywordTypeNodes.unknown,
  number: () => factory.keywordTypeNodes.number,
  integer: () => factory.keywordTypeNodes.number,
  object: (nodes?: ts.TypeElement[]) => {
    if (!nodes) {
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
  tuple: (nodes?: ts.TypeNode[]) => {
    if (!nodes) {
      return undefined
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
  const: (name?: string | number, format?: 'string' | 'number') => {
    if (!name) {
      return undefined
    }

    if (format === 'number') {
      return factory.createLiteralTypeNode(factory.createNumericLiteral(name))
    }

    return factory.createLiteralTypeNode(factory.createStringLiteral(name.toString()))
  },
  datetime: () => factory.keywordTypeNodes.string,
  date: (type: 'date' | 'string' = 'string') =>
    type === 'string' ? factory.keywordTypeNodes.string : factory.createTypeReferenceNode(factory.createIdentifier('Date')),
  time: (type: 'date' | 'string' = 'string') =>
    type === 'string' ? factory.keywordTypeNodes.string : factory.createTypeReferenceNode(factory.createIdentifier('Date')),
  uuid: undefined,
  url: undefined,
  strict: undefined,
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
  matches: undefined,
  email: undefined,
  firstName: undefined,
  lastName: undefined,
  password: undefined,
  phone: undefined,
  readOnly: undefined,
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
} satisfies SchemaMapper<ts.Node | null | undefined>

type ParserOptions = {
  name: string
  typeName?: string
  description?: string
  /**
   * @default `'questionToken'`
   */
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * @default `'asConst'`
   */
  enumType: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  keysToOmit?: string[]
  mapper?: SchemaMapper
}

export function parse(parent: Schema | undefined, current: Schema, options: ParserOptions): ts.Node | null | undefined {
  const value = typeKeywordMapper[current.keyword as keyof typeof typeKeywordMapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    return typeKeywordMapper.union(current.args.map((schema) => parse(current, schema, options)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(current, schemaKeywords.and)) {
    return typeKeywordMapper.and(current.args.map((schema) => parse(current, schema, options)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return typeKeywordMapper.array(current.args.items.map((schema) => parse(current, schema, options)).filter(Boolean) as ts.TypeNode[])
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
    return typeKeywordMapper.tuple(current.args.map((schema) => parse(current, schema, options)).filter(Boolean) as ts.TypeNode[])
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
      .map(([_name, schemas]) => {
        let name = _name
        const nameSchema = schemas.find((schema) => schema.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']

        if (nameSchema) {
          name = nameSchema.args
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

        let type = schemas.map((schema) => parse(current, schema, options)).filter(Boolean)[0] as ts.TypeNode

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
          name,
          type,
          readOnly: isReadonly,
        })

        return factory.appendJSDocToNode({
          node: propertySignature,
          comments: [
            describeSchema ? `@description ${transformers.jsStringEscape(describeSchema.args)}` : undefined,
            deprecatedSchema ? '@deprecated' : undefined,
            defaultSchema ? `@default ${defaultSchema.args}` : undefined,
            exampleSchema ? `@example ${exampleSchema.args}` : undefined,
            schemaSchema?.args?.type || schemaSchema?.args?.format
              ? [`@type ${schemaSchema?.args?.type || 'unknown'}${!isOptional ? '' : ' | undefined'}`, schemaSchema?.args?.format].filter(Boolean).join(', ')
              : undefined,
          ].filter(Boolean),
        })
      })

    const additionalProperties = current.args?.additionalProperties?.length
      ? factory.createIndexSignature(
          current.args.additionalProperties
            .map((schema) => parse(current, schema, options))
            .filter(Boolean)
            .at(0) as ts.TypeNode,
        )
      : undefined

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
