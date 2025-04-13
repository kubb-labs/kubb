import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import type { PluginMcp } from '../types'
import { Client } from '@kubb/plugin-client/components'

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
        <File.Import name={['CallToolResult']} path={'@modelcontextprotocol/sdk/types'} isTypeOnly />
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
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

        <Client
          name={mcp.name}
          isConfigurable={false}
          returnType={'Promise<CallToolResult>'}
          baseURL={options.client.baseURL}
          operation={operation}
          typeSchemas={type.schemas}
          zodSchemas={undefined}
          dataReturnType={options.dataReturnType}
          paramsType={'object'}
          paramsCasing={'camelcase'}
          pathParamsType={'object'}
          parser={'client'}
        >
          {options.dataReturnType === 'data' &&
            `return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res.data)
              }
            ]
           }`}
          {options.dataReturnType === 'full' &&
            `return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res)
              }
            ]
           }`}
        </Client>
      </File>
    )
  },
})
