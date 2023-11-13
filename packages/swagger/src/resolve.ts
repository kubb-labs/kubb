import type { KubbFile, KubbPlugin, PluginContext, ResolveNameParams, ResolvePathParams } from '@kubb/core'
import type { Operation, ResolvePathOptions, Resolver } from './types.ts'
/**
 * @deprecated
 */
type PropsWithOperation = {
  operation: Operation
  /**
   * @default `operation.getOperationId()`
   */
  name?: string
}
/**
 * @deprecated
 */
type PropsWithoutOperation = {
  operation?: never
  /**
   * @default `operation.getOperationId()`
   */
  name: string
}
/**
 * @deprecated
 */
export type ResolveProps = (PropsWithOperation | PropsWithoutOperation) & {
  pluginKey?: KubbPlugin['key']
  /**
   * @default `operation.getTags()[0]?.name`
   */
  tag?: string
  resolvePath: (params: ResolvePathParams<ResolvePathOptions>) => KubbFile.OptionalPath
  resolveName: PluginContext['resolveName']
  type?: ResolveNameParams['type']
}
/**
 * @deprecated
 */
export function resolve({ operation, name, tag, type, pluginKey, resolveName, resolvePath }: ResolveProps): Resolver {
  if (!name && !operation?.getOperationId()) {
    throw new Error('name or operation should be set')
  }

  const resolvedName = name ? name : resolveName({ name: operation?.getOperationId() as string, type, pluginKey })

  if (!resolvedName) {
    throw new Error(`Name ${name || operation?.getOperationId()} should be defined`)
  }

  const baseName = `${resolvedName}.ts` as const
  const path = resolvePath({
    baseName,
    pluginKey,
    options: { pluginKey, type, tag: tag || operation?.getTags()[0]?.name },
  })

  if (!path) {
    throw new Error(`Filepath should be defined for resolvedName "${resolvedName}" and pluginKey [${JSON.stringify(pluginKey)}]`)
  }

  return {
    name: resolvedName,
    baseName,
    path,
  }
}
