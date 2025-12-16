import { usePluginManager } from '@kubb/core/hooks'
import type { Operation } from '@kubb/oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File, Type } from '@kubb/react-fabric'
import { difference } from 'remeda'
import type { PluginReactQuery } from '../types'

export const hookOptionsGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query-hook-options',
  Operations({ operations, plugin, generator }) {
    const {
      options,
      options: { output },
      key: pluginKey,
    } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getName, getFile } = useOperationManager(generator)

    const name = 'HookOptions'
    const file = pluginManager.getFile({ name, extname: '.ts', pluginKey })

    const getOperationOptions = (operation: Operation) => {
      const operationOptions = generator.getOptions(operation, operation.method)
      return { ...options, ...operationOptions }
    }

    const isQuery = (operation: Operation) => {
      const operationOptions = getOperationOptions(operation)
      return typeof operationOptions.query === 'boolean' ? true : operationOptions.query?.methods.some((method) => operation.method === method)
    }

    const isMutation = (operation: Operation) => {
      const operationOptions = getOperationOptions(operation)
      return (
        operationOptions.mutation !== false &&
        !isQuery(operation) &&
        difference(operationOptions.mutation ? operationOptions.mutation.methods : [], operationOptions.query ? operationOptions.query.methods : []).some(
          (method) => operation.method === method,
        )
      )
    }

    const isSuspense = (operation: Operation) => {
      const operationOptions = getOperationOptions(operation)
      return !!operationOptions.suspense
    }

    const isInfinite = (operation: Operation) => {
      const operationOptions = getOperationOptions(operation)
      const infiniteOptions = operationOptions.infinite && typeof operationOptions.infinite === 'object' ? operationOptions.infinite : undefined
      return !!infiniteOptions
    }

    // Query/mutation hooks
    const getHookName = (operation: Operation) => {
      return getName(operation, { type: 'function', prefix: 'use' })
    }

    const getHookFile = (operation: Operation) => {
      return getFile(operation, { prefix: 'use' })
    }

    // Query hooks
    const getQueryHookOptions = (operation: Operation) => {
      return getName(operation, { type: 'function', suffix: 'QueryOptions' })
    }

    const getQueryHookOptionsImport = (operation: Operation) => {
      return <File.Import name={[getQueryHookOptions(operation)]} root={file.path} path={getHookFile(operation).path} />
    }

    // Mutation hooks
    const getMutationHookOptions = (operation: Operation) => {
      return getName(operation, { type: 'function', suffix: 'MutationOptions' })
    }

    const getMutationHookOptionsImport = (operation: Operation) => {
      return <File.Import name={[getMutationHookOptions(operation)]} root={file.path} path={getHookFile(operation).path} />
    }

    // Suspense hooks
    const getSuspenseHookName = (operation: Operation) => {
      return getName(operation, { type: 'function', prefix: 'use', suffix: 'suspense' })
    }

    const getSuspenseHookFile = (operation: Operation) => {
      return getFile(operation, { prefix: 'use', suffix: 'suspense' })
    }

    const getSuspenseHookOptions = (operation: Operation) => {
      return getName(operation, { type: 'function', suffix: 'SuspenseQueryOptions' })
    }

    const getSuspenseHookOptionsImport = (operation: Operation) => {
      return <File.Import name={[getSuspenseHookOptions(operation)]} root={file.path} path={getSuspenseHookFile(operation).path} />
    }

    // Infinite hooks
    const getInfiniteHookName = (operation: Operation) => {
      return getName(operation, { type: 'function', prefix: 'use', suffix: 'infinite' })
    }

    const getInfiniteHookFile = (operation: Operation) => {
      return getFile(operation, { prefix: 'use', suffix: 'infinite' })
    }

    const getInfiniteHookOptions = (operation: Operation) => {
      return getName(operation, { type: 'function', suffix: 'InfiniteQueryOptions' })
    }

    const getInfiniteHookOptionsImport = (operation: Operation) => {
      return <File.Import name={[getInfiniteHookOptions(operation)]} root={file.path} path={getInfiniteHookFile(operation).path} />
    }

    // Suspense infinite hooks
    const getSuspenseInfiniteHookName = (operation: Operation) => {
      return getName(operation, { type: 'function', prefix: 'use', suffix: 'suspenseInfinite' })
    }

    const getSuspenseInfiniteHookFile = (operation: Operation) => {
      return getFile(operation, { prefix: 'use', suffix: 'suspenseInfinite' })
    }

    const getSuspenseInfiniteHookOptions = (operation: Operation) => {
      return getName(operation, { type: 'function', suffix: 'SuspenseInfiniteQueryOptions' })
    }

    const getSuspenseInfiniteHookOptionsImport = (operation: Operation) => {
      return <File.Import name={[getSuspenseInfiniteHookOptions(operation)]} root={file.path} path={getSuspenseInfiniteHookFile(operation).path} />
    }

    const imports = operations
      .flatMap((operation) => {
        if (isQuery(operation)) {
          return [
            getQueryHookOptionsImport(operation),
            isSuspense(operation) ? getSuspenseHookOptionsImport(operation) : undefined,
            isInfinite(operation) ? getInfiniteHookOptionsImport(operation) : undefined,
            isSuspense(operation) && isInfinite(operation) ? getSuspenseInfiniteHookOptionsImport(operation) : undefined,
          ].filter(Boolean)
        }
        if (isMutation(operation)) {
          return [getMutationHookOptionsImport(operation)]
        }
        return []
      })
      .filter(Boolean)

    const hookOptions = operations.reduce(
      (acc, operation) => {
        if (isQuery(operation)) {
          acc[getHookName(operation)] = `Partial<ReturnType<typeof ${getQueryHookOptions(operation)}>>`
          if (isSuspense(operation)) {
            acc[getSuspenseHookName(operation)] = `Partial<ReturnType<typeof ${getSuspenseHookOptions(operation)}>>`
          }
          if (isInfinite(operation)) {
            acc[getInfiniteHookName(operation)] = `Partial<ReturnType<typeof ${getInfiniteHookOptions(operation)}>>`
          }
          if (isSuspense(operation) && isInfinite(operation)) {
            acc[getSuspenseInfiniteHookName(operation)] = `Partial<ReturnType<typeof ${getSuspenseInfiniteHookOptions(operation)}>>`
          }
        }
        if (isMutation(operation)) {
          acc[getHookName(operation)] = `Partial<ReturnType<typeof ${getMutationHookOptions(operation)}>>`
        }
        return acc
      },
      {} as Record<string, string>,
    )

    if (!options.customOptions) {
      return null
    }

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
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
