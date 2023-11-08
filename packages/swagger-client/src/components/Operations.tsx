import { URLPath } from '@kubb/core/utils'
import { File, usePlugin } from '@kubb/react'
import { useResolve } from '@kubb/swagger/hooks'

import type { HttpMethod, Oas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { FileMeta, PluginOptions } from '../types.ts'

type OperationsTemplateProps = {
  name?: string
  operations: Record<string, { path: string; method: HttpMethod }>
}

Operations.Template = function({
  name = 'operations',
  operations,
}: OperationsTemplateProps): ReactNode {
  return (
    <>
      {`export const ${name} = ${JSON.stringify(operations)} as const;`}
    </>
  )
}

const defaultTemplates = { default: Operations.Template } as const

type OperationsFileProps = {
  oas: Oas
  paths: Record<string, Record<HttpMethod, Operation>>
  /**
   * Will make it possible to override the default behaviour of Mock.Template
   */
  templates?: typeof defaultTemplates
}

Operations.File = function({ paths, oas, templates = defaultTemplates }: OperationsFileProps): ReactNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useResolve({ name: 'operations', pluginKey, type: 'file' })

  const Template = templates.default

  return (
    <File<FileMeta>
      baseName={file.baseName}
      path={file.path}
      meta={{
        pluginKey,
      }}
    >
      <File.Source>
        <Operations Template={Template} paths={paths} oas={oas} />
      </File.Source>
    </File>
  )
}

type OperationsProps = {
  oas: Oas
  paths: Record<string, Record<HttpMethod, Operation>>
  /**
   * Will make it possible to override the default behaviour of Operations.Template
   */
  Template?: React.ComponentType<React.ComponentProps<typeof Operations.Template>>
}

export function Operations({
  oas,
  paths,
  Template = defaultTemplates.default,
}: OperationsProps): ReactNode {
  const operations: Record<string, { path: string; method: HttpMethod }> = {}

  Object.keys(paths).forEach((path) => {
    const methods = paths[path] || []
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

  return (
    <Template
      operations={operations}
    />
  )
}
