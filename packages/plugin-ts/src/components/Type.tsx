import { collect, narrowSchema, schemaTypes } from '@kubb/ast'
import type { EnumSchemaNode, SchemaNode } from '@kubb/ast/types'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { printerTs } from '../printers/printerTs.ts'
import type { PluginTs } from '../types.ts'
import { Enum, getEnumNames } from './Enum.tsx'

type Props = {
  name: string
  typedName: string
  node: SchemaNode
  optionalType: PluginTs['resolvedOptions']['optionalType']
  arrayType: PluginTs['resolvedOptions']['arrayType']
  enumType: PluginTs['resolvedOptions']['enumType']
  enumTypeSuffix: PluginTs['resolvedOptions']['enumTypeSuffix']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  syntaxType: PluginTs['resolvedOptions']['syntaxType']
  resolver: PluginTs['resolver']
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
  enumTypeSuffix,
  enumKeyCasing,
  description,
  resolver,
}: Props): FabricReactNode {
  const resolvedDescription = description || node?.description
  const enumSchemaNodes = collect<EnumSchemaNode>(node, {
    schema(n): EnumSchemaNode | undefined {
      const enumNode = narrowSchema(n, schemaTypes.enum)
      if (enumNode?.name) return enumNode
    },
  })

  const printer = printerTs({
    optionalType,
    arrayType,
    enumType,
    enumTypeSuffix,
    typeName: name,
    syntaxType,
    description: resolvedDescription,
    keysToOmit,
    resolver,
  })
  const output = printer.print(node)

  if (!output) {
    return
  }

  const enums = [...new Map(enumSchemaNodes.map((n) => [n.name, n])).values()].map((node) => {
    return {
      node,
      ...getEnumNames({ node, enumType, enumTypeSuffix, resolver }),
    }
  })

  // Skip enum exports when using inlineLiteral
  const shouldExportEnums = enumType !== 'inlineLiteral'
  const shouldExportType = enumType === 'inlineLiteral' || enums.every((item) => item.typeName !== name)

  return (
    <>
      {shouldExportEnums &&
        enums.map(({ node }) => <Enum node={node} enumType={enumType} enumTypeSuffix={enumTypeSuffix} enumKeyCasing={enumKeyCasing} resolver={resolver} />)}
      {shouldExportType && (
        <File.Source name={typedName} isTypeOnly isExportable isIndexable>
          {output}
        </File.Source>
      )}
    </>
  )
}
