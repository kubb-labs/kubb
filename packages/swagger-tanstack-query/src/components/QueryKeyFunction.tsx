import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function } from '@kubb/react'
import { useOperation, useSchemas } from '@kubb/swagger/hooks'
import { getASTParams } from '@kubb/swagger/utils'

import type { ReactNode } from 'react'

type Props = {
  name: string
  typeName: string
  /**
   * TODO add typings
   * Created by KubbQueryFactory, see templates/types
   */
  factoryTypeName?: string
  // generics: string[]
  // returnType: string
  // comments: string[]
  // children?: ReactNode

  // props QueryKey
}

function QueryKeyFunctionBase({ name, typeName, factoryTypeName }: Props): ReactNode {
  const schemas = useSchemas()
  const operation = useOperation()
  const path = new URLPath(operation.path)
  const params = new FunctionParams()
  const withParams = !!schemas.queryParams?.name

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
    }),
    {
      name: 'params',
      type: `${factoryTypeName}["queryParams"]`,
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
    <>
      <Function.Arrow name={name} export params={params.toString()} singleLine>
        {`[${result.join(',')}] as const;`}
      </Function.Arrow>

      {`export type ${typeName} = ReturnType<typeof ${name}>`}
    </>
  )
}

function QueryKeyFunctionVue({ name, typeName, factoryTypeName }: Props): ReactNode {
  const schemas = useSchemas()
  const operation = useOperation()
  const path = new URLPath(operation.path)
  const params = new FunctionParams()
  const withParams = !!schemas.queryParams?.name

  params.add([
    ...getASTParams(schemas.pathParams, {
      typed: true,
      override: (item) => ({ ...item, type: `MaybeRef<${item.type}>` }),
    }),
    {
      name: 'params',
      type: schemas.queryParams?.name ? `MaybeRef<${`${factoryTypeName}["queryParams"]`}>` : undefined,
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
    <>
      <Function.Arrow name={name} export params={params.toString()} singleLine>
        {`[${result.join(',')}] as const;`}
      </Function.Arrow>

      {`export type ${typeName} = ReturnType<typeof ${name}>`}
    </>
  )
}

export const QueryKeyFunction = {
  react: QueryKeyFunctionBase,
  solid: QueryKeyFunctionBase,
  svelte: QueryKeyFunctionBase,
  vue: QueryKeyFunctionVue,
} as const
