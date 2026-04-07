import type { PluginOas } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File } from '@kubb/renderer-jsx'

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

    const href = toURL(operation.path)
    const componentName = pascalCase(operation.getOperationId())

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Source>
          {`export function ${componentName}() {
  const href = '${href}'

  return (
    <a href={href}>Open ${operation.method}</a>
  )
}`}
        </File.Source>
      </File>
    )
  },
})
