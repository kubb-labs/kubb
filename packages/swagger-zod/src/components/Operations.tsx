import { URLPath } from '@kubb/core/utils'
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
  name: string
  operations: Operation[]
}

function Template({ name, operations }: TemplateProps): KubbNode {
  const operationsObject: Record<
    string,
    { data?: string; error?: string; request?: string; pathParams?: string; queryParams?: string; headerParams?: string; response?: string }
  > = {}

  const plugin = usePlugin()
  const pluginManager = usePluginManager()
  const { getSchemas } = useOperationManager()

  operations.forEach((operation) => {
    const schemas = getSchemas(operation)

    operationsObject[operation.getOperationId()] = {
      data: undefined,
      error: undefined,
      request: undefined,
      pathParams: undefined,
      queryParams: undefined,
      headerParams: undefined,
      response: transformers.trimQuotes(
        pluginManager.resolveName({
          name: schemas.response.name,
          pluginKey: plugin.key,
          type: 'function',
        }),
      ),
    }
  })

  return <>{`export const ${name} = ${JSON.stringify(operationsObject)} as const;`}</>
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()
  const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey })

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
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

  return <Template name="operations" operations={operations} />
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
