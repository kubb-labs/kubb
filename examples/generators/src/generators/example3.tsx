import transformers from '@kubb/core/transformers'
import { URLPath } from '@kubb/core/utils'
import type { PluginOas } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { Const, File, Function } from '@kubb/react-fabric'

export const example3 = createReactGenerator<PluginOas>({
  name: 'client-operation',
  Operation({ operation, generator }) {
    const { getName, getFile } = useOperationManager(generator)

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation, { extname: '.tsx' }),
    }

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Source>
          <Function name={transformers.pascalCase(operation.getOperationId())} export>
            <Const name={'href'}>"{new URLPath(operation.path).URL}"</Const>
            <br />
            <br />
            return
            <div className="test">
              hello world
              {`
              <a href={href}>Open ${operation.method}</a>
              `}
              <button type={'button'} onClick={(e) => console.log(e)}>
                Submit
              </button>
            </div>
          </Function>
        </File.Source>
      </File>
    )
  },
})
