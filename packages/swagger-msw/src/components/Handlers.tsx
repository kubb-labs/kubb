import { File, usePlugin, usePluginManager } from '@kubb/react'
import { useFile } from '@kubb/react'

import type { ResolveNameParams } from '@kubb/core'
import type { HttpMethod, Operation } from '@kubb/swagger'
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
      {`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const;`}
    </>
  )
}

const defaultTemplates = { default: Template } as const

function getHandlers(
  paths: Record<string, Record<HttpMethod, Operation>>,
  { resolveName, pluginKey }: { resolveName: (params: ResolveNameParams) => string; pluginKey: ResolveNameParams['pluginKey'] },
): Array<{ name: string; operation: Operation }> {
  const handlers: Array<{ name: string; operation: Operation }> = []

  Object.keys(paths).forEach((path) => {
    const operations = paths[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(operation => {
      const operationId = operation.getOperationId()
      const name = resolveName({ name: operationId, pluginKey })

      handlers.push({ name, operation })
    })
  })

  return handlers
}

type Props = {
  paths: Record<string, Record<HttpMethod, Operation>>
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Template>>
}

export function Handlers({
  paths,
  Template = defaultTemplates.default,
}: Props): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()

  const handlers = getHandlers(paths, { resolveName: pluginManager.resolveName, pluginKey })

  return (
    <Template
      name="handlers"
      handlers={handlers.map(item => item.name)}
    />
  )
}

type FileProps = {
  paths: Record<string, Record<HttpMethod, Operation>>
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Handlers.File = function({ paths, templates = defaultTemplates }: FileProps): ReactNode {
  const pluginManager = usePluginManager()
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name: 'handlers', pluginKey })

  const handlers = getHandlers(paths, { resolveName: pluginManager.resolveName, pluginKey })

  const imports = handlers.map(({ name, operation }) => {
    const path = pluginManager.resolvePath({
      pluginKey,
      baseName: `${name}.ts`,
      options: {
        tag: operation?.getTags()[0]?.name,
      },
    })
    if (!path) {
      return null
    }

    return <File.Import key={name} name={[name]} root={file.path} path={path} />
  }).filter(Boolean)

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={file.meta}
    >
      {imports}
      <File.Source>
        <Handlers Template={Template} paths={paths} />
      </File.Source>
    </File>
  )
}

Handlers.templates = defaultTemplates
