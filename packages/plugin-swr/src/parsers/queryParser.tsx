import { File, useApp } from '@kubb/react'

import { createParser } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import type { PluginSwr } from '../types.ts'
import { SchemaType } from '../components/SchemaType.tsx'
import { Query, QueryOptions } from '../components'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import { FunctionParams, URLPath } from '@kubb/core/utils'

// TOOD move to zod plugin
const zodParser = createParser({
  name: 'faker',
  pluginName: pluginZodName,
})

// TOOD move to ts plugin
const tsParser = createParser({
  name: 'ts',
  pluginName: pluginTsName,
})

export const queryParser = createParser<PluginSwr>({
  name: 'query',
  pluginName: 'plugin-swr',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const { pluginManager } = useApp<PluginSwr>()

      const file = getFile()
      const schemas = getSchemas({ parser: tsParser })
      const zodSchemas = getSchemas({ parser: zodParser, type: 'function' })
      const fileZodSchemas = getFile({ parser: zodParser })
      const fileType = getFile({ parser: tsParser })

      const name = getName({ type: 'function' })
      const typeName = getName({ type: 'type' })

      const queryOptionsName = pluginManager.resolveName({
        name: `${typeName}QueryOptions`,
        pluginKey: ['plugin-swr'],
      })
      const generics = new FunctionParams()
      const params = new FunctionParams()
      const queryParams = new FunctionParams()
      const client = {
        method: operation.method,
        path: new URLPath(operation.path),
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
      }

      const resultGenerics = ['TData', `${typeName}["error"]`]

      generics.add([{ type: 'TData', default: `${typeName}["response"]` }])

      const queryOptionsGenerics = ['TData']

      params.add([
        ...getASTParams(schemas.pathParams, { typed: true }),
        {
          name: 'params',
          type: `${typeName}['queryParams']`,
          enabled: client.withQueryParams,
          required: false,
        },
        {
          name: 'headers',
          type: `${typeName}['headerParams']`,
          enabled: client.withHeaders,
          required: false,
        },
        {
          name: 'options',
          required: false,
          type: `{
        query?: SWRConfiguration<${resultGenerics.join(', ')}>,
        client?: ${typeName}['client']['parameters'],
        shouldFetch?: boolean,
      }`,
          default: '{}',
        },
      ])

      queryParams.add([
        ...getASTParams(schemas.pathParams, { typed: false }),
        {
          name: 'params',
          enabled: client.withQueryParams,
          required: false,
        },
        {
          name: 'headers',
          enabled: client.withHeaders,
          required: false,
        },
        {
          name: 'clientOptions',
          required: false,
        },
      ])

      const isQuery = options.query.methods.some((method) => operation.method === method)

      if (!isQuery) {
        return null
      }

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          {options.parser === 'zod' && <File.Import extName={options.extName} name={[zodSchemas.response.name]} root={file.path} path={fileZodSchemas.path} />}
          <File.Import name="useSWR" path="swr" />
          <File.Import name={['SWRConfiguration', 'SWRResponse']} path="swr" isTypeOnly />
          <File.Import name={'client'} path={options.client.importPath} />
          <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
          <File.Import
            extName={options.extName}
            name={[
              schemas.request?.name,
              schemas.response.name,
              schemas.pathParams?.name,
              schemas.queryParams?.name,
              schemas.headerParams?.name,
              ...(schemas.statusCodes?.map((item) => item.name) || []),
            ].filter(Boolean)}
            root={file.path}
            path={fileType.path}
            isTypeOnly
          />
          <File.Source>
            <SchemaType name={typeName} schemas={schemas} dataReturnType={options.dataReturnType} />
            <QueryOptions name={typeName} dataReturnType={options.dataReturnType} />
            <Query
              name={name}
              generics={generics.toString()}
              JSDoc={{ comments: getComments(operation) }}
              client={client}
              hook={{
                name: 'useSWR',
                generics: [...resultGenerics, client.withQueryParams ? '[typeof url, typeof params] | null' : 'typeof url | null'].join(', '),
                queryOptions: `${queryOptionsName}<${queryOptionsGenerics.join(', ')}>(${queryParams.toString()})`,
              }}
              params={params.toString()}
              returnType={`SWRResponse<${resultGenerics.join(', ')}>`}
            />
          </File.Source>
        </File>
      )
    },
  },
})
