import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Tool } from '../components'
import type { PluginMcp } from '../types'
import { pluginClientName } from '@kubb/plugin-client'

export const mcpGenerator = createReactGenerator<PluginMcp>({
  name: 'mcp',
  Operation({ operation }) {
    const {
      plugin: { options },
    } = useApp<PluginMcp>()
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const mcp = {
      name: getName(operation, { type: 'function', suffix: 'handler' }),
      file: getFile(operation),
    }

    const client = {
      name: getName(operation, {
        type: 'function',
        pluginKey: [pluginClientName],
      }),
      file: getFile(operation, { pluginKey: [pluginClientName] }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    return (
      <File
        baseName={mcp.file.baseName}
        path={mcp.file.path}
        meta={mcp.file.meta}
        banner={getBanner({ oas, output: options.output })}
        footer={getFooter({ oas, output: options.output })}
      >
        <File.Import name={[client.name]} root={mcp.file.path} path={client.file.path} />
        <File.Import name={['CallToolResult']} path={'@modelcontextprotocol/sdk/types'} isTypeOnly />
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
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
          root={mcp.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <Tool
          name={mcp.name}
          clientName={client.name}
          pathParamsType={options.pathParamsType}
          paramsType={options.paramsType}
          paramsCasing={options.paramsCasing}
          dataReturnType={options.dataReturnType}
          typeSchemas={type.schemas}
        />
      </File>
    )
  },
})
