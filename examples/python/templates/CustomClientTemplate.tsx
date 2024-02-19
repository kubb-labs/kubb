import { File, Editor } from '@kubb/react'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'
import { useOperationFile } from '@kubb/swagger/hooks'

export const templates = {
  default: function({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
    const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

    const filePython = useOperationFile({ extName: '.py' })

    return (
      <>
        <Editor language="typescript" />
        <Editor language="text">
          <File
            baseName={filePython.baseName}
            path={filePython.path}
            meta={filePython.meta}
          >
            <File.Source>
              import requests
              <br />
              {`response = requests.${client.method}("${client.path.URL}")`}
              print(response.status_code)
            </File.Source>
          </File>
        </Editor>
      </>
    )
  },
} as const
