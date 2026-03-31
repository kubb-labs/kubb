import { jsStringEscape } from '@internals/utils'
import type { SchemaNode } from '@kubb/ast/types'
import { Const, File, Type } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { printerZod } from '../printers/printerZod.ts'
import type { PluginZod, ResolverZod } from '../types.ts'

type Props = {
  name: string
  node: SchemaNode
  coercion: PluginZod['resolvedOptions']['coercion']
  guidType: PluginZod['resolvedOptions']['guidType']
  wrapOutput: PluginZod['resolvedOptions']['wrapOutput']
  description?: string
  inferTypeName?: string
  resolver?: ResolverZod
  keysToOmit?: Array<string>
}

export function Zod({ name, node, coercion, guidType, wrapOutput, description, inferTypeName, resolver, keysToOmit }: Props): FabricReactNode {
  const printer = printerZod({ coercion, guidType, wrapOutput, resolver, schemaName: name, keysToOmit })
  const output = printer.print(node)

  if (!output) {
    return
  }

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const
          export
          name={name}
          JSDoc={{
            comments: [description ? `@description ${jsStringEscape(description)}` : undefined].filter(Boolean),
          }}
        >
          {output}
        </Const>
      </File.Source>
      {inferTypeName && (
        <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
          <Type export name={inferTypeName}>
            {`z.infer<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
    </>
  )
}
