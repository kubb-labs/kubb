import { getDefaultBanner, type Config, type Output } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { isFunction } from 'remeda'

type Props = {
  oas: Oas
  output: Output<Oas>
  config?: Config
}

export function getBanner({ output, oas, config }: Props) {
  if (config?.output?.addDefaultBanner === true) {
    return getDefaultBanner(oas, config.input)
  }

  if (!output.banner) {
    return undefined;
  }

  if (isFunction(output.banner)) {
    return output.banner(oas)
  }

  return output.banner
}
