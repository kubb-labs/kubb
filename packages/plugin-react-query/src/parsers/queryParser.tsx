import { File, useApp } from '@kubb/react'

import { createParser } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import type { PluginReactQuery } from '../types.ts'
import { SchemaType } from '../components/SchemaType.tsx'
import { Query, QueryKey, QueryOptions } from '../components'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { isRequired } from '@kubb/oas'

// TOOD move to zod plugin
const zodParser = createParser({
  name: 'zod',
  pluginName: pluginZodName,
})

// TOOD move to ts plugin
const typeParser = createParser({
  name: 'ts',
  pluginName: pluginTsName,
})

export const queryParser = createParser<PluginReactQuery>({
  name: 'query',
  pluginName: 'plugin-react-query',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const { pluginManager } = useApp<PluginReactQuery>()

      const file = getFile()
      const typedSchemas = getSchemas({ parser: typeParser })
      const zodSchemas = getSchemas({ parser: zodParser, type: 'function' })
      const fileZodSchemas = getFile({ parser: zodParser })
      const fileType = getFile({ parser: typeParser })

      const name = getName({ type: 'function' })
      const typeName = getName({ type: 'type' })
      const queryOptionsOverrideGenerics = [`${typeName}['response']`, `${typeName}['error']`, 'TData', 'TQueryData', 'TQueryKey']
      const resultGenerics = ['TData', `${typeName}['error']`]

      const generics = new FunctionParams()
      const params = new FunctionParams()
      const queryParams = new FunctionParams()
      const queryKeyParams = new FunctionParams()
      const client = {
        method: operation.method,
        path: new URLPath(operation.path),
        withQueryParams: !!typedSchemas.queryParams?.name,
        withData: !!typedSchemas.request?.name,
        withPathParams: !!typedSchemas.pathParams?.name,
        withHeaders: !!typedSchemas.headerParams?.name,
      }

      generics.add([
        {
          type: 'TData',
          default: `${typeName}["response"]`,
        },
        { type: 'TQueryData', default: `${typeName}["response"]` },
        { type: 'TQueryKey extends QueryKey', default: `${typeName}QueryKey` },
      ])

      params.add([
        ...(options.pathParamsType === 'object'
          ? [getASTParams(typedSchemas.pathParams, { typed: true })]
          : getASTParams(typedSchemas.pathParams, { typed: true })),
        {
          name: 'params',
          type: `${typeName}['queryParams']`,
          enabled: client.withQueryParams,
          required: isRequired(typedSchemas.queryParams?.schema),
        },
        {
          name: 'headers',
          type: `${typeName}['headerParams']`,
          enabled: client.withHeaders,
          required: isRequired(typedSchemas.headerParams?.schema),
        },
        {
          name: 'data',
          type: `${typeName}['request']`,
          enabled: client.withData,
          required: isRequired(typedSchemas.request?.schema),
        },
        {
          name: 'options',
          type: `{
    query?: Partial<QueryObserverOptions<${queryOptionsOverrideGenerics.join(', ')}>>,
    client?: ${typeName}['client']['parameters']
}`,
          default: '{}',
        },
      ])

      queryParams.add([
        ...(options.pathParamsType === 'object' ? [getASTParams(typedSchemas.pathParams)] : getASTParams(typedSchemas.pathParams)),
        {
          name: 'params',
          enabled: client.withQueryParams,
          required: isRequired(typedSchemas.queryParams?.schema),
        },
        {
          name: 'headers',
          enabled: client.withHeaders,
          required: isRequired(typedSchemas.headerParams?.schema),
        },
        {
          name: 'data',
          enabled: client.withData,
          required: isRequired(typedSchemas.request?.schema),
        },
        {
          name: 'clientOptions',
          required: false,
        },
      ])

      queryKeyParams.add([
        ...(options.pathParamsType === 'object' ? [getASTParams(typedSchemas.pathParams)] : getASTParams(typedSchemas.pathParams)),
        {
          name: 'params',
          enabled: client.withQueryParams,
          required: isRequired(typedSchemas.queryParams?.schema),
        },
        {
          name: 'data',
          enabled: client.withData,
          required: isRequired(typedSchemas.request?.schema),
        },
      ])

      const isQuery = typeof options.query === 'boolean' ? options.query : options.query.methods.some((method) => operation.method === method)

      if (!isQuery || !options.query) {
        return null
      }

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          {options.parser === 'zod' && <File.Import extName={options.extName} name={[zodSchemas.response.name]} root={file.path} path={fileZodSchemas.path} />}
          <File.Import name={'client'} path={options.client.importPath} />
          <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
          <File.Import
            extName={options.extName}
            name={[
              typedSchemas.request?.name,
              typedSchemas.response.name,
              typedSchemas.pathParams?.name,
              typedSchemas.queryParams?.name,
              typedSchemas.headerParams?.name,
              ...(typedSchemas.statusCodes?.map((item) => item.name) || []),
            ].filter(Boolean)}
            root={file.path}
            path={fileType.path}
            isTypeOnly
          />
          <File.Import name={['QueryKey', 'WithRequired']} path={options.query.importPath} isTypeOnly />
          <File.Import name={['useQuery', 'queryOptions']} path={options.query.importPath} />
          <File.Import name={['QueryObserverOptions', 'UseQueryResult']} path={options.query.importPath} isTypeOnly />

          <File.Source>
            <SchemaType typeName={typeName} typedSchemas={typedSchemas} options={options} />
            {options.queryOptions && <QueryOptions name={name} typeName={typeName} options={options} />}
            <QueryKey name={name} typeName={typeName} keysFn={options.query ? options.query.queryKey : (keys: unknown[]) => keys} />
            <Query
              name={name}
              generics={generics.toString()}
              JSDoc={{ comments: getComments(operation) }}
              hook={{
                generics: ['any', `${typeName}['error']`, 'TData', 'any'].join(', '),
                queryOptions: `${name}QueryOptions(${queryParams.toString()})`,
                queryKey: `${name}QueryKey(${queryKeyParams.toString()})`,
              }}
              params={params.toString()}
              returnType={`UseQueryResult<${resultGenerics.join(', ')}>`}
            />
          </File.Source>
        </File>
      )
    },
  },
})
