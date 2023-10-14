import type { PluginContext } from '@kubb/core'
import type { Resolver } from '@kubb/swagger'
import type { Operation, ResolvePathOptions } from '../types.ts'

type PropsWithOperation = {
  operation: Operation
  /**
   * @default `operation.getOperationId()`
   */
  name?: string
}

type PropsWithoutOperation = {
  operation?: never
  /**
   * @default `operation.getOperationId()`
   */
  name: string
}

export type ResolveProps = (PropsWithOperation | PropsWithoutOperation) & {
  pluginName?: string
  /**
   * @default `operation.getTags()[0]?.name`
   */
  tag?: string
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
  resolveName: PluginContext['resolveName']
}

export function resolve({ operation, name, tag, pluginName, resolveName, resolvePath }: ResolveProps): Resolver {
  if (!name && !operation?.getOperationId()) {
    throw new Error('name or operation should be set')
  }

  const resolvedName = name ? name : resolveName({ name: operation?.getOperationId() as string, pluginName })

  if (!resolvedName) {
    throw new Error(`Name ${name || operation?.getOperationId()} should be defined`)
  }

  const fileName = `${resolvedName}.ts`
  const filePath = resolvePath({
    fileName,
    options: { pluginName, tag: tag || operation?.getTags()[0]?.name },
    pluginName,
  })

  if (!filePath) {
    throw new Error('Filepath should be defined')
  }

  return {
    //TODO remove name and just use fileName
    name: resolvedName,
    fileName,
    filePath,
  }
}
