import type { SchemaNode } from '@kubb/ast/types'
import { Const, File, Type } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PluginZod } from '../types.ts'

type Props = {
  name: string
  node: SchemaNode
  guidType: PluginZod['resolvedOptions']['guidType']
  wrapOutput: PluginZod['resolvedOptions']['wrapOutput']
  description?: string
  inferTypeName?: string
}

export function ZodMini({ name, node, guidType, wrapOutput, description, inferTypeName }: Props): FabricReactNode {
  const printer = printerZodMini({ guidType, wrapOutput })
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
            comments: [description ? `@description ${description}` : undefined].filter(Boolean),
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
