import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Client } from '../components/Client'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const axiosGenerator = createReactGenerator<PluginClient>({
  name: 'plugin-client',
  Operations({ options, operations }) {
    const { pluginManager } = useApp<PluginClient>()

    if (!options.templates.operations) {
      return null
    }

    const Template = options.templates.operations || Operations
    const name = 'operations'
    const file = pluginManager.getFile({ name, extName: '.ts', pluginKey: ['plugin-client'] })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <Template name={name} operations={operations} />
      </File>
    )
  },
  Operation({ options, operation }) {
    const { getSchemas, getName, getFile } = useOperationManager()

    const name = getName(operation, { type: 'function' })
    const typedSchemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
    const file = getFile(operation)
    const fileType = getFile(operation, { pluginKey: [pluginTsName] })

    if (!options.templates.client) {
      return null
    }

    const Template = options.templates.client || Client

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
        <File.Import
          extName={options.extName}
          name={[
            typedSchemas.request?.name,
            typedSchemas.response.name,
            typedSchemas.pathParams?.name,
            typedSchemas.queryParams?.name,
            typedSchemas.headerParams?.name,
          ].filter(Boolean)}
          root={file.path}
          path={fileType.path}
          isTypeOnly
        />
        <Template name={name} options={options} typedSchemas={typedSchemas} operation={operation} />
      </File>
    )
  },
})
