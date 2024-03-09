import type { KubbFile, ResolveNameParams, ResolvePathParams } from '@kubb/core'
import type { OperationsByMethod } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'

export function getHandlers(
  operationsByMethod: OperationsByMethod,
  { resolveName, pluginKey }: { resolveName: (params: ResolveNameParams) => string; pluginKey: ResolveNameParams['pluginKey'] },
): Array<{ name: string; operation: Operation }> {
  const handlers: Array<{ name: string; operation: Operation }> = []

  Object.keys(operationsByMethod).forEach((path) => {
    const operations = operationsByMethod[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(({ operation }) => {
      const operationId = operation.getOperationId()
      const name = resolveName({ name: operationId, pluginKey, type: 'function' })

      handlers.push({ name, operation })
    })
  })

  return handlers
}

export function getHandlersImports(
  operationsByMethod: OperationsByMethod,
  { resolveName, resolvePath, pluginKey }: {
    resolveName: (params: ResolveNameParams) => string
    resolvePath: (params: ResolvePathParams) => KubbFile.OptionalPath
    pluginKey: ResolveNameParams['pluginKey']
  },
): Array<{ name: string; path: KubbFile.OptionalPath }> {
  const handlers = getHandlers(operationsByMethod, { resolveName, pluginKey })

  return handlers.map(({ name, operation }) => {
    const path = resolvePath({
      pluginKey,
      baseName: `${name}.ts`,
      options: {
        tag: operation?.getTags()[0]?.name,
      },
    })
    return { name, path }
  })
}
