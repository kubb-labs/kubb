import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { ts } from '@kubb/parser'
import type { Schema, SchemaMapper } from '@kubb/swagger'

export const typeKeywordMapper = {
  any: () => factory.keywordTypeNodes.any,
  unknown: () => factory.keywordTypeNodes.unknown,
  number: () => factory.keywordTypeNodes.number,
  integer: () => factory.keywordTypeNodes.number,
  object: () => factory.keywordTypeNodes.object,
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
  enum: undefined,
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
  catchall: undefined,
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
} satisfies SchemaMapper<(ctx?: any) => ts.Node | null | undefined>

export function parseTypeMeta(item: Schema = {} as Schema, mapper: typeof typeKeywordMapper = typeKeywordMapper): ts.Node | null | undefined {
  const value = mapper[item.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.union)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['union']
    return value(item.args.map(orItem => parseTypeMeta(orItem, mapper)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.and)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['and']
    return value(item.args.map(orItem => parseTypeMeta(orItem, mapper)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.array)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['array']
    return value(item.args.map(orItem => parseTypeMeta(orItem, mapper)).filter(Boolean) as ts.TypeNode[])
  }

  if (isKeyword(item, schemaKeywords.ref)) {
    const value = mapper[item.keyword as keyof typeof mapper] as typeof typeKeywordMapper['ref']
    return value(item.args.name)
  }

  if (isKeyword(item, schemaKeywords.blob)) {
    return value()
  }
  // TODO for object: loop over all keyword and search for describe, default, .. and use appendJSDocToNode
  // TOOD check on undfined and optionalType

  if (item.keyword in mapper) {
    return value()
  }

  return undefined
}

// TODO required should be part of the items(schema), we can append those when calling zodParser instead of options, same for description, ...
// omit then all the schema items that have already been used + create extraNodes when needed(enum)
export function typeParser(
  items: Schema[],
  options: { name: string; description?: string; required?: boolean; keysToOmit?: string[]; mapper?: typeof typeKeywordMapper },
): string {
  const nodes: ts.Node[] = []

  if (!items.length) {
    return ''
  }

  // TODO for object: loop over all keyword and search for describe, default, .. and use appendJSDocToNode
  // TOOD check on undfined and optionalType

  let type = items.map((item) => parseTypeMeta(item, { ...typeKeywordMapper, ...options.mapper })).filter(Boolean).at(0) as ts.TypeNode
    || typeKeywordMapper.undefined()

  if (!options.required) {
    type = factory.createUnionDeclaration({ nodes: [type, factory.keywordTypeNodes.undefined] }) as ts.TypeNode
  }

  const node = factory.createTypeAliasDeclaration({
    modifiers: [factory.modifiers.export],
    name: options.name,
    type: options.keysToOmit?.length ? factory.createOmitDeclaration({ keys: options.keysToOmit, type, nonNullable: true }) : type,
  })

  if (options.description) {
    nodes.push(
      factory.appendJSDocToNode({
        node,
        comments: [`@description ${transformers.trim(options.description)}`],
      }),
    )
  } else {
    nodes.push(node)
  }

  return print(nodes)
}
