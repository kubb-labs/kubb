import { type Config, getDefaultBanner, type Output } from '@kubb/core'
import type { Oas } from '@kubb/oas'
import { isFunction } from 'remeda'

type Props<TOas extends Oas> = {
  oas: TOas
  output: Output<any>
  config?: Config
}

export function getBanner<TOas extends Oas>({ output, oas, config }: Props<TOas>): string {
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
