import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Mutation } from './components/Mutation.tsx'
import { Operations } from './components/Operations.tsx'
import { Query } from './components/Query.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { QueryOptions } from './components/QueryOptions.tsx'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions, FileMeta> {
  async all(operations: Operation[]): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    const templates = {
      mutation: Mutation.templates,
      query: Query.templates,
      queryOptions: QueryOptions.templates,
      queryKey: QueryKey.templates,
      operations: Operations.templates,
      ...this.options.templates,
    }

    if (!templates.operations) {
      return []
    }

    root.render(
      <Oas oas={oas} operations={operations} getSchemas={(...props) => this.getSchemas(...props)}>
        <Operations.File name="test" templates={templates.operations} />
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  async get(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    const templates = {
      mutation: Mutation.templates,
      query: Query.templates,
      queryOptions: QueryOptions.templates,
      queryKey: QueryKey.templates,
      ...options.templates,
    }

    if (!templates?.query || !templates?.queryKey || !templates.queryOptions) {
      return []
    }

    root.render(
      <Oas oas={oas} operations={[operation]} getSchemas={(...props) => this.getSchemas(...props)}>
        <Oas.Operation operation={operation}>
          <Query.File templates={{ query: templates.query, queryKey: templates.queryKey, queryOptions: templates.queryOptions }} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
    )

    return root.files
  }

  async post(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    const templates = {
      mutation: Mutation.templates,
      query: Query.templates,
      queryOptions: QueryOptions.templates,
      queryKey: QueryKey.templates,
      ...options.templates,
    }

    if (!templates?.mutation) {
      return []
    }

    root.render(
      <Oas oas={oas} operations={[operation]} getSchemas={(...props) => this.getSchemas(...props)}>
        <Oas.Operation operation={operation}>
          <Mutation.File templates={templates.mutation} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
    )

    return root.files
  }

  async put(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
}
