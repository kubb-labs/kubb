import { URLPath } from '@kubb/core/utils'
import { useOperations } from '@kubb/plugin-oas/hooks'
import { Const, File, Parser, useApp } from '@kubb/react'

import type { HttpMethod, Operation } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginClient } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  operations: Operation[]
  baseURL: string | undefined
}

function Template({ name, operations }: TemplateProps): KubbNode {
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })
  return (
    <Const name={name} export asConst>
      {JSON.stringify(operationsObject, undefined, 2)}
    </Const>
  )
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const {
    pluginManager,
    plugin: { key: pluginKey },
  } = useApp<PluginClient>()
  const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey })

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
        <File.Source>{children}</File.Source>
      </File>
    </Parser>
  )
}

const defaultTemplates = { default: Template, root: RootTemplate } as const

type Templates = Partial<typeof defaultTemplates>

type Props = {
  baseURL: string | undefined
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Operations({ baseURL, Template = defaultTemplates.default }: Props): KubbNode {
  const operations = useOperations()

  return <Template baseURL={baseURL} name="operations" operations={operations} />
}

type FileProps = {
  baseURL: string | undefined
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: Templates
}

Operations.File = function ({ baseURL, ...props }: FileProps): KubbNode {
  const templates = { ...defaultTemplates, ...props.templates }

  const Template = templates.default
  const RootTemplate = templates.root

  return (
    <RootTemplate>
      <Operations baseURL={baseURL} Template={Template} />
    </RootTemplate>
  )
}

Operations.templates = defaultTemplates
