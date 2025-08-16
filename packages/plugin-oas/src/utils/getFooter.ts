import type { Output } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { isFunction } from 'remeda'

type Props<TOas extends Oas> = {
  oas: TOas
  output: Output<any>
}

export function getFooter<TOas extends Oas>({ output, oas }: Props<TOas>) {
  if (!output.footer) {
    return undefined
  }

  if (isFunction(output.footer)) {
    return output.footer(oas)
  }

  return output.footer
}
