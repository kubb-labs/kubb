import { URLPath } from '@kubb/core/utils'
import { Editor, File, usePlugin } from '@kubb/react'
import { useFile } from '@kubb/react'
import { useOas } from '@kubb/swagger/hooks'

import type { KubbNode } from '@kubb/react'
import type { OperationsByMethod } from '@kubb/swagger'
import type { HttpMethod, Oas } from '@kubb/swagger/oas'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  operations: Record<string, { path: string; method: HttpMethod }>
}

function Template({
  name,
  operations,
}: TemplateProps): KubbNode {
  return (
    <>
      {`export const ${name} = ${JSON.stringify(operations)} as const;`}
    </>
  )
}

type EditorTemplateProps = {
  children?: React.ReactNode
}

function EditorTemplate({ children }: EditorTemplateProps) {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name: 'operations', extName: '.ts', pluginKey })

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Source>
          {children}
        </File.Source>
      </File>
    </Editor>
  )
}

const defaultTemplates = { default: Template, editor: EditorTemplate } as const

type Templates = Partial<typeof defaultTemplates>

function getOperations(oas: Oas, operationsByMethod: OperationsByMethod): Record<string, { path: string; method: HttpMethod }> {
  const operations: Record<string, { path: string; method: HttpMethod }> = {}

  Object.keys(operationsByMethod).forEach((path) => {
    const methods = operationsByMethod[path] || []
    Object.keys(methods).forEach((method) => {
      const operation = oas.operation(path, method as HttpMethod)
      if (operation) {
        operations[operation.getOperationId()] = {
          path: new URLPath(path).URL,
          method: method as HttpMethod,
        }
      }
    })
  })

  return operations
}

type Props = {
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Operations({
  operationsByMethod,
  Template = defaultTemplates.default,
}: Props): KubbNode {
  const oas = useOas()

  const operations = getOperations(oas, operationsByMethod)
  return (
    <Template
      name="operations"
      operations={operations}
    />
  )
}

type FileProps = {
  /**
   * @deprecated
   */
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: Templates
}

Operations.File = function(props: FileProps): KubbNode {
  const templates = { ...defaultTemplates, ...props.templates }

  const Template = templates.default
  const EditorTemplate = templates.editor

  return (
    <EditorTemplate>
      <Operations Template={Template} operationsByMethod={props.operationsByMethod} />
    </EditorTemplate>
  )
}

Operations.templates = defaultTemplates
