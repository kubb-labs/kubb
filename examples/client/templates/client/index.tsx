import { Editor, File, Function } from '@kubb/react'
import type { Client } from '@kubb/swagger-client/components'
import type React from 'react'

export const templates = {
  default: function ({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
    const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

    return (
      <>
        <File.Import name="axios" path="axios" />
        <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
          {`return axios.${client.method}(${clientParams})`}
        </Function>
      </>
    )
  },
} as const
