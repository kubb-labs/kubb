import { resolve } from 'node:path'

import { URLPath } from '@kubb/core/utils'

import { type FormatOptions, parse } from '@kubb/oas/parser'

import type { Config } from '@kubb/core'
import { Oas, type OasTypes } from '@kubb/oas'
import yaml from '@stoplight/yaml'

export function parseFromConfig(config: Config, options: FormatOptions = {}, oasClass: typeof Oas = Oas): Promise<Oas> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument
      return parse(api, options, oasClass)
    }

    try {
      const api: string = yaml.parse(config.input.data as string) as string

      return parse(api, options, oasClass)
    } catch (e) {
      /* empty */
    }

    const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument

    return parse(api, options, oasClass)
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, options, oasClass)
  }

  return parse(resolve(config.root, config.input.path), options, oasClass)
}
