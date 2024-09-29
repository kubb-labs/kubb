import { URLPath } from '@kubb/core/utils'
import { pluginFakerName } from '@kubb/plugin-faker'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, useApp } from '@kubb/react'
import { Mock } from '../components'
import type { PluginMsw } from '../types'

export const mswGenerator = createReactGenerator<PluginMsw>({
  name: 'msw',
  Operation({ operation }) {
    const {
      plugin: {
        options: { output },
      },
    } = useApp<PluginMsw>()
    const { getSchemaName, getName, getFile } = useOperationManager()

    const mock = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const faker = {
      name: getSchemaName(operation, 'response', { pluginKey: [pluginFakerName], type: 'function' }),
      file: getFile(operation, { pluginKey: [pluginFakerName] }),
    }

    return (
      <File baseName={mock.file.baseName} path={mock.file.path} meta={mock.file.meta} banner={output?.banner} footer={output?.footer}>
        <File.Import name={['http']} path={'msw'} />
        {faker.file && faker.name && <File.Import name={[faker.name]} root={mock.file.path} path={faker.file.path} />}

        <Mock name={mock.name} fakerName={faker.name} method={operation.method} url={new URLPath(operation.path).toURLPath()} />
      </File>
    )
  },
})
