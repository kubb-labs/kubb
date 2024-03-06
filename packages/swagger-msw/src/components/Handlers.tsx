import { Editor, File, usePlugin, usePluginManager } from '@kubb/react'
import { useFile } from '@kubb/react'

import type { KubbFile, ResolveNameParams, ResolvePathParams } from '@kubb/core'
import type { Paths } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
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

const defaultTemplates = { default: Template } as const

function getHandlers(
  paths: Paths,
  { resolveName, pluginKey }: { resolveName: (params: ResolveNameParams) => string; pluginKey: ResolveNameParams['pluginKey'] },
): Array<{ name: string; operation: Operation }> {
  const handlers: Array<{ name: string; operation: Operation }> = []

  Object.keys(paths).forEach((path) => {
    const operations = paths[path]
    const filteredOperations = [operations?.get, operations?.post, operations?.patch, operations?.put, operations?.delete].filter(Boolean)

    filteredOperations.forEach(({ operation }) => {
      const operationId = operation.getOperationId()
      const name = resolveName({ name: operationId, pluginKey, type: 'function' })

      handlers.push({ name, operation })
    })
  })

  return handlers
}

function getHandlersImports(
  paths: Paths,
  { resolveName, resolvePath, pluginKey }: {
    resolveName: (params: ResolveNameParams) => string
    resolvePath: (params: ResolvePathParams) => KubbFile.OptionalPath
    pluginKey: ResolveNameParams['pluginKey']
  },
): Array<{ name: string; path: KubbFile.OptionalPath }> {
  const handlers = getHandlers(paths, { resolveName, pluginKey })

  return handlers.map(({ name, operation }) => {
    const path = resolvePath({
      pluginKey,
      baseName: `${name}.ts`,
      options: {
        tag: operation?.getTags()[0]?.name,
      },
    })
    return { name, path }
  })
}

type Props = {
  paths: Paths
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
  name: string
  paths: Paths
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Handlers.File = function({ name, paths, templates = defaultTemplates }: FileProps): ReactNode {
  const pluginManager = usePluginManager()
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name, extName: '.ts', pluginKey })

  const handlersImports = getHandlersImports(paths, { resolveName: pluginManager.resolveName, resolvePath: pluginManager.resolvePath, pluginKey })

  const imports = handlersImports.map(({ name, path }, index) => {
    if (!path) {
      return null
    }

    return <File.Import key={index} name={[name]} root={file.path} path={path} />
  }).filter(Boolean)

  const Template = templates.default

  return (
    <Editor language="typescript">
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
    </Editor>
  )
}

Handlers.templates = defaultTemplates
