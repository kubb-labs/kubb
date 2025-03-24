import { URLPath } from '@kubb/core/utils'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Request } from '../components'
import type { PluginCypress } from '../types'

export const cypressGenerator = createReactGenerator<PluginCypress>({
  name: 'cypress',
  Operation({ operation }) {
    const {
      plugin: {
        options: { output, baseURL, dataReturnType },
      },
    } = useApp<PluginCypress>()
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const request = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    return (
      <File
        baseName={request.file.baseName}
        path={request.file.path}
        meta={request.file.meta}
        banner={getBanner({ oas, output })}
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
          typeSchemas={type.schemas}
          method={operation.method}
          baseURL={baseURL}
          url={new URLPath(operation.path).toURLPath()}
        />
      </File>
    )
  },
})
