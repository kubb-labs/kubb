import { collect, narrowSchema, schemaTypes } from '@kubb/ast'
import type { Printer } from '@kubb/ast'
import type { EnumSchemaNode, SchemaNode } from '@kubb/ast/types'
import { File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { TsPrinterFactory } from '../printers/printerTs.ts'
import type { PluginTs } from '../types.ts'
import { Enum, getEnumNames } from './Enum.tsx'

type Props = {
  name: string
  node: SchemaNode
  /**
   * Pre-configured printer instance created by the generator.
   * Created with `printerTs({ ..., nodes: options.printer?.nodes })`.
   */
  printer: Printer<TsPrinterFactory>
  enumType: PluginTs['resolvedOptions']['enumType']
  enumTypeSuffix: PluginTs['resolvedOptions']['enumTypeSuffix']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  resolver: PluginTs['resolver']
}

export function Type({
  name,
  node,
  printer,
  enumType,
  enumTypeSuffix,
  enumKeyCasing,
  resolver,
}: Props): FabricReactNode {
  const enumSchemaNodes = collect<EnumSchemaNode>(node, {
    schema(n): EnumSchemaNode | undefined {
      const enumNode = narrowSchema(n, schemaTypes.enum)
      if (enumNode?.name) return enumNode
    },
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
        <File.Source name={name} isTypeOnly isExportable isIndexable>
          {output}
        </File.Source>
      )}
    </>
  )
}
