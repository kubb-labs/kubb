import type { Output } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { isFunction } from 'remeda'

type Props = {
  oas: Oas
  output: Output<Oas>
}

export function getFooter({ output, oas }: Props) {
  if (!output.footer) {
    return undefined
  }

  if (isFunction(output.footer)) {
    return output.footer(oas)
  }

  return output.footer
}
