import { Oas } from '@kubb/plugin-oas/components'
import { File, useApp } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import { print, type ts } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'
import { SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { useSchema } from '@kubb/plugin-oas/hooks'
import type { ReactNode } from 'react'
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

  const nodes: ts.Node[] = []
  const extraNodes: ts.Node[] = []

  if (!tree.length) {
    return ''
  }

  const isNullish = tree.some((item) => item.keyword === schemaKeywords.nullish)
  const isNullable = tree.some((item) => item.keyword === schemaKeywords.nullable)
  const isOptional = tree.some((item) => item.keyword === schemaKeywords.optional)

  let type =
    (tree
      .map((schema) => parse(undefined, schema, { name: resolvedName, typeName, description, keysToOmit, optionalType, enumType, mapper }))
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
  if (enumSchemas) {
    ;[...new Set(enumSchemas)].forEach((enumSchema) => {
      extraNodes.push(
        ...factory.createEnumDeclaration({
          name: transformers.camelCase(enumSchema.args.name),
          typeName: enumSchema.args.typeName,
          enums: enumSchema.args.items
            .map((item) => (item.value === undefined ? undefined : [transformers.trimQuotes(item.name?.toString()), item.value]))
            .filter(Boolean) as unknown as [string, string][],
          type: enumType,
        }),
      )
    })
  }

  nodes.push(
    factory.appendJSDocToNode({
      node,
      comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean),
    }),
  )

  const filterdNodes = nodes.filter(
    (node: ts.Node) =>
      !extraNodes.some(
        (extraNode: ts.Node) => (extraNode as ts.TypeAliasDeclaration)?.name?.escapedText === (node as ts.TypeAliasDeclaration)?.name?.escapedText,
      ),
  )

  return print([...extraNodes, ...filterdNodes])
}

type FileProps = {}

Schema.File = function ({}: FileProps): ReactNode {
  const { pluginManager } = useApp<PluginTs>()
  const { schema } = useSchema()

  return (
    <Oas.Schema.File output={pluginManager.config.output.path} isTypeOnly>
      <File.Source>
        <Schema description={schema?.description} />
      </File.Source>
    </Oas.Schema.File>
  )
}
