import { transformers } from '@kubb/core/utils'
import { File, Function } from '@kubb/react'
import { Client } from '../src/components/Client.tsx'

export default function({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  return (
    <>
      <File.Import name="axios" path="axios" />
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
const { data: resData } = await Axios.${client.method}<${client.generics}>({
${resolvedClientOptions}
});

return resData;`}
      </Function>
    </>
  )
}
