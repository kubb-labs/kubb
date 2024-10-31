import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { Query, QueryKey, QueryOptions } from '../components'
import type { PluginSolidQuery } from '../types'

export const queryGenerator = createReactGenerator<PluginSolidQuery>({
  name: 'svelte-query',
  Operation({ options, operation }) {
    const {
      plugin: {
        options: { output },
      },
    } = useApp<PluginSolidQuery>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)

    const query = {
      name: getName(operation, { type: 'function', prefix: 'create' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'create' }),
    }

    const client = {
      name: getName(operation, { type: 'function', pluginKey: [pluginClientName] }),
    }

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'QueryKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'QueryKey' }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      //todo remove type?
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const zod = {
      file: getFile(operation, { pluginKey: [pluginZodName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
    }

    if (!isQuery || typeof options.query === 'boolean') {
      return null
    }

    return (
      <File baseName={query.file.baseName} path={query.file.path} meta={query.file.meta} banner={output?.banner} footer={output?.footer}>
        {options.parser === 'zod' && <File.Import name={[zod.schemas.response.name]} root={query.file.path} path={zod.file.path} />}
        <File.Import name={['createQuery', 'queryOptions']} path={options.query.importPath} />
        <File.Import name={['QueryKey', 'WithRequired', 'CreateBaseQueryOptions', 'CreateQueryResult']} path={options.query.importPath} isTypeOnly />
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['RequestConfig']} path={options.client.importPath} isTypeOnly />
        {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter(Boolean)}
          root={query.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <QueryKey
          name={queryKey.name}
          typeName={queryKey.typeName}
          operation={operation}
          pathParamsType={options.pathParamsType}
          typeSchemas={type.schemas}
          keysFn={options.query.key}
        />
        <Client
          name={client.name}
          isExportable={false}
          isIndexable={false}
          baseURL={options.client.baseURL}
          operation={operation}
          typeSchemas={type.schemas}
          zodSchemas={zod.schemas}
          dataReturnType={options.client.dataReturnType}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          parser={options.parser}
        />
        <QueryOptions
          name={queryOptions.name}
          clientName={client.name}
          queryKeyName={queryKey.name}
          typeSchemas={type.schemas}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
        />
        <Query
          name={query.name}
          queryOptionsName={queryOptions.name}
          typeSchemas={type.schemas}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          operation={operation}
          dataReturnType={options.client.dataReturnType}
          queryKeyName={queryKey.name}
          queryKeyTypeName={queryKey.typeName}
        />
      </File>
    )
  },
})
