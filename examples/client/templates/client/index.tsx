import { File, Function } from '@kubb/react'
import { Client } from '@kubb/plugin-client/components'
import type React from 'react'

export const templates = {
  ...Client.templates,
  default: function ({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
    const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

    return (
      <>
        <File.Import name="axios" path="axios" />
        <File.Source name={name} exportable>
          <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
            {`return axios.${client.method}(${clientParams})`}
          </Function>
        </File.Source>
      </>
    )
  },
} as const
