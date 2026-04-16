import { ast } from '@kubb/core'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterTsFactory } from '../printers/printerTs.ts'
import type { PluginTs } from '../types.ts'
import { Enum, getEnumNames } from './Enum.tsx'

type Props = {
  name: string
  node: ast.SchemaNode
  /**
   * Pre-configured printer instance created by the generator.
   * Created with `printerTs({ ..., nodes: options.printer?.nodes })`.
   */
  printer: ast.Printer<PrinterTsFactory>
  enumType: PluginTs['resolvedOptions']['enumType']
  enumTypeSuffix: PluginTs['resolvedOptions']['enumTypeSuffix']
  enumKeyCasing: PluginTs['resolvedOptions']['enumKeyCasing']
  resolver: PluginTs['resolver']
}

export function Type({ name, node, printer, enumType, enumTypeSuffix, enumKeyCasing, resolver }: Props): KubbReactNode {
  const enumSchemaNodes = ast.collect<ast.EnumSchemaNode>(node, {
    schema(n): ast.EnumSchemaNode | undefined {
      const enumNode = ast.narrowSchema(n, ast.schemaTypes.enum)
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
