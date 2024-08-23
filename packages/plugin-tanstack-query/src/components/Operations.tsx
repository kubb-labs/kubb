import { Parser, File, useApp } from '@kubb/react'

import type { KubbNode } from '@kubb/react'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginTanstackQuery } from '../types.ts'

type TemplateProps = {}

function Template({}: TemplateProps): KubbNode {
  return null
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const {
    pluginManager,
    plugin: { key: pluginKey },
  } = useApp<PluginTanstackQuery>()

  const file = pluginManager.getFile({
    name: 'operations',
    mode: 'split',
    extName: '.ts',
    pluginKey,
  })

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Source>{children}</File.Source>
      </File>
    </Parser>
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
  return <Template />
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
