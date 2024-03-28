import transformers from '@kubb/core/transformers'
import { URLPath } from '@kubb/core/utils'
import { Editor, File, useGetFile, usePlugin } from '@kubb/react'
import { usePluginManager } from '@kubb/react'
import { pluginKey as swaggerZodPluginKey } from '@kubb/swagger-zod'

import { getDefinitions, getDefinitionsImports } from './utils.ts'

import type { OperationsByMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  definitions: string[]
  baseURL: string | undefined
}

function Template({ name, definitions, baseURL }: TemplateProps): ReactNode {
  return (
    <>
      {`export const endpoints = makeApi([${definitions.join(',')}])`}
      <br />
      {'export const getAPI = (baseUrl: string) => new Zodios(baseUrl, endpoints)'}
      <br />
      {baseURL && `export const ${name} = new Zodios('${baseURL}', endpoints)`}
      {!baseURL && `export const  ${name} = new Zodios(endpoints)`}
      <br />
      {`export default ${name}`}
    </>
  )
}
const defaultTemplates = { default: Template } as const

type Props = {
  baseURL: string | undefined
  /**
   * @deprecated
   */
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Definitions({ baseURL, operationsByMethod, Template = defaultTemplates.default }: Props): ReactNode {
  const pluginManager = usePluginManager()
  const definitions = getDefinitions(operationsByMethod, {
    resolveName: pluginManager.resolveName,
    pluginKey: swaggerZodPluginKey,
  })

  return (
    <Template
      name={'api'}
      baseURL={baseURL}
      definitions={definitions.map(({ errors, response, operation, parameters }) => {
        return `
        {
          method: "${operation.method}",
          path: "${new URLPath(operation.path).URL}",
          description: \`${transformers.escape(operation.getDescription())}\`,
          requestFormat: "json",
          parameters: [
              ${parameters.join(',')}
          ],
          response: ${response},
          errors: [
              ${errors.join(',')}
          ],
      }
      `
      })}
    />
  )
}

type FileProps = {
  name: string
  baseURL: string | undefined
  /**
   * @deprecated
   */
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Definitions.File = function ({ name, baseURL, operationsByMethod, templates = defaultTemplates }: FileProps): ReactNode {
  const pluginManager = usePluginManager()
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useGetFile({ name, extName: '.ts', pluginKey })

  const definitionsImports = getDefinitionsImports(operationsByMethod, {
    resolveName: pluginManager.resolveName,
    resolvePath: pluginManager.resolvePath,
    pluginKey: swaggerZodPluginKey,
  })

  const imports = definitionsImports
    .map(({ name, path }, index) => {
      if (!path) {
        return null
      }

      return <File.Import key={index} name={[name]} root={file.path} path={path} />
    })
    .filter(Boolean)

  const Template = templates.default

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['makeApi', 'Zodios']} path="@zodios/core" />
        {imports}
        <File.Source>
          <Definitions Template={Template} operationsByMethod={operationsByMethod} baseURL={baseURL} />
        </File.Source>
      </File>
    </Editor>
  )
}

Definitions.templates = defaultTemplates
