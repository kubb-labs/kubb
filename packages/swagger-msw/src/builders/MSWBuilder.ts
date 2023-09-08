/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { OasBuilder } from '@kubb/swagger'

import type { PluginContext } from '@kubb/core'
import type { Operation } from '@kubb/swagger'
import { URLPath } from '../../../core/src/utils/URLPath'

type Config = {
  operation: Operation
  resolveName: PluginContext['resolveName']
  resolvePath: PluginContext['resolvePath']
  responseName?: string
}

export class MSWBuilder extends OasBuilder<Config> {
  configure(config: Config) {
    this.config = config

    return this
  }

  private get mock(): string {
    const { resolveName, responseName, operation } = this.config
    const name = resolveName({ name: `${operation.getOperationId()}` })

    return `

    export const ${name}Handler = rest.get('*${URLPath.toURLPath(operation.path)}', function handler(req, res, ctx) {
      return res(
        ctx.json(${responseName}()),
      )
    })
    
    `
  }

  print(): string {
    const codes: string[] = []

    codes.push(this.mock)

    return codes.join('\n')
  }
}
