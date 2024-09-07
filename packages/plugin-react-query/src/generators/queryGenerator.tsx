import transformers from '@kubb/core/transformers'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { Query, QueryKey, QueryOptions } from '../components'
import { SchemaType } from '../components/SchemaType.tsx'
import type { PluginReactQuery } from '../types'

export const queryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query',
  Operation({ options, operation }) {
    const {
      plugin: { output },
    } = useApp<PluginReactQuery>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = typeof options.query === 'boolean' ? options.query : !!options.query.methods?.some((method) => operation.method === method)

    const query = {
      name: getName(operation, { type: 'function' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation),
    }

    const queryOptions = {
      name: transformers.camelCase(`${operation.getOperationId()} QueryOptions`),
    }

    const queryKey = {
      name: transformers.camelCase(`${operation.getOperationId()} QueryKey`),
      typeName: transformers.pascalCase(`${operation.getOperationId()} QueryKey`),
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

    if (!isQuery) {
      return null
    }

    return (
      <File baseName={query.file.baseName} path={query.file.path} meta={query.file.meta}>
        {options.parser === 'zod' && <File.Import extName={output?.extName} name={[zod.schemas.response.name]} root={query.file.path} path={zod.file.path} />}
        <File.Import name={['useQuery', 'queryOptions']} path={options.query.importPath} />
        <File.Import name={['QueryKey', 'WithRequired']} path={options.query.importPath} isTypeOnly />
        <File.Import name={['QueryObserverOptions', 'UseQueryResult']} path={options.query.importPath} isTypeOnly />
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
        <File.Import
          extName={output?.extName}
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

        <SchemaType typeName={query.typeName} typedSchemas={type.schemas} operation={operation} dataReturnType={options.client.dataReturnType} />
        <QueryKey
          name={queryKey.name}
          queryTypeName={query.typeName}
          typeName={queryKey.typeName}
          operation={operation}
          pathParamsType={options.query.pathParamsType}
          typedSchemas={type.schemas}
          keysFn={options.query ? options.query.queryKey : (keys: unknown[]) => keys}
        />
        <QueryOptions
          name={queryOptions.name}
          queryKeyName={queryKey.name}
          queryTypeName={query.typeName}
          operation={operation}
          typedSchemas={type.schemas}
          zodSchemas={zod.schemas}
          dataReturnType={options.client.dataReturnType}
          pathParamsType={options.query.pathParamsType}
          parser={options.parser}
        />
        <Query
          name={query.name}
          typeName={query.typeName}
          queryOptionsName={queryOptions.name}
          queryKeyName={queryKey.name}
          typedSchemas={type.schemas}
          pathParamsType={options.query.pathParamsType}
          operation={operation}
        />
      </File>
    )
  },
})
