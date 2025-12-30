import { usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Request } from '../components'
import type { PluginCypress } from '../types'

export const cypressGenerator = createReactGenerator<PluginCypress>({
  name: 'cypress',
  Operation({ operation, generator, plugin }) {
    const {
      options: { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType },
    } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const request = {
      name: getName(operation, { role: 'function' }),
      file: getFile(operation),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], role: 'type' }),
    }

    return (
      <File
        baseName={request.file.baseName}
        path={request.file.path}
        meta={request.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter(Boolean)}
          root={request.file.path}
          path={type.file.path}
          isTypeOnly
        />
        <Request
          name={request.name}
          dataReturnType={dataReturnType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          typeSchemas={type.schemas}
          method={operation.method}
          baseURL={baseURL}
          url={operation.path}
        />
      </File>
    )
  },
})
