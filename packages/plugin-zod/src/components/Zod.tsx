import type { Printer } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { Const, File, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterZodFactory } from '../printers/printerZod.ts'
import type { PrinterZodMiniFactory } from '../printers/printerZodMini.ts'

type Props = {
  name: string
  node: SchemaNode
  /**
   * Pre-configured printer instance created by the generator.
   * The generator selects `printerZod` or `printerZodMini` based on the `mini` option,
   * then merges in any user-supplied `printer.nodes` overrides.
   */
  printer: Printer<PrinterZodFactory> | Printer<PrinterZodMiniFactory>
  inferTypeName?: string
}

export function Zod({ name, node, printer, inferTypeName }: Props): KubbReactNode {
  const output = printer.print(node)

  if (!output) {
    return
  }

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name}>
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
