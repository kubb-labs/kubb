import React from 'react'

import { Function } from '@kubb/react-template'

import type { URLObject, URLPath } from '@kubb/core'

type Props = {
  name: string
  params: string
  // generics: string[]
  // returnType: string
  // comments: string[]
  children?: React.ReactNode

  // props QueryKey
  path: URLPath
  withParams: boolean
}

function QueryKeyFunctionBase({ name, params, path, withParams, children }: Props): React.ReactNode {
  const result = [
    path.toObject({
      type: 'template',
      stringify: true,
    }),
    withParams ? `...(params ? [params] : [])` : undefined,
  ].filter(Boolean)

  return (
    <Function.Arrow name={name} export params={params} singleLine>
      {children ? children : `[${result.join(',')}] as const;`}
    </Function.Arrow>
  )
}

function QueryKeyFunctionVue({ name, params, path, withParams }: Props): React.ReactNode {
  const result = [
    path.toObject({
      type: 'template',
      stringify: true,
      replacer: (pathParam) => `unref(${pathParam})`,
    }),
    withParams ? `...(params ? [params] : [])` : undefined,
  ].filter(Boolean)

  return (
    <QueryKeyFunctionBase name={name} params={params} path={path} withParams={withParams}>
      {`[${result.join(',')}] as const;`}
    </QueryKeyFunctionBase>
  )
}

export const QueryKeyFunction = {
  react: QueryKeyFunctionBase,
  solid: QueryKeyFunctionBase,
  svelte: QueryKeyFunctionBase,
  vue: QueryKeyFunctionVue,
} as const
