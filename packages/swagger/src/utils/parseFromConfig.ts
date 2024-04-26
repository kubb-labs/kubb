import { resolve } from 'node:path'

import { URLPath } from '@kubb/core/utils'

import { parse } from '@kubb/oas/parser'

import type { Config } from '@kubb/core'
import type { Oas, OasTypes } from '@kubb/oas'
import yaml from '@stoplight/yaml'

export type FormatOptions = Parameters<typeof parse>[1]

export function parseFromConfig(config: Config, options: FormatOptions = {}): Promise<Oas> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument
      return parse(api, options)
    }

    try {
      const api: string = yaml.parse(config.input.data as string) as string

      return parse(api, options)
    } catch (e) {
      /* empty */
    }

    const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument

    return parse(api, options)
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, options)
  }

  return parse(resolve(config.root, config.input.path), options)
}
