import transformers from '@kubb/core/transformers'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { Mutation } from '../components'
import { SchemaType } from '../components/SchemaType.tsx'
import type { PluginSwr } from '../types'

export const mutationGenerator = createReactGenerator<PluginSwr>({
  name: 'swr-mutation',
  Operation({ options, operation }) {
    const {
      plugin: { output },
    } = useApp<PluginSwr>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isMutate = typeof options.query === 'boolean' ? options.mutation : !!options.mutation.methods?.some((method) => operation.method === method)

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

    if (!isMutate) {
      return null
    }

    return (
      <File baseName={mutation.file.baseName} path={mutation.file.path} meta={mutation.file.meta}>
        {options.parser === 'zod' && (
          <File.Import extName={output?.extName} name={[zod.schemas.response.name]} root={mutation.file.path} path={zod.file.path} />
        )}
        <File.Import name={['Key']} path="swr" isTypeOnly />
        <File.Import name="useSWRMutation" path="swr/mutation" />
        <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path="swr/mutation" isTypeOnly />
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

        <SchemaType typeName={mutation.typeName} typedSchemas={type.schemas} dataReturnType={options.client.dataReturnType} />
        <Mutation
          name={mutation.name}
          typeName={mutation.typeName}
          typedSchemas={type.schemas}
          operation={operation}
          dataReturnType={options.client.dataReturnType}
        />
      </File>
    )
  },
})
