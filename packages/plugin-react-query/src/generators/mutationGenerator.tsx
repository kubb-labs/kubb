import transformers from '@kubb/core/transformers'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { Mutation, Query, QueryKey, QueryOptions } from '../components'
import { SchemaType } from '../components/SchemaType.tsx'
import type { PluginReactQuery } from '../types'

export const mutationGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query',
  Operation({ options, operation }) {
    const {
      plugin: { output },
    } = useApp<PluginReactQuery>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isMutation = typeof options.query === 'boolean' ? options.mutation : !!options.mutation.methods?.some((method) => operation.method === method)

    const mutation = {
      name: getName(operation, { type: 'function' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation),
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

    if (!isMutation) {
      return null
    }

    return (
      <File baseName={mutation.file.baseName} path={mutation.file.path} meta={mutation.file.meta}>
        {options.parser === 'zod' && (
          <File.Import extName={output?.extName} name={[zod.schemas.response.name]} root={mutation.file.path} path={zod.file.path} />
        )}
        <File.Import name={['useMutation']} path={options.mutation.importPath} />
        <File.Import name={['UseMutationOptions', 'UseMutationResult']} path={options.mutation.importPath} isTypeOnly />
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
          root={mutation.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <SchemaType typeName={mutation.typeName} typedSchemas={type.schemas} operation={operation} dataReturnType={options.client.dataReturnType} />
        <Mutation
          name={mutation.name}
          typeName={mutation.typeName}
          dataReturnType={options.client.dataReturnType}
          parser={options.parser}
          zodSchemas={zod.schemas}
          typedSchemas={type.schemas}
          pathParamsType={options.query.pathParamsType}
          operation={operation}
        />
      </File>
    )
  },
})
