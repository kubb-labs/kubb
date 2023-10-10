import { useOperation } from '@kubb/swagger'

import type { PluginContext } from '@kubb/core'
import type { Resolver } from '@kubb/swagger'
import type { ResolvePathOptions } from '../types.ts'

type Props = {
  /**
   * @default `operation.getOperationId()`
   */
  name?: string
  pluginName?: string
  /**
   * @default `operation.getTags()[0]?.name`
   */
  tag?: string
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export function useResolve({ name, tag, pluginName, resolveName, resolvePath }: Props): Resolver {
  const operation = useOperation()

  const resolvedName = resolveName({ name: name || operation.getOperationId(), pluginName })

  if (!resolvedName) {
    throw new Error(`Name ${name || operation.getOperationId()} should be defined`)
  }

  const fileName = `${resolvedName}.ts`
  const filePath = resolvePath({
    fileName,
    options: { tag: tag || operation.getTags()[0]?.name },
  })

  if (!filePath) {
    throw new Error('Filepath should be defined')
  }

  return {
    name: resolvedName,
    fileName,
    filePath,
  }
}
