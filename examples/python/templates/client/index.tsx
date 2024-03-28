import { File, Editor } from '@kubb/react'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'
import { useGetOperationFile } from '@kubb/swagger/hooks'

export const templates = {
  default: function ({ client }: React.ComponentProps<typeof Client.templates.default>) {
    return (
      <>
        import requests
        <br />
        {`response = requests.${client.method}("${client.path.URL}")`}
        <br />
        <br />
        print(response.status_code)
      </>
    )
  },
  root({ children }: React.ComponentProps<typeof Client.templates.root>) {
    const filePython = useGetOperationFile({ extName: '.py' })

    return (
      <Editor language="python">
        <File baseName={filePython.baseName} path={filePython.path} meta={filePython.meta}>
          <File.Source>{children}</File.Source>
        </File>
      </Editor>
    )
  },
} as const
