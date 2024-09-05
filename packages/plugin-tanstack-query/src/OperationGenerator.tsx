import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { Mutation } from './components/Mutation.tsx'
import { Query } from './components/Query.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { QueryOptions } from './components/QueryOptions.tsx'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult } from '@kubb/plugin-oas'
import { QueryImports } from './components/QueryImports.tsx'
import type { FileMeta, PluginTanstackQuery } from './types.ts'

export class OperationGenerator extends Generator<PluginTanstackQuery, FileMeta> {
  async operation(operation: Operation, options: PluginTanstackQuery['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    const templates = {
      mutation: Mutation.templates,
      query: Query.templates,
      queryOptions: QueryOptions.templates,
      queryKey: QueryKey.templates,
      queryImports: QueryImports.templates,
      ...options.templates,
    }

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)
    const isMutate = !isQuery && options.mutate && options.mutate.methods.some((method) => operation.method === method)

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            {isMutate && templates?.mutation && <Mutation.File templates={templates.mutation} />}
            {isQuery && templates?.query && templates.queryKey && templates.queryOptions && templates.queryImports && (
              <Query.File
                templates={{
                  query: templates.query,
                  queryKey: templates.queryKey,
                  queryOptions: templates.queryOptions,
                  queryImports: templates.queryImports,
                }}
              />
            )}
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
