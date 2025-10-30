import { resolve } from 'node:path'
import type { Config } from '@kubb/core'
import { URLPath } from '@kubb/core/utils'
import { merge, Oas, type OasTypes, parse } from '@kubb/oas'
import yaml from '@stoplight/yaml'

export function parseFromConfig(config: Config, oasClass: typeof Oas = Oas): Promise<Oas> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument
      return parse(api, { oasClass })
    }

    try {
      const api: string = yaml.parse(config.input.data as string) as string

      return parse(api, { oasClass })
    } catch (_e) {
      /* empty */
    }

    const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument

    return parse(api, { oasClass })
  }

  if (Array.isArray(config.input)) {
    return merge(
      config.input.map((input) => input.path),
      { oasClass },
    )
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, { oasClass })
  }

  return parse(resolve(config.root, config.input.path), { oasClass })
}
