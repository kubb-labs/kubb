import { Oas } from '@kubb/plugin-oas/components'
import { File, useApp } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import { print, type ts } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { useSchema } from '@kubb/plugin-oas/hooks'
import { Fragment, type ReactNode } from 'react'
import { parse, typeKeywordMapper } from '../parser/index.ts'
import { pluginTsName } from '../plugin.ts'
import type { PluginTs } from '../types.ts'

type Props = {
  description?: string
  keysToOmit?: string[]
}

export function Schema(props: Props): ReactNode {
  const { keysToOmit, description } = props
  const { tree, name } = useSchema()
  const {
    pluginManager,
    plugin: {
      options: { mapper, enumType, optionalType },
    },
  } = useApp<PluginTs>()

  // all checks are also inside this.schema(React)
  const resolvedName = pluginManager.resolveName({
    name,
    pluginKey: [pluginTsName],
    type: 'function',
  })

  const typeName = pluginManager.resolveName({
    name,
    pluginKey: [pluginTsName],
    type: 'type',
  })

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
          name: resolvedName,
          typeName,
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
    name: resolvedName,
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
    const name = transformers.camelCase(enumSchema.args.name)
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

  // const filterdNodes = typeNodes.filter(
  //   (node: ts.Node) =>
  //     !enumNodes.some(
  //       (extraNode: ts.Node) => (extraNode as ts.TypeAliasDeclaration)?.name?.escapedText === (node as ts.TypeAliasDeclaration)?.name?.escapedText,
  //     ),
  // )

  return (
    <Fragment>
      {enums.map(({ name, nameNode, typeName, typeNode }, index) => (
        <Fragment key={index}>
          {nameNode && (
            <File.Source name={name} isExportable>
              {print(nameNode)}
            </File.Source>
          )}
          <File.Source name={typeName} isExportable isTypeOnly>
            {print(typeNode)}
          </File.Source>
        </Fragment>
      ))}
      {enums.every((item) => item.typeName !== resolvedName) && (
        <File.Source name={typeName} isTypeOnly isExportable>
          {print(typeNodes)}
        </File.Source>
      )}
    </Fragment>
  )
}

type FileProps = {}

Schema.File = function ({}: FileProps): ReactNode {
  const { pluginManager } = useApp<PluginTs>()
  const { schema } = useSchema()

  return (
    <Oas.Schema.File output={pluginManager.config.output.path}>
      <Schema description={schema?.description} />
    </Oas.Schema.File>
  )
}
