/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { combineCodes, URLPath } from '@kubb/core'
import { OasBuilder } from '@kubb/swagger'

import type { PluginContext } from '@kubb/core'
import type { Operation } from '@kubb/swagger'

type Config = {
  operation: Operation
  resolveName: PluginContext['resolveName']
  resolvePath: PluginContext['resolvePath']
  responseName?: string
}

type MSWResult = { code: string; name: string }

export class MSWBuilder extends OasBuilder<Config> {
  configure(config: Config) {
    this.config = config

    return this
  }

  private get mock(): MSWResult {
    const { resolveName, responseName, operation } = this.config
    const codes: string[] = []

    const name = resolveName({ name: `${operation.getOperationId()}` })

    codes.push(`
export const ${name} = rest.${operation.method}('*${URLPath.toURLPath(operation.path)}', function handler(req, res, ctx) {
  return res(
    ctx.json(${responseName}()),
  );
});
`)

    return { code: combineCodes(codes), name }
  }

  print(): string {
    return this.mock.code
  }
}
