import { Editor, Function, File, useFile, usePlugin } from '@kubb/react'
import { useOperations } from '@kubb/swagger/hooks'
import { Operations } from '@kubb/swagger-tanstack-query/components'
import React from 'react'
import { FileMeta, PluginOptions } from '@kubb/swagger-tanstack-query'
import { Operation } from '@kubb/swagger/oas'

export const templates = {
  ...Operations.templates,
  editor: function({ children }: React.ComponentProps<typeof Operations.templates.editor>) {
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
  },
  default: function({}: React.ComponentProps<typeof Operations.templates.default>) {
    const operations = useOperations()

    return (
      <>
        {operations.map((item) => {
          return (
            <Function name={item.getOperationId()} export>
              return {JSON.stringify(item.path)}
            </Function>
          )
        })}
      </>
    )
  },
} as const
