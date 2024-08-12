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
      const typedSchemas = getSchemas({ parser: tsParser })
      const fileType = getFile({ parser: tsParser })

      const name = getName({ type: 'function' })
      const typeName = getName({ type: 'type' })

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
          <File.Source>
            <SchemaType typeName={typeName} typedSchemas={typedSchemas} options={options} />
            <Mutation name={name} typeName={typeName} typedSchemas={typedSchemas} options={options} operation={operation} />
          </File.Source>
        </File>
      )
    },
  },
})
