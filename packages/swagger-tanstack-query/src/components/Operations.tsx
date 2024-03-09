import { URLPath } from '@kubb/core/utils'
import { Editor, File, usePlugin } from '@kubb/react'
import { useFile } from '@kubb/react'
import { useOas, useOperation, useOperations } from '@kubb/swagger/hooks'

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
}

function Template({
  name,
}: TemplateProps): KubbNode {
  return (
    <>
    </>
  )
}

const defaultTemplates = { default: Template } as const

function getOperations(oas: Oas, paths: OperationsByMethod): Record<string, { path: string; method: HttpMethod }> {
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

  return operations
}

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Operations({
  Template = defaultTemplates.default,
}: Props): KubbNode {
  const operations = useOperations()
  console.log({ operations })

  return <Template name="operations" />
}

type FileProps = {
  name: string
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: typeof defaultTemplates
}

Operations.File = function({ name, templates = defaultTemplates }: FileProps): KubbNode {
  const { key: pluginKey } = usePlugin<PluginOptions>()
  const file = useFile({ name, extName: '.ts', pluginKey })

  const Template = templates.default

  return (
    <Editor language="typescript">
      <File<FileMeta>
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
      >
        <File.Source>
          <Operations Template={Template} />
        </File.Source>
      </File>
    </Editor>
  )
}

Operations.templates = defaultTemplates
