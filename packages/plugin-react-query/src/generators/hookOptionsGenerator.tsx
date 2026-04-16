import type { OperationNode } from '@kubb/ast/types'
import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer, Type } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
import type { PluginReactQuery } from '../types'
import { transformName } from '../utils.ts'

export const hookOptionsGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-hook-options',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, suspense, infinite, transformers, customOptions } = ctx.options

    if (!customOptions) {
      return null
    }

    const name = 'HookOptions'
    const file = driver.getFile({ name, extname: '.ts', pluginName: 'plugin-react-query' })

    const isQuery = (node: OperationNode) => {
      return typeof query === 'boolean' ? true : !!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase())
    }

    const isMutation = (node: OperationNode) => {
      return (
        mutation !== false &&
        !isQuery(node) &&
        difference(mutation ? mutation.methods : [], query ? query.methods : []).some((method) => node.method.toLowerCase() === method.toLowerCase())
      )
    }

    const isSuspenseEnabled = !!suspense
    const isInfiniteEnabled = !!infinite && typeof infinite === 'object'

    const getHookName = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`use${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`, 'function', transformers)
    }

    const getHookFile = (node: OperationNode) => {
      const hookName = getHookName(node)
      return resolver.resolveFile(
        { name: hookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: ctx.options.group },
      )
    }

    // Query hooks
    const getQueryHookOptions = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`${baseName}QueryOptions`, 'function', transformers)
    }

    const getQueryHookOptionsImport = (node: OperationNode) => {
      return <File.Import name={[getQueryHookOptions(node)]} root={file.path} path={getHookFile(node).path} />
    }

    // Mutation hooks
    const getMutationHookOptions = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`${baseName}MutationOptions`, 'function', transformers)
    }

    const getMutationHookOptionsImport = (node: OperationNode) => {
      return <File.Import name={[getMutationHookOptions(node)]} root={file.path} path={getHookFile(node).path} />
    }

    // Suspense hooks
    const getSuspenseHookName = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`use${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}Suspense`, 'function', transformers)
    }

    const getSuspenseHookFile = (node: OperationNode) => {
      const hookName = getSuspenseHookName(node)
      return resolver.resolveFile(
        { name: hookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: ctx.options.group },
      )
    }

    const getSuspenseHookOptions = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`${baseName}SuspenseQueryOptions`, 'function', transformers)
    }

    const getSuspenseHookOptionsImport = (node: OperationNode) => {
      return <File.Import name={[getSuspenseHookOptions(node)]} root={file.path} path={getSuspenseHookFile(node).path} />
    }

    // Infinite hooks
    const getInfiniteHookName = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`use${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}Infinite`, 'function', transformers)
    }

    const getInfiniteHookFile = (node: OperationNode) => {
      const hookName = getInfiniteHookName(node)
      return resolver.resolveFile(
        { name: hookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: ctx.options.group },
      )
    }

    const getInfiniteHookOptions = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`${baseName}InfiniteQueryOptions`, 'function', transformers)
    }

    const getInfiniteHookOptionsImport = (node: OperationNode) => {
      return <File.Import name={[getInfiniteHookOptions(node)]} root={file.path} path={getInfiniteHookFile(node).path} />
    }

    // Suspense infinite hooks
    const getSuspenseInfiniteHookName = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`use${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}SuspenseInfinite`, 'function', transformers)
    }

    const getSuspenseInfiniteHookFile = (node: OperationNode) => {
      const hookName = getSuspenseInfiniteHookName(node)
      return resolver.resolveFile(
        { name: hookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: ctx.options.group },
      )
    }

    const getSuspenseInfiniteHookOptions = (node: OperationNode) => {
      const baseName = resolver.resolveName(node.operationId)
      return transformName(`${baseName}SuspenseInfiniteQueryOptions`, 'function', transformers)
    }

    const getSuspenseInfiniteHookOptionsImport = (node: OperationNode) => {
      return <File.Import name={[getSuspenseInfiniteHookOptions(node)]} root={file.path} path={getSuspenseInfiniteHookFile(node).path} />
    }

    const imports = nodes
      .flatMap((node) => {
        if (isQuery(node)) {
          return [
            getQueryHookOptionsImport(node),
            isSuspenseEnabled ? getSuspenseHookOptionsImport(node) : undefined,
            isInfiniteEnabled ? getInfiniteHookOptionsImport(node) : undefined,
            isSuspenseEnabled && isInfiniteEnabled ? getSuspenseInfiniteHookOptionsImport(node) : undefined,
          ].filter(Boolean)
        }
        if (isMutation(node)) {
          return [getMutationHookOptionsImport(node)]
        }
        return []
      })
      .filter(Boolean)

    const hookOptions = nodes.reduce(
      (acc, node) => {
        if (isQuery(node)) {
          acc[getHookName(node)] = `Partial<ReturnType<typeof ${getQueryHookOptions(node)}>>`
          if (isSuspenseEnabled) {
            acc[getSuspenseHookName(node)] = `Partial<ReturnType<typeof ${getSuspenseHookOptions(node)}>>`
          }
          if (isInfiniteEnabled) {
            acc[getInfiniteHookName(node)] = `Partial<ReturnType<typeof ${getInfiniteHookOptions(node)}>>`
          }
          if (isSuspenseEnabled && isInfiniteEnabled) {
            acc[getSuspenseInfiniteHookName(node)] = `Partial<ReturnType<typeof ${getSuspenseInfiniteHookOptions(node)}>>`
          }
        }
        if (isMutation(node)) {
          acc[getHookName(node)] = `Partial<ReturnType<typeof ${getMutationHookOptions(node)}>>`
        }
        return acc
      },
      {} as Record<string, string>,
    )

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(ctx.adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(ctx.adapter.inputNode, { output, config })}
      >
        {imports}
        <File.Source name={name} isExportable isIndexable isTypeOnly>
          <Type export name={name}>
            {`{ ${Object.keys(hookOptions).map((key) => `${JSON.stringify(key)}: ${hookOptions[key]}`)} }`}
          </Type>
        </File.Source>
      </File>
    )
  },
})
