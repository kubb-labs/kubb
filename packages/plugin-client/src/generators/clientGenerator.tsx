import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Client } from '../components/Client'
import type { PluginClient } from '../types'

export const clientGenerator = createReactGenerator<PluginClient>({
  name: 'plugin-client',
  Operation({ options, operation }) {
    const { plugin } = useApp<PluginClient>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const name = getName(operation, { type: 'function' })
    const typedSchemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
    const file = getFile(operation)
    const typedFile = getFile(operation, { pluginKey: [pluginTsName] })

    if (!options.template) {
      return null
    }

    const Template = options.template || Client

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={'client'} path={options.importPath || '@kubb/plugin-client/client'} />
        <File.Import name={['ResponseConfig']} path={options.importPath || '@kubb/plugin-client/client'} isTypeOnly />
        <File.Import
          extName={plugin.output?.extName}
          name={[
            typedSchemas.request?.name,
            typedSchemas.response.name,
            typedSchemas.pathParams?.name,
            typedSchemas.queryParams?.name,
            typedSchemas.headerParams?.name,
          ].filter(Boolean)}
          root={file.path}
          path={typedFile.path}
          isTypeOnly
        />
        <Template name={name} options={options} typedSchemas={typedSchemas} operation={operation} />
      </File>
    )
  },
})
