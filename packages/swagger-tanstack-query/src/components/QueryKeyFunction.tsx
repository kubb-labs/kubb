import React from 'react'

import { createFunctionParams, URLPath } from '@kubb/core'
import { Function } from '@kubb/react-template'
import { getDataParams } from '@kubb/swagger'

import { useOperation, useSchemas } from '../hooks/index.ts'

type Props = {
  name: string
  // generics: string[]
  // returnType: string
  // comments: string[]
  // children?: React.ReactNode

  // props QueryKey
}

function QueryKeyFunctionBase({ name }: Props): React.ReactNode {
  const schemas = useSchemas()
  const operation = useOperation()
  const path = new URLPath(operation.path)
  const withParams = !!schemas.queryParams?.name

  const params = createFunctionParams([
    ...getDataParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: schemas.queryParams?.name,
      enabled: !!schemas.queryParams?.name,
      required: !!schemas.queryParams?.schema.required?.length,
    },
  ])

  const result = [
    path.toObject({
      type: 'template',
      stringify: true,
    }),
    withParams ? `...(params ? [params] : [])` : undefined,
  ].filter(Boolean)

  return (
    <Function.Arrow name={name} export params={params} singleLine>
      {`[${result.join(',')}] as const;`}
    </Function.Arrow>
  )
}

function QueryKeyFunctionVue({ name }: Props): React.ReactNode {
  const schemas = useSchemas()
  const operation = useOperation()
  const path = new URLPath(operation.path)
  const withParams = !!schemas.queryParams?.name

  const params = createFunctionParams([
    ...getDataParams(schemas.pathParams, {
      typed: true,
      override: (item) => ({ ...item, type: `MaybeRef<${item.type}>` }),
    }),
    {
      name: 'params',
      type: schemas.queryParams?.name ? `MaybeRef<${schemas.queryParams?.name}>` : undefined,
      enabled: !!schemas.queryParams?.name,
      required: !!schemas.queryParams?.schema.required?.length,
    },
  ])

  const result = [
    path.toObject({
      type: 'template',
      stringify: true,
      replacer: (pathParam) => `unref(${pathParam})`,
    }),
    withParams ? `...(params ? [params] : [])` : undefined,
  ].filter(Boolean)

  return (
    <Function.Arrow name={name} export params={params} singleLine>
      {`[${result.join(',')}] as const;`}
    </Function.Arrow>
  )
}

export const QueryKeyFunction = {
  react: QueryKeyFunctionBase,
  solid: QueryKeyFunctionBase,
  svelte: QueryKeyFunctionBase,
  vue: QueryKeyFunctionVue,
} as const
