import { URLPath } from '@kubb/core/utils'
import { pluginFakerName } from '@kubb/plugin-faker'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Mock, MockWithFaker } from '../components'
import type { PluginMsw } from '../types'

export const mswGenerator = createReactGenerator<PluginMsw>({
  name: 'msw',
  Operation({ operation }) {
    const {
      plugin: {
        options: { output, parser },
      },
    } = useApp<PluginMsw>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const mock = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    const faker = {
      file: getFile(operation, { pluginKey: [pluginFakerName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginFakerName], type: 'function' }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    return (
      <File baseName={mock.file.baseName} path={mock.file.path} meta={mock.file.meta} banner={output?.banner} footer={output?.footer}>
        <File.Import name={['http']} path={'msw'} />
        <File.Import name={[type.schemas.response.name]} path={type.file.path} root={mock.file.path} isTypeOnly />
        {faker.file && faker.schemas.response && <File.Import name={[faker.schemas.response.name]} root={mock.file.path} path={faker.file.path} />}

        {parser === 'faker' && (
          <MockWithFaker
            name={mock.name}
            typeName={type.schemas.response.name}
            fakerName={faker.schemas.response.name}
            method={operation.method}
            url={new URLPath(operation.path).toURLPath()}
          />
        )}
        {parser === 'data' && (
          <Mock
            name={mock.name}
            typeName={type.schemas.response.name}
            fakerName={faker.schemas.response.name}
            method={operation.method}
            url={new URLPath(operation.path).toURLPath()}
          />
        )}
      </File>
    )
  },
})
