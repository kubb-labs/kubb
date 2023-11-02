import { createIndent, Function } from '@kubb/react'

import type { URLPath } from '@kubb/core'
import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'
import type { Options as PluginOptions } from '../types.ts'

type Props = {
  name: string
  params: string
  generics?: string
  returnType: string
  comments: string[]
  children?: ReactNode

  // props Client
  method: HttpMethod
  path: URLPath
  clientGenerics: string
  dataReturnType: PluginOptions['dataReturnType']
  withParams?: boolean
  withData?: boolean
  withHeaders?: boolean
}

export function ClientFunction({
  name,
  generics,
  returnType,
  params,
  method,
  path,
  clientGenerics,
  withParams,
  withData,
  withHeaders,
  comments,
  children,
  dataReturnType,
}: Props): ReactNode {
  const clientParams = [
    `method: "${method}"`,
    `url: ${path.template}`,
    withParams ? 'params' : undefined,
    withData ? 'data' : undefined,
    withHeaders ? 'headers: { ...headers, ...options.headers }' : undefined,
    '...options',
  ].filter(Boolean)

  const clientOptions = `${createIndent(4)}${clientParams.join(`,\n${createIndent(4)}`)}`

  if (dataReturnType === 'full') {
    return (
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={{ comments }}>
        {`
  return client<${clientGenerics}>({
  ${createIndent(4)}${clientParams.join(`,\n${createIndent(4)}`)}
  });`}
        {children}
      </Function>
    )
  }

  return (
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={{ comments }}>
      {`
const { data: resData } = await client<${clientGenerics}>({
${clientOptions}
});

return resData;`}

      {children}
    </Function>
  )
}
