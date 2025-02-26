import { URLPath } from '@kubb/core/utils'
import { pluginFakerName } from '@kubb/plugin-faker'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Mock, MockWithFaker } from '../components'
import type { PluginCypress } from '../types'

export const cypressGenerator = createReactGenerator<PluginCypress>({
  name: 'cypress',
  Operation({ operation }) {
    const {
      plugin: {
        options: { output, parser, baseURL },
      },
    } = useApp<PluginCypress>()
    const oas = useOas()
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
      <File baseName={mock.file.baseName} path={mock.file.path} meta={mock.file.meta} banner={getBanner({ oas, output })} footer={getFooter({ oas, output })}>
        <File.Import name={['ResponseResolver']} isTypeOnly path="cypress" />
        <File.Import name={[type.schemas.response.name]} path={type.file.path} root={mock.file.path} isTypeOnly />
        {parser === 'faker' && faker.file && faker.schemas.response && (
          <File.Import name={[faker.schemas.response.name]} root={mock.file.path} path={faker.file.path} />
        )}

        {parser === 'faker' && (
          <MockWithFaker
            name={mock.name}
            typeName={type.schemas.response.name}
            fakerName={faker.schemas.response.name}
            method={operation.method}
            baseURL={baseURL}
            url={new URLPath(operation.path).toURLPath()}
          />
        )}
        {parser === 'data' && (
          <Mock
            name={mock.name}
            typeName={type.schemas.response.name}
            fakerName={faker.schemas.response.name}
            method={operation.method}
            baseURL={baseURL}
            url={new URLPath(operation.path).toURLPath()}
          />
        )}
      </File>
    )
  },
})
