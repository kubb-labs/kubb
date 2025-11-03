import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { URLPath } from '@kubb/core/utils'
import type { PluginClient } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'

export const clientStaticGenerator = createReactGenerator<PluginClient>({
  name: 'client',
  Operation({ config, plugin, operation, generator }) {
    const pluginManager = usePluginManager()
    const {
      options,
      options: { output },
    } = plugin

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    return (
      <File
        baseName={client.file.baseName}
        path={client.file.path}
        meta={client.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        {options.importPath ? (
          <>
            <File.Import name={'fetch'} path={options.importPath} />
            <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.importPath} isTypeOnly />
          </>
        ) : (
          <>
            <File.Import name={'fetch'} root={client.file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetcher.ts')} />
            <File.Import
              name={['RequestConfig', 'ResponseErrorConfig']}
              root={client.file.path}
              path={path.resolve(config.root, config.output.path, '.kubb/fetcher.ts')}
              isTypeOnly
            />
          </>
        )}

        <File.Import
          name={
            [
              type.schemas.request?.name,
              type.schemas.response.name,
              type.schemas.pathParams?.name,
              type.schemas.queryParams?.name,
              type.schemas.headerParams?.name,
              ...(type.schemas.statusCodes?.map((item) => item.name) || []),
            ].filter(Boolean) as string[]
          }
          root={client.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <Client
          name={client.name}
          baseURL={options.baseURL}
          dataReturnType={options.dataReturnType}
          pathParamsType={options.pathParamsType}
          paramsType={options.paramsType}
          paramsCasing={options.paramsCasing}
          typeSchemas={type.schemas}
          operation={operation}
          parser={options.parser}
          zodSchemas={undefined}
        />
        <File.Source>
          {`
        ${client.name}.method = "${operation.method}" as const;
        ${client.name}.url = "${new URLPath(operation.path).URL}" as const;
        ${client.name}.operationId = "${client.name}" as const;
        ${client.name}.request = {} as ${type.schemas.request?.name || 'never'};
        ${client.name}.response = {} as ${type.schemas.response?.name || 'never'};
        ${client.name}.pathParams = {} as ${type.schemas.pathParams?.name || 'never'};
        ${client.name}.queryParams = {} as ${type.schemas.queryParams?.name || 'never'};
        `}
        </File.Source>
      </File>
    )
  },
})
