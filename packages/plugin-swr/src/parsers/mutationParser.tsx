import { File } from '@kubb/react'

import { createParser } from '@kubb/plugin-oas'
import { pluginTsName } from '@kubb/plugin-ts'
import type { PluginSwr } from '../types.ts'
import { SchemaType } from '../components/SchemaType.tsx'
import { Mutation } from '../components'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import { FunctionParams, URLPath } from '@kubb/core/utils'

// TOOD move to ts plugin
const tsParser = createParser({
  name: 'ts',
  pluginName: pluginTsName,
})

export const mutationParser = createParser<PluginSwr>({
  name: 'mutation',
  pluginName: 'plugin-swr',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const file = getFile()
      const schemas = getSchemas({ parser: tsParser })
      const fileType = getFile({ parser: tsParser })

      const name = getName({ type: 'function' })
      const typeName = getName({ type: 'type' })

      const params = new FunctionParams()
      const client = {
        method: operation.method,
        path: new URLPath(operation.path),
        generics: [`${typeName}["data"]`, `${typeName}["error"]`, schemas.request?.name ? `${typeName}["request"]` : ''].filter(Boolean).join(', '),
        withQueryParams: !!schemas.queryParams?.name,
        withData: !!schemas.request?.name,
        withPathParams: !!schemas.pathParams?.name,
        withHeaders: !!schemas.headerParams?.name,
      }

      const resultGenerics = [`${typeName}["response"]`, `${typeName}["error"]`]

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
        mutation?: SWRMutationConfiguration<${resultGenerics.join(', ')}>,
        client?: ${typeName}['client']['parameters'],
        shouldFetch?: boolean,
      }`,
          default: '{}',
        },
      ])

      const isMutate = typeof options.mutate === 'boolean' ? options.mutate : options.mutate.methods.some((method) => operation.method === method)

      if (!isMutate) {
        return null
      }

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          <File.Import name="useSWRMutation" path="swr/mutation" />
          <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path="swr/mutation" isTypeOnly />
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
            <Mutation
              name={name}
              JSDoc={{ comments: getComments(operation) }}
              client={client}
              hook={{
                generics: [...resultGenerics, client.withQueryParams ? '[typeof url, typeof params] | null' : 'typeof url | null'].join(', '),
              }}
              params={params.toString()}
              returnType={`SWRMutationResponse<${resultGenerics.join(', ')}>`}
              dataReturnType={options.dataReturnType}
            />
          </File.Source>
        </File>
      )
    },
  },
})
