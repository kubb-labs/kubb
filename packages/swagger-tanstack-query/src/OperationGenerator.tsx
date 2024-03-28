import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Mutation } from './components/Mutation.tsx'
import { Operations } from './components/Operations.tsx'
import { Query } from './components/Query.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { QueryOptions } from './components/QueryOptions.tsx'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions, FileMeta> {
  async all(operations: Operation[]): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({
      logger: pluginManager.logger,
    })

    const templates = {
      mutation: Mutation.templates,
      query: Query.templates,
      queryOptions: QueryOptions.templates,
      queryKey: QueryKey.templates,
      operations: Operations.templates,
      ...this.options.templates,
    }

    root.render(
      <Oas oas={oas} operations={operations} getOperationSchemas={(...props) => this.getSchemas(...props)}>
        {templates.operations && <Operations.File templates={templates.operations} />}
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  async operation(operation: Operation, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({
      logger: pluginManager.logger,
    })

    const templates = {
      mutation: Mutation.templates,
      query: Query.templates,
      queryOptions: QueryOptions.templates,
      queryKey: QueryKey.templates,
      ...options.templates,
    }

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)
    const isMutate = !isQuery && options.mutate && options.mutate.methods.some((method) => operation.method === method)

    root.render(
      <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => this.getSchemas(...props)}>
        <Oas.Operation operation={operation}>
          {isMutate && templates?.mutation && <Mutation.File templates={templates.mutation} />}
          {isQuery && templates?.query && templates.queryKey && templates.queryOptions && (
            <Query.File
              templates={{
                query: templates.query,
                queryKey: templates.queryKey,
                queryOptions: templates.queryOptions,
              }}
            />
          )}
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
    )

    return root.files
  }

  async get(): OperationMethodResult<FileMeta> {
    return null
  }

  async post(): OperationMethodResult<FileMeta> {
    return null
  }

  async put(): OperationMethodResult<FileMeta> {
    return null
  }
  async patch(): OperationMethodResult<FileMeta> {
    return null
  }
  async delete(): OperationMethodResult<FileMeta> {
    return null
  }
}
