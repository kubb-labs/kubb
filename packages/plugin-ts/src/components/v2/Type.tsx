import { collect } from '@kubb/ast'
import type { EnumSchemaNode, SchemaNode } from '@kubb/ast/types'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { printerTs } from '../../printer.ts'
import type { PluginTs } from '../../types.ts'
import { Enum, getEnumNames } from './Enum.tsx'

type Props = {
  name: string
  typedName: string
  node: SchemaNode
  optionalType: PluginTs['resolvedOptions']['optionalType']
  arrayType: PluginTs['resolvedOptions']['arrayType']
  enumType: PluginTs['resolvedOptions']['enumType']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  syntaxType: PluginTs['resolvedOptions']['syntaxType']
  mapper?: PluginTs['resolvedOptions']['mapper']
  description?: string
  keysToOmit?: string[]
}

export function Type({
  name,
  typedName,
  node,
  keysToOmit,
  optionalType,
  arrayType,
  syntaxType,
  enumType,
  enumKeyCasing,
  mapper,
  ...rest
}: Props): FabricReactNode {
  const description = rest.description || node?.description
  const enumSchemaNodes = collect<EnumSchemaNode>(node, {
    schema(n): EnumSchemaNode | undefined {
      if (n.type === 'enum' && n.name) return n as EnumSchemaNode
    },
  })

  const printer = printerTs({ optionalType, arrayType, enumType, mapper, typeName: name, syntaxType, description, keysToOmit })
  const typeNode = printer.print(node)

  if (!typeNode) {
    return
  }

  const enums = [...new Map(enumSchemaNodes.map((n) => [n.name, n])).values()].map((enumSchemaNode) => {
    return {
      enumSchemaNode,
      ...getEnumNames(enumSchemaNode, enumType),
    }
  })

  // Skip enum exports when using inlineLiteral
  const shouldExportEnums = enumType !== 'inlineLiteral'
  const shouldExportType = enumType === 'inlineLiteral' || enums.every((item) => item.typeName !== name)

  return (
    <>
      {shouldExportEnums &&
        enums.map(({ enumSchemaNode }) => (
          <Enum enumSchemaNode={enumSchemaNode} enumType={enumType} enumKeyCasing={enumKeyCasing} />
        ))}
      {shouldExportType && (
        <File.Source name={typedName} isTypeOnly isExportable isIndexable>
          {safePrint(typeNode)}
        </File.Source>
      )}
    </>
  )
}
