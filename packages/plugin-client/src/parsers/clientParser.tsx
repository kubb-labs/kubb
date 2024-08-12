import { File } from '@kubb/react'
import { pluginTsName } from '@kubb/plugin-ts'

import type { PluginClient } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'
import { Client } from '../components/Client.tsx'

// TOOD move to ts plugin
const typeParser = createParser({
  name: 'types',
  pluginName: pluginTsName,
})

export const clientParser = createParser<PluginClient>({
  name: 'client',
  pluginName: 'plugin-client',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const name = getName({ type: 'function' })
      const typedSchemas = getSchemas({ parser: typeParser })
      const file = getFile()
      const fileType = getFile({ parser: typeParser })

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
          <File.Source>
            <Client name={name} options={options} typedSchemas={typedSchemas} operation={operation} />
          </File.Source>
        </File>
      )
    },
  },
})
