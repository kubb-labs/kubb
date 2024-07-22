import { Parser, File } from '@kubb/react'
import type { Client } from '@kubb/plugin/components'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import type React from 'react'

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
    const { getFile } = useOperationManager()
    const operation = useOperation()
    const filePython = getFile(operation, { extName: '.py' })

    return (
      <Parser language="python">
        <File baseName={filePython.baseName} path={filePython.path} meta={filePython.meta}>
          <File.Source>{children}</File.Source>
        </File>
      </Parser>
    )
  },
} as const
