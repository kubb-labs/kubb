import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { ts } from '@kubb/parser'
import type { Schema, SchemaKeywordMapper, SchemaMapper } from '@kubb/swagger'

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
  lazy: undefined,
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
  tuple: undefined,
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
  literal: undefined,
  datetime: () => factory.keywordTypeNodes.string,
  date: () => factory.createTypeReferenceNode(factory.createIdentifier('Date')),
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
  catchall: (nodes?: ts.TypeNode[]) => {
    if (!nodes) {
      return undefined
    }

    return factory.createIntersectionDeclaration({
      withParentheses: true,
      nodes,
    })
  },
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
  type: undefined,
  format: undefined,
} satisfies SchemaMapper<(ctx?: any) => ts.Node | null | undefined>

type ParserOptions = {
  name: string
  typeName?: string
  /**
   * @default `'questionToken'`
   */
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * @default `'asConst'`
   */
  enumType: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal'
  keysToOmit?: string[]
  mapper?: typeof typeKeywordMapper
}

export function parseTypeMeta(item: Schema, options: ParserOptions): ts.Node | null | undefined {
  const mapper = options.mapper || typeKeywordMapper
  const value = mapper[item.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.union)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['union']
    return value(item.args.map(orItem => parseTypeMeta(orItem, options)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.and)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['and']
    return value(item.args.map(orItem => parseTypeMeta(orItem, options)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.array)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['array']
    return value(item.args.map(orItem => parseTypeMeta(orItem, options)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.catchall)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['catchall']

    return value(item.args.map(orItem => parseTypeMeta(orItem, options)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.enum)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['enum']
    return value(item.args.typeName)
  }

  if (isKeyword(item, schemaKeywords.ref)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['ref']
    return value(item.args.name)
  }

  if (isKeyword(item, schemaKeywords.blob)) {
    return value()
  }

  if (isKeyword(item, schemaKeywords.object)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['object']

    const argsObject = Object.entries(item.args?.entries || '{}')
      .filter((item) => {
        const schemas = item[1]
        return schemas && typeof schemas.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schemas = item[1]

        const isNullish = schemas.some(item => item.keyword === schemaKeywords.nullish)
        const isNullable = schemas.some(item => item.keyword === schemaKeywords.nullable)
        const isOptional = schemas.some(item => item.keyword === schemaKeywords.optional)
        const isReadonly = schemas.some(item => item.keyword === schemaKeywords.readOnly)
        const describe = schemas.find(item => item.keyword === schemaKeywords.describe) as SchemaKeywordMapper['describe'] | undefined
        const deprecated = schemas.find(item => item.keyword === schemaKeywords.deprecated) as SchemaKeywordMapper['deprecated'] | undefined
        const defaultSchema = schemas.find(item => item.keyword === schemaKeywords.default) as SchemaKeywordMapper['default'] | undefined
        const example = schemas.find(item => item.keyword === schemaKeywords.example) as SchemaKeywordMapper['example'] | undefined
        const typeSchema = schemas.find(item => item.keyword === schemaKeywords.type) as SchemaKeywordMapper['type'] | undefined
        const formatSchema = schemas.find(item => item.keyword === schemaKeywords.format) as SchemaKeywordMapper['format'] | undefined

        let type = schemas
          .map((item) => parseTypeMeta(item, options))
          .filter(Boolean)[0] as ts.TypeNode

        if (isNullable) {
          type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.null] }) as ts.TypeNode
        }

        if (isNullish && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType as string)) {
          type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
        }

        if (isOptional && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType as string)) {
          type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
        }

        const propertySignature = factory.createPropertySignature({
          questionToken: isOptional && ['questionToken', 'questionTokenAndUndefined'].includes(options.optionalType as string),
          name,
          type,
          readOnly: isReadonly,
        })

        return factory.appendJSDocToNode({
          node: propertySignature,
          comments: [
            describe ? `@description ${transformers.stringify(describe.args)}` : undefined,
            deprecated ? `@deprecated` : undefined,
            defaultSchema
              ? `@default ${typeof defaultSchema.args === 'number' ? defaultSchema.args : transformers.stringify(defaultSchema.args as string)}`
              : undefined,
            example ? `@example ${transformers.stringify(example.args)}` : undefined,
            typeSchema
              ? `@type ${transformers.stringify(typeSchema.args)}${!isOptional ? '' : ' | undefined'} ${formatSchema?.args || ''}`
              : undefined,
          ].filter(Boolean),
        })
      })

    return value(argsObject)
  }

  if (item.keyword in mapper) {
    return value()
  }

  return undefined
}

export function typeParser(
  schemas: Schema[],
  options: ParserOptions,
): string {
  const nodes: ts.Node[] = []

  if (!schemas.length) {
    return ''
  }

  const isNullish = schemas.some(item => item.keyword === schemaKeywords.nullish)
  const isNullable = schemas.some(item => item.keyword === schemaKeywords.nullable)
  const isOptional = schemas.some(item => item.keyword === schemaKeywords.optional)
  const describe = schemas.find(item => item.keyword === schemaKeywords.describe) as SchemaKeywordMapper['describe'] | undefined
  const deprecated = schemas.find(item => item.keyword === schemaKeywords.deprecated) as SchemaKeywordMapper['deprecated'] | undefined
  const defaultSchema = schemas.find(item => item.keyword === schemaKeywords.default) as SchemaKeywordMapper['default'] | undefined
  const example = schemas.find(item => item.keyword === schemaKeywords.example) as SchemaKeywordMapper['example'] | undefined
  const typeSchema = schemas.find(item => item.keyword === schemaKeywords.type) as SchemaKeywordMapper['type'] | undefined
  const formatSchema = schemas.find(item => item.keyword === schemaKeywords.format) as SchemaKeywordMapper['format'] | undefined
  const findEnum = (items: Schema[]): SchemaKeywordMapper['enum'] | undefined => {
    let foundItem: Schema | undefined = undefined

    items.forEach(item => {
      if (item.keyword === schemaKeywords.enum) {
        foundItem = item
      }

      if (item.keyword === schemaKeywords.object) {
        const subItem = item as SchemaKeywordMapper['object']
        return Object.values(subItem.args.entries).forEach(entrySchema => {
          foundItem = findEnum(entrySchema)
        })
      }
    })

    return foundItem
  }

  const enumSchema = findEnum(schemas)

  let type = schemas.map((schema) => parseTypeMeta(schema, options)).filter(Boolean).at(0) as ts.TypeNode
    || typeKeywordMapper.undefined()

  if (isNullable) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.null] }) as ts.TypeNode
  }

  if (isNullish && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType as string)) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
  }

  if (isOptional && ['undefined', 'questionTokenAndUndefined'].includes(options.optionalType as string)) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
  }

  const node = factory.createTypeAliasDeclaration({
    modifiers: [factory.modifiers.export],
    name: options.name,
    type: options.keysToOmit?.length ? factory.createOmitDeclaration({ keys: options.keysToOmit, type, nonNullable: true }) : type,
  })

  if (enumSchema) {
    nodes.push(...factory.createEnumDeclaration({
      name: transformers.camelCase(enumSchema.args.name),
      typeName: enumSchema.args.typeName,
      enums: enumSchema.args.items.map(item => item.value === undefined ? undefined : [item.name, item.value]).filter(Boolean) as unknown as [
        string,
        string,
      ][],
      type: options.enumType,
    }))
  }

  nodes.push(
    factory.appendJSDocToNode({
      node,
      comments: [
        describe ? `@description ${transformers.stringify(describe.args)}` : undefined,
        deprecated ? `@deprecated` : undefined,
        defaultSchema
          ? `@default ${typeof defaultSchema.args === 'number' ? defaultSchema.args : transformers.stringify(defaultSchema.args as string)}`
          : undefined,
        example ? `@example ${transformers.stringify(example.args)}` : undefined,
        typeSchema
          ? `@type ${transformers.stringify(typeSchema.args)}${!isOptional ? '' : ' | undefined'} ${formatSchema?.args || ''}`
          : undefined,
      ].filter(Boolean),
    }),
  )

  return print(nodes)
}
