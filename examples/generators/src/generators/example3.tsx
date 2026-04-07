import type { PluginOas } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { Const, File, Function } from '@kubb/renderer-jsx'

const pascalCase = (str: string) =>
  str
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const example3 = createReactGenerator<PluginOas>({
  name: 'client-operation',
  Operation({ operation, generator }) {
    const { getName, getFile } = useOperationManager(generator)

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation, { extname: '.tsx' }),
    }

    const componentName = pascalCase(operation.getOperationId())
    const href = toURL(operation.path)

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Source>
          <Function name={componentName} export>
            <Const name="href">{`'${href}'`}</Const>
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
