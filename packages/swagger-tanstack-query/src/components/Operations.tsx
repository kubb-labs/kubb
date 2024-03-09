import { Editor, File, usePlugin } from '@kubb/react'
import { useFile } from '@kubb/react'

import type { KubbNode } from '@kubb/react'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
type TemplateProps = {}

// eslint-disable-next-line no-empty-pattern
function Template({}: TemplateProps): KubbNode {
  return null
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

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Operations({
  Template = defaultTemplates.default,
}: Props): KubbNode {
  return <Template />
}

type FileProps = {
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
      <Operations Template={Template} />
    </EditorTemplate>
  )
}

Operations.templates = defaultTemplates as Templates
