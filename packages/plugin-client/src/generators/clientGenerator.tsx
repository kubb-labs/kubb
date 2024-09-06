import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Client } from '../components/Client'
import type { PluginClient } from '../types'

export const clientGenerator = createReactGenerator<PluginClient>({
  name: 'client',
  Operation({ options, operation }) {
    const {
      mode,
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

    if (!options.template) {
      return null
    }

    const Template = options.template || Client

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Import name={'client'} path={options.importPath || '@kubb/plugin-client/client'} />
        <File.Import name={['ResponseConfig']} path={options.importPath || '@kubb/plugin-client/client'} isTypeOnly />
        {mode === 'split' && (
          <File.Import
            extName={output?.extName}
            name={[
              type.schemas.request?.name,
              type.schemas.response.name,
              type.schemas.pathParams?.name,
              type.schemas.queryParams?.name,
              type.schemas.headerParams?.name,
            ].filter(Boolean)}
            root={client.file.path}
            path={type.file.path}
            isTypeOnly
          />
        )}
        <Template name={client.name} options={options} typedSchemas={type.schemas} operation={operation} />
      </File>
    )
  },
})
