import path from 'node:path'
import transformers from '@kubb/core/transformers'
import { File, Function, usePluginManager } from '@kubb/react'
import { Mutation } from '@kubb/swagger-tanstack-query/components'
import { useOperation, useOperationManager } from '@kubb/swagger/hooks'
import type React from 'react'

export const templates = {
  ...Mutation.templates,
  react: function ({ name, params, JSDoc, client, hook, dataReturnType }: React.ComponentProps<typeof Mutation.templates.react>) {
    const pluginManager = usePluginManager()
    const operation = useOperation()
    const { getFile } = useOperationManager()

    const file = getFile(operation)
    const clientOptions = [
      `method: "${client.method}"`,
      `url: ${client.path.template}`,
      client.withQueryParams ? 'params' : undefined,
      client.withData ? 'data' : undefined,
      client.withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
      '...clientOptions',
    ].filter(Boolean)

    const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

    const root = path.resolve(pluginManager.config.root, pluginManager.config.output.path)

    return (
      <>
        <File.Import name={['useInvalidationForMutation']} path={path.join(root, '../useInvalidationForMutation.ts')} root={file.path} />
        <Function export name={name} params={params} JSDoc={JSDoc}>
          {`
       const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

       const invalidationOnSuccess = useInvalidationForMutation(
        "${name}",
      )

       return ${hook.name}({
         mutationFn: async(${client.withData ? 'data' : ''}) => {
          ${hook.children || ''}
           const res = await client<${client.generics}>({
            ${resolvedClientOptions}
           })

           return ${dataReturnType === 'data' ? 'res.data' : 'res'}
         },
         onSuccess: (...args) => {
          if (invalidationOnSuccess) invalidationOnSuccess(...args)
          if (mutationOptions?.onSuccess) mutationOptions.onSuccess(...args)
         },
         ...mutationOptions
       })`}
        </Function>
      </>
    )
  },
} as const
