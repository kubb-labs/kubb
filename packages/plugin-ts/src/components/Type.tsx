import { File } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import { print, type ts } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { type Schema, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Fragment, type ReactNode } from 'react'
import { parse, typeKeywordMapper } from '../parser/index.ts'
import type { PluginTs } from '../types.ts'

type Props = {
  name: string
  typedName: string
  tree: Array<Schema>
  optionalType: PluginTs['resolvedOptions']['optionalType']
  enumType: PluginTs['resolvedOptions']['enumType']
  mapper: PluginTs['resolvedOptions']['mapper']
  description?: string
  keysToOmit?: string[]
}

export function Type({ name, typedName, tree, keysToOmit, optionalType, enumType, mapper, description }: Props): ReactNode {
  const typeNodes: ts.Node[] = []

  if (!tree.length) {
    return ''
  }

  const isNullish = tree.some((item) => item.keyword === schemaKeywords.nullish)
  const isNullable = tree.some((item) => item.keyword === schemaKeywords.nullable)
  const isOptional = tree.some((item) => item.keyword === schemaKeywords.optional)

  let type =
    (tree
      .map((schema) =>
        parse(undefined, schema, {
          name,
          typeName: typedName,
          description,
          keysToOmit,
          optionalType,
          enumType,
          mapper,
        }),
      )
      .filter(Boolean)
      .at(0) as ts.TypeNode) || typeKeywordMapper.undefined()

  if (isNullable) {
    type = factory.createUnionDeclaration({
      nodes: [type, factory.keywordTypeNodes.null],
    }) as ts.TypeNode
  }

  if (isNullish && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
    type = factory.createUnionDeclaration({
      nodes: [type, factory.keywordTypeNodes.undefined],
    }) as ts.TypeNode
  }

  if (isOptional && ['undefined', 'questionTokenAndUndefined'].includes(optionalType as string)) {
    type = factory.createUnionDeclaration({
      nodes: [type, factory.keywordTypeNodes.undefined],
    }) as ts.TypeNode
  }

  const node = factory.createTypeAliasDeclaration({
    modifiers: [factory.modifiers.export],
    name,
    type: keysToOmit?.length
      ? factory.createOmitDeclaration({
          keys: keysToOmit,
          type,
          nonNullable: true,
        })
      : type,
  })

  const enumSchemas = SchemaGenerator.deepSearch(tree, schemaKeywords.enum)

  const enums = enumSchemas.map((enumSchema) => {
    const name = enumType === 'asPascalConst' ? transformers.pascalCase(enumSchema.args.name) : transformers.camelCase(enumSchema.args.name)
    const typeName = enumSchema.args.typeName

    const [nameNode, typeNode] = factory.createEnumDeclaration({
      name,
      typeName,
      enums: enumSchema.args.items
        .map((item) => (item.value === undefined ? undefined : [transformers.trimQuotes(item.name?.toString()), item.value]))
        .filter(Boolean) as unknown as [string, string][],
      type: enumType,
    })

    return {
      nameNode,
      typeNode,
      name,
      typeName,
    }
  })

  typeNodes.push(
    factory.appendJSDocToNode({
      node,
      comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean),
    }),
  )

  return (
    <Fragment>
      {enums.map(({ name, nameNode, typeName, typeNode }, index) => (
        <Fragment key={[name, nameNode].join('-')}>
          {nameNode && (
            <File.Source name={name} isExportable isIndexable>
              {print([nameNode])}
            </File.Source>
          )}
          {
            <File.Source name={typeName} isIndexable isExportable={['enum', 'asConst', 'constEnum', 'literal', undefined].includes(enumType)} isTypeOnly>
              {print([typeNode])}
            </File.Source>
          }
        </Fragment>
      ))}
      {enums.every((item) => item.typeName !== name) && (
        <File.Source name={typedName} isTypeOnly isExportable isIndexable>
          {print(typeNodes)}
        </File.Source>
      )}
    </Fragment>
  )
}
