import { File, useApp } from '@kubb/react'

import type { PluginMsw } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'
import { Mock } from '../components/Mock.tsx'
import { pluginFakerName } from '@kubb/plugin-faker'

// TOOD move to faker plugin
const fakerParser = createParser({
  name: 'faker',
  pluginName: pluginFakerName,
})

export const mockParser = createParser<PluginMsw>({
  name: 'client',
  pluginName: 'plugin-msw',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const { pluginManager } = useApp<PluginMsw>()

      const name = getName({ type: 'function' })
      const file = getFile()
      const fileFaker = getFile({ parser: fakerParser })
      const schemas = getSchemas()

      const responseName = pluginManager.resolveName({
        pluginKey: [pluginFakerName],
        name: schemas.response.name,
        type: 'function',
      })

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          <File.Import name={['http']} path={'msw'} />
          {fileFaker && responseName && <File.Import extName={options.extName} name={[responseName]} root={file.path} path={fileFaker.path} />}

          <File.Source>
            <Mock name={name} responseName={responseName} operation={operation} />
          </File.Source>
        </File>
      )
    },
  },
})
