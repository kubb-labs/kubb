import { File, usePlugin, usePluginManager } from '@kubb/react'
import { resolve } from '@kubb/swagger'
import { useResolve } from '@kubb/swagger/hooks'

import type { ResolveNameParams } from '@kubb/core'
import type { HttpMethod, Operation } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type HandlersTemplateProps = {
  name?: string
  handlers: string[]
}

Handlers.Template = function({
  name = 'handlers',
  handlers,
}: HandlersTemplateProps): ReactNode {
  return (
    <>
      {`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const;`}
    </>
  )
}

const defaultTemplates = { default: Handlers.Template } as const

type HandlersFileProps = {
  paths: Record<string, Record<HttpMethod, Operation>>
  /**
   * Will make it possible to override the default behaviour of Mock.Template
   */
  templates?: typeof defaultTemplates
}

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

Handlers.File = function({ paths, templates = defaultTemplates }: HandlersFileProps): ReactNode {
  const pluginManager = usePluginManager()
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useResolve({ name: 'handlers', pluginKey, type: 'file' })

  const handlers = getHandlers(paths, { resolveName: pluginManager.resolveName, pluginKey })

  const imports = handlers.map(({ name, operation }) => {
    // TODO can we do without the pluginManager and resolve(tag should be set and can cause issues)
    const { path } = resolve({
      pluginKey,
      type: 'function',
      name,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      tag: operation?.getTags()[0]?.name,
    })

    return <File.Import key={name} name={[name]} root={file.path} path={path} />
  })

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={{
        pluginKey,
      }}
    >
      {imports}
      <File.Source>
        <Handlers Template={Template} paths={paths} />
      </File.Source>
    </File>
  )
}

type HandlersProps = {
  paths: Record<string, Record<HttpMethod, Operation>>
  /**
   * Will make it possible to override the default behaviour of Handlers.Template
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Handlers.Template>>
}

export function Handlers({
  paths,
  Template = defaultTemplates.default,
}: HandlersProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()

  // TODO can we do without pluginManager
  const handlers = getHandlers(paths, { resolveName: pluginManager.resolveName, pluginKey })

  return (
    <Template
      handlers={handlers.map(item => item.name)}
    />
  )
}
