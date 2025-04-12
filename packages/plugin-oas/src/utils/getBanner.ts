import type { Output } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { isFunction } from 'remeda'

type Props = {
  oas: Oas
  output: Output<Oas>
}

export function getBanner({ output, oas }: Props) {
  if (!output.banner) {
    return undefined
  }

  if (isFunction(output.banner)) {
    return output.banner(oas)
  }

  return output.banner
}
