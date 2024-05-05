import { Parser, File, useApp } from '@kubb/react'
import { useOperationManager, useOperations } from '@kubb/swagger/hooks'

import type { KubbNode } from '@kubb/react'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  name: string
  handlers: string[]
}

function Template({ name, handlers }: TemplateProps): ReactNode {
  return <>{`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const`}</>
}

type ParserTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: ParserTemplateProps) {
  const {
    pluginManager,
    plugin: { key: pluginKey },
  } = useApp<PluginOptions>()

  const { getName, getFile } = useOperationManager()

  const file = pluginManager.getFile({ name: 'handlers', extName: '.ts', pluginKey })
  const operations = useOperations()

  const imports = operations
    .map((operation) => {
      const operationFile = getFile(operation, { pluginKey })
      const operationName = getName(operation, { pluginKey, type: 'function' })

      return <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
    })
    .filter(Boolean)

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
        {imports}
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
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Operations({ Template = defaultTemplates.default }: Props): ReactNode {
  const {
    plugin: { key: pluginKey },
  } = useApp<PluginOptions>()

  const operations = useOperations()
  const { getName } = useOperationManager()

  return <Template name="handlers" handlers={operations.map((operation) => getName(operation, { type: 'function', pluginKey }))} />
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
