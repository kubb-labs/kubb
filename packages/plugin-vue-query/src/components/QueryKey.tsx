import { URLPath } from '@kubb/core/utils'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginVueQuery } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  keysFn: ((keys: unknown[]) => unknown[]) | undefined
}

type GetParamsProps = {
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, {
        typed: true,
        override(item) {
          return {
            ...item,
            type: `MaybeRef<${item.type}>`,
          }
        },
      }),
    },
    data: typeSchemas.request?.name
      ? {
          type: `MaybeRef<${typeSchemas.request?.name}>`,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `MaybeRef<${typeSchemas.queryParams?.name}>`,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
  })
}

export function QueryKey({ name, typeSchemas, pathParamsType, operation, typeName, keysFn = (name) => name }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const params = getParams({ pathParamsType, typeSchemas })
  const keys = [
    path.toObject({
      type: 'path',
      stringify: true,
    }),
    typeSchemas.queryParams?.name ? '...(params ? [params] : [])' : undefined,
    typeSchemas.request?.name ? '...(data ? [data] : [])' : undefined,
  ].filter(Boolean)

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={params.toConstructor()} singleLine>
          {`[${keysFn(keys).join(', ')}] as const`}
        </Function.Arrow>
      </File.Source>
      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type name={typeName} export>
          {`ReturnType<typeof ${name}>`}
        </Type>
      </File.Source>
    </>
  )
}

QueryKey.getParams = getParams
