import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { Client } from '../components/Client'
import { Url } from '../components/Url.tsx'
import type { PluginClient } from '../types'

export const clientGenerator = createReactGenerator<PluginClient>({
  name: 'client',
  Operation({ config, plugin, operation, generator }) {
    const pluginManager = usePluginManager()
    const {
      options,
      options: { output, urlType },
    } = plugin

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const url = {
      name: getName(operation, { type: 'function', suffix: 'url', prefix: 'get' }),
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

    const isFormData = operation.getContentType() === 'multipart/form-data'

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
            <File.Import name={['fetch']} root={client.file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
            <File.Import
              name={['RequestConfig', 'ResponseErrorConfig']}
              root={client.file.path}
              path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
              isTypeOnly
            />
          </>
        )}

        {isFormData && type.schemas.request?.name && (
          <File.Import name={['buildFormData']} root={client.file.path} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />
        )}

        {options.parser === 'zod' && (
          <File.Import name={[zod.schemas.response.name, zod.schemas.request?.name].filter(Boolean)} root={client.file.path} path={zod.file.path} />
        )}
        <File.Import
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

        <Url
          name={url.name}
          baseURL={options.baseURL}
          pathParamsType={options.pathParamsType}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          typeSchemas={type.schemas}
          operation={operation}
          isIndexable={urlType === 'export'}
          isExportable={urlType === 'export'}
        />

        <Client
          name={client.name}
          urlName={url.name}
          baseURL={options.baseURL}
          dataReturnType={options.dataReturnType}
          pathParamsType={options.pathParamsType}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          typeSchemas={type.schemas}
          operation={operation}
          parser={options.parser}
          zodSchemas={zod.schemas}
        />
      </File>
    )
  },
})
