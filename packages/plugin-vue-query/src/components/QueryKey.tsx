import { URLPath } from '@kubb/core/utils'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginVueQuery, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, paramsCasing, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, {
        typed: true,
        casing: paramsCasing,
        override(item) {
          return {
            ...item,
            type: `MaybeRefOrGetter<${item.type}>`,
          }
        },
      }),
    },
    data: typeSchemas.request?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.request?.name}>`,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: `MaybeRefOrGetter<${typeSchemas.queryParams?.name}>`,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
  })
}

const getTransformer: Transformer = ({ operation, schemas, casing }) => {
  const path = new URLPath(operation.path, { casing })
  const keys = [
    path.toObject({
      type: 'path',
      stringify: true,
    }),
    schemas.queryParams?.name ? '...(params ? [params] : [])' : undefined,
    schemas.request?.name ? '...(data ? [data] : [])' : undefined,
  ].filter(Boolean)

  return keys
}

export function QueryKey({ name, typeSchemas, paramsCasing, pathParamsType, operation, typeName, transformer = getTransformer }: Props): ReactNode {
  const params = getParams({ pathParamsType, typeSchemas, paramsCasing })
  const keys = transformer({
    operation,
    schemas: typeSchemas,
    casing: paramsCasing,
  })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={params.toConstructor()} singleLine>
          {`[${keys.join(', ')}] as const`}
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
QueryKey.getTransformer = getTransformer
