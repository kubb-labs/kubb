import { URLPath } from '@kubb/core/utils'
import { Editor, File, useApp } from '@kubb/react'
import { useOperations } from '@kubb/swagger/hooks'

import type { HttpMethod, Operation } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  operationsName: string
  operations: Operation[]
}

function Template({ operationsName, operations }: TemplateProps): KubbNode {
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })

  return <>{`export const ${operationsName} = ${JSON.stringify(operationsObject, undefined, 2)} as const;`}</>
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const {
    pluginManager,
    plugin: { key: pluginKey },
  } = useApp<PluginOptions>()
  const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey })

  return (
    <Editor language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
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

  return <Template operationsName="operations" operations={operations} />
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
