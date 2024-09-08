import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { Client } from '../components/Client'
import type { PluginClient } from '../types'

export const clientGenerator = createReactGenerator<PluginClient>({
  name: 'client',
  Operation({ options, operation }) {
    const {
      plugin: { output },
    } = useApp<PluginClient>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const zod = {
      file: getFile(operation, { pluginKey: [pluginZodName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
    }

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Import name={'client'} path={options.importPath} />
        <File.Import name={['RequestConfig']} path={options.importPath} isTypeOnly />
        {options.parser === 'zod' && <File.Import extName={output?.extName} name={[zod.schemas.response.name]} root={client.file.path} path={zod.file.path} />}
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
          root={client.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <Client
          name={client.name}
          baseURL={options.baseURL}
          dataReturnType={options.dataReturnType}
          pathParamsType={options.pathParamsType}
          typeSchemas={type.schemas}
          operation={operation}
          parser={options.parser}
          zodSchemas={zod.schemas}
        />
      </File>
    )
  },
})
