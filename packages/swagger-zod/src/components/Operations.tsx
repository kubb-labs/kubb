import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { useOperationManager, useOperations } from '@kubb/swagger/hooks'

import transformers from '@kubb/core/transformers'
import type { KubbNode } from '@kubb/react'
import type { HttpMethod, Operation } from '@kubb/swagger/oas'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  operationsName: string
  /**
   * Name of the function
   */
  pathsName: string
  operations: Operation[]
}

function Template({ operationsName, pathsName, operations }: TemplateProps): KubbNode {
  const { groupSchemasByByName } = useOperationManager()
  const transformedOperations = operations.map((operation) => ({ operation, data: groupSchemasByByName(operation, { type: 'function' }) }))

  const operationsJSON = transformedOperations.reduce(
    (prev, acc) => {
      prev[`"${acc.operation.getOperationId()}"`] = acc.data

      return prev
    },
    {} as Record<string, unknown>,
  )

  const pathsJSON = transformedOperations.reduce(
    (prev, acc) => {
      prev[`"${acc.operation.path}"`] = {
        ...(prev[`"${acc.operation.path}"`] || ({} as Record<HttpMethod, string>)),
        [acc.operation.method]: `operations["${acc.operation.getOperationId()}"]`,
      }

      return prev
    },
    {} as Record<string, Record<HttpMethod, string>>,
  )

  return (
    <>
      {`export const ${operationsName} = {
          ${transformers.stringifyObject(operationsJSON)}
       } as const;`}
      <br />
      {`export const ${pathsName} = {
         ${transformers.stringifyObject(pathsJSON)}
       } as const;`}
    </>
  )
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()
  const { getFile } = useOperationManager()
  const operations = useOperations()
  const { groupSchemasByByName } = useOperationManager()
  const transformedOperations = operations.map((operation) => ({ operation, data: groupSchemasByByName(operation, { type: 'function' }) }))

  const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey })
  const imports = Object.entries(transformedOperations)
    .map(([_key, { data, operation }], index) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean)

      return <File.Import key={index} name={names} root={file.path} path={getFile(operation).path} />
    })
    .filter(Boolean)

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
        {imports}
        <File.Source>{children}</File.Source>
      </File>
    </Editor>
  )
}

const defaultTemplates = { default: Template, root: RootTemplate } as const

type Templates = Partial<typeof defaultTemplates>

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Operations({ Template = defaultTemplates.default }: Props): KubbNode {
  const operations = useOperations()

  return <Template operationsName="operations" pathsName="paths" operations={operations} />
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: Templates
}

Operations.File = function (props: FileProps): KubbNode {
  const templates = { ...defaultTemplates, ...props.templates }

  const Template = templates.default
  const RootTemplate = templates.root

  return (
    <RootTemplate>
      <Operations Template={Template} />
    </RootTemplate>
  )
}

Operations.templates = defaultTemplates
