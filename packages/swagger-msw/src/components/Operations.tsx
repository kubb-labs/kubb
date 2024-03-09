import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { useFile } from '@kubb/react'

import { getHandlers, getHandlersImports } from './utils.ts'

import type { KubbNode } from '@kubb/react'
import type { OperationsByMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  handlers: string[]
}

function Template({
  name,
  handlers,
}: TemplateProps): ReactNode {
  return (
    <>
      {`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const`}
    </>
  )
}

type EditorTemplateProps = {
  /**
   * @deprecated
   */
  operationsByMethod: OperationsByMethod
  children?: React.ReactNode
}

function EditorTemplate({ operationsByMethod, children }: EditorTemplateProps) {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name: 'handlers', extName: '.ts', pluginKey })

  const pluginManager = usePluginManager()

  const handlersImports = getHandlersImports(operationsByMethod, { resolveName: pluginManager.resolveName, resolvePath: pluginManager.resolvePath, pluginKey })

  const imports = handlersImports.map(({ name, path }, index) => {
    if (!path) {
      return null
    }

    return <File.Import key={index} name={[name]} root={file.path} path={path} />
  }).filter(Boolean)

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        {imports}
        <File.Source>
          {children}
        </File.Source>
      </File>
    </Editor>
  )
}

const defaultTemplates = { default: Template, editor: EditorTemplate } as const

type Templates = Partial<typeof defaultTemplates>

type Props = {
  operationsByMethod: OperationsByMethod
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Operations({
  operationsByMethod,
  Template = defaultTemplates.default,
}: Props): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()

  const handlers = getHandlers(operationsByMethod, { resolveName: pluginManager.resolveName, pluginKey })

  return (
    <Template
      name="handlers"
      handlers={handlers.map(item => item.name)}
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
    <EditorTemplate operationsByMethod={props.operationsByMethod}>
      <Operations Template={Template} operationsByMethod={props.operationsByMethod} />
    </EditorTemplate>
  )
}

Operations.templates = defaultTemplates
