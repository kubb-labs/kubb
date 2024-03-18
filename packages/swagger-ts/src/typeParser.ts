import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { isKeyword, schemaKeywords } from '@kubb/swagger'

import type { ts } from '@kubb/parser'
import type { Schema, SchemaMapper } from '@kubb/swagger'

export const typeKeywordMapper = {
  any: factory.keywordTypeNodes.any,
  unknown: factory.keywordTypeNodes.unknown,
  number: factory.keywordTypeNodes.number,
  integer: factory.keywordTypeNodes.number,
  object: factory.keywordTypeNodes.object,
  lazy: undefined,
  string: factory.keywordTypeNodes.string,
  boolean: factory.keywordTypeNodes.boolean,
  undefined: factory.keywordTypeNodes.undefined,
  nullable: undefined,
  null: factory.keywordTypeNodes.null,
  nullish: undefined,
  array: undefined,
  tuple: undefined,
  enum: undefined,
  union: undefined,
  literal: undefined,
  datetime: undefined,
  date: undefined,
  uuid: undefined,
  url: undefined,
  strict: undefined,
  default: undefined,
  and: undefined,
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
  ref: undefined,

  blob: factory.createTypeReferenceNode('Blob', []),
} satisfies SchemaMapper<ts.Node>

export function parseTypeMeta(item: Schema = {} as Schema, mapper: SchemaMapper<ts.Node> = typeKeywordMapper): ts.Node | undefined {
  const value = mapper[item.keyword as keyof typeof mapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(item, schemaKeywords.blob)) {
    return value
  }

  if (item.keyword in mapper) {
    return value
  }

  return undefined
}

export function typeParser(
  items: Schema[],
  options: { name: string; required?: boolean; keysToOmit?: string[]; mapper?: SchemaMapper<ts.Node> },
): string {
  if (!items.length) {
    return ``
  }

  const type = items.map((item) => parseTypeMeta(item, { ...typeKeywordMapper, ...options.mapper })).filter(Boolean).at(0) as ts.TypeNode

  const node = factory.createTypeAliasDeclaration({
    modifiers: [factory.modifiers.export],
    name: options.name,
    type: options.keysToOmit?.length ? factory.createOmitDeclaration({ keys: options.keysToOmit, type, nonNullable: true }) : type,
  })

  const nodes = [node]

  return print(nodes)
}
