import transformers from '@kubb/core/transformers'
import { URLPath } from '@kubb/core/utils'
import { Parser, File, useApp } from '@kubb/react'
import { pluginZodName } from '@kubb/swagger-zod'

import { getDefinitions, getDefinitionsImports } from './utils.ts'

import type { OperationsByMethod } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { FileMeta, PluginZodios } from '../types.ts'

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
  includeOperationIdAsAlias: boolean
  /**
   * @deprecated
   */
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Definitions({ baseURL, operationsByMethod, Template = defaultTemplates.default, includeOperationIdAsAlias }: Props): ReactNode {
  const { pluginManager } = useApp<PluginZodios>()
  const definitions = getDefinitions(operationsByMethod, {
    resolveName: pluginManager.resolveName,
    pluginKey: [pluginZodName],
  })

  return (
    <Template
      name={'api'}
      baseURL={baseURL}
      definitions={definitions.map(({ errors, response, operation, parameters }) => {
        const template = `
    {
      method: "${operation.method}",
      path: "${new URLPath(operation.path).URL}",
      ${includeOperationIdAsAlias ? `alias: "${operation.getOperationId()}",\n` : ''}
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
        // remove empty lines from conditional property rendering
        return template.replace(/^\s*[\r\n]/gm, '').trim()
      })}
    />
  )
}

type FileProps = {
  name: string
  baseURL: string | undefined
  includeOperationIdAsAlias: boolean | undefined
  /**
   * @deprecated
   */
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Definitions.File = function ({ name, baseURL, operationsByMethod, templates = defaultTemplates, includeOperationIdAsAlias = false }: FileProps): ReactNode {
  const {
    pluginManager,
    plugin: { key: pluginKey, options },
  } = useApp<PluginZodios>()
  const file = pluginManager.getFile({ name, extName: '.ts', pluginKey })

  const definitionsImports = getDefinitionsImports(operationsByMethod, {
    resolveName: pluginManager.resolveName,
    resolvePath: pluginManager.resolvePath,
    pluginKey: [pluginZodName],
  })

  const imports = definitionsImports
    .map(({ name, path }, index) => {
      if (!path) {
        return null
      }

      return <File.Import extName={options.extName} key={index} name={[name]} root={file.path} path={path} />
    })
    .filter(Boolean)

  const Template = templates.default

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['makeApi', 'Zodios']} path="@zodios/core" />
        {imports}
        <File.Source>
          <Definitions Template={Template} operationsByMethod={operationsByMethod} baseURL={baseURL} includeOperationIdAsAlias={includeOperationIdAsAlias} />
        </File.Source>
      </File>
    </Parser>
  )
}

Definitions.templates = defaultTemplates
