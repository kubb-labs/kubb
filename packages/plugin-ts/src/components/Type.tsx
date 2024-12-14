import { File } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import { print } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { createTypeDeclaration } from '@kubb/parser-ts/factory'
import { type Schema, SchemaGenerator, isKeyword, schemaKeywords } from '@kubb/plugin-oas'
import { Fragment, type ReactNode } from 'react'
import type ts from 'typescript'
import { parse, typeKeywordMapper } from '../parser.ts'
import type { PluginTs } from '../types.ts'

type Props = {
  name: string
  typedName: string
  tree: Array<Schema>
  optionalType: PluginTs['resolvedOptions']['optionalType']
  enumType: PluginTs['resolvedOptions']['enumType']
  mapper: PluginTs['resolvedOptions']['mapper']
  syntaxType: PluginTs['resolvedOptions']['syntaxType']
  description?: string
  keysToOmit?: string[]
}

export function Type({ name, typedName, tree, keysToOmit, optionalType, syntaxType, enumType, mapper, description }: Props): ReactNode {
  const typeNodes: ts.Node[] = []

  if (!tree.length) {
    return ''
  }

  const schema = tree.find((item) => item.keyword === schemaKeywords.schema)

  let type =
    (tree
      .map((schema, _index, siblings) =>
        parse(
          { parent: undefined, current: schema, siblings },
          {
            name,
            typedName,
            description,
            keysToOmit,
            optionalType,
            enumType,
            mapper,
            syntaxType,
          },
        ),
      )
      .filter(Boolean)
      .at(0) as ts.TypeNode) || typeKeywordMapper.undefined()

  if (schema && isKeyword(schema, schemaKeywords.schema) && schema.args.type !== 'object') {
    const isNullish = tree.some((item) => item.keyword === schemaKeywords.nullish)
    const isNullable = tree.some((item) => item.keyword === schemaKeywords.nullable)
    const isOptional = tree.some((item) => item.keyword === schemaKeywords.optional)

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
  }

  const useTypeGeneration = syntaxType === 'type' || [factory.syntaxKind.union].includes(type.kind as typeof factory.syntaxKind.union) || !!keysToOmit?.length

  typeNodes.push(
    createTypeDeclaration({
      name,
      isExportable: true,
      type: keysToOmit?.length
        ? factory.createOmitDeclaration({
            keys: keysToOmit,
            type,
            nonNullable: true,
          })
        : type,
      syntax: useTypeGeneration ? 'type' : 'interface',
      description: description ? transformers.jsStringEscape(description) : undefined,
    }),
  )

  const enumSchemas = SchemaGenerator.deepSearch(tree, schemaKeywords.enum)

  const enums = [...new Set(enumSchemas)].map((enumSchema) => {
    const name = enumType === 'asPascalConst' ? transformers.pascalCase(enumSchema.args.name) : transformers.camelCase(enumSchema.args.name)
    const typeName = enumSchema.args.typeName

    const [nameNode, typeNode] = factory.createEnumDeclaration({
      name,
      typeName,
      enums: enumSchema.args.items
        .map((item) => (item.value === undefined ? undefined : [transformers.trimQuotes(item.name?.toString()), item.value]))
        .filter(Boolean) as unknown as Array<[string, string]>,
      type: enumType,
    })

    return {
      nameNode,
      typeNode,
      name,
      typeName,
    }
  })

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
            <File.Source
              name={typeName}
              isIndexable
              isExportable={['enum', 'asConst', 'constEnum', 'literal', undefined].includes(enumType)}
              isTypeOnly={['asConst', 'constEnum', 'literal', undefined].includes(enumType)}
            >
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
