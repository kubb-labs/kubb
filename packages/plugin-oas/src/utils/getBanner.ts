import { getDefaultBanner, type Config, type Output } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { isFunction } from 'remeda'

type Props = {
  oas: Oas
  output: Output<Oas>
  config?: Config
}

export function getBanner({ output, oas, config }: Props) {
  let banner = ''
  if (config?.output?.defaultBanner !== false && config) {
    const { title, description, version } = oas.api?.info || {}

    banner = getDefaultBanner({ title, description, version, config })
  }

  if (!output.banner) {
    return banner
  }

  if (isFunction(output.banner)) {
    return `${output.banner(oas)}\n${banner}`
  }

  return `${output.banner}\n${banner}`
}
