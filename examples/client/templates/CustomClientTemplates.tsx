import { File, Function } from '@kubb/react'
import { PluginOptions } from '@kubb/swagger-client'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'

function ClientTemplate({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
  const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

  return (
    <>
      <File.Import name="axios" path="axios" />
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`return axios.${client.method}(${clientParams}`}
      </Function>
    </>
  )
}

export const templates: PluginOptions['options']['templates'] = {
  client: {
    default: ClientTemplate,
  },
}
