import { URLPath } from '@kubb/core/utils'
import { Editor, File, usePlugin } from '@kubb/react'
import { useGetFile } from '@kubb/react'
import { useOperations } from '@kubb/swagger/hooks'

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
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })

  return <>{`export const ${name} = ${JSON.stringify(operationsObject)} as const;`}</>
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useGetFile({ name: 'operations', extName: '.ts', pluginKey })

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
