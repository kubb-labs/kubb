import { URLPath } from '@kubb/core/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginSvelteQuery } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  keysFn: ((keys: unknown[]) => unknown[]) | undefined
}

type GetParamsProps = {
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({}: GetParamsProps) {
  return FunctionParams.factory({})
}

export function MutationKey({ name, typeSchemas, pathParamsType, operation, typeName, keysFn = (name) => name }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const params = getParams({ pathParamsType, typeSchemas })
  const keys = [JSON.stringify({ url: path.path })].filter(Boolean)

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

MutationKey.getParams = getParams
