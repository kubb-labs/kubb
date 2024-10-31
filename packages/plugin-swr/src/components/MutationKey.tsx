import { URLPath } from '@kubb/core/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { ReactNode } from 'react'
import type { PluginSwr, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({}: GetParamsProps) {
  return FunctionParams.factory({})
}

const getTransformer: Transformer = ({ operation }) => {
  const path = new URLPath(operation.path)

  return [JSON.stringify({ url: path.path })].filter(Boolean)
}

export function MutationKey({ name, typeSchemas, pathParamsType, operation, typeName, transformer = getTransformer }: Props): ReactNode {
  const params = getParams({ pathParamsType, typeSchemas })
  const keys = getTransformer({ operation, schemas: typeSchemas })

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

MutationKey.getParams = getParams
MutationKey.getTransformer = getTransformer
