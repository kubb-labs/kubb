import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Mutation } from './components/Mutation.tsx'
import { Query } from './components/Query.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { QueryOptions } from './components/QueryOptions.tsx'

import type { KubbFile } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions, FileMeta> {
  async all(): Promise<KubbFile.File | null> {
    return null
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
      <Query.File templates={{ query: templates.query, queryKey: templates.queryKey, queryOptions: templates.queryOptions }} />,
      { meta: { oas, pluginManager, plugin: { ...plugin, options }, schemas, operation } },
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

    root.render(<Mutation.File templates={templates.mutation} />, { meta: { oas, pluginManager, plugin: { ...plugin, options }, schemas, operation } })

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
