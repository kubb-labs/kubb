import { URLPath } from '@kubb/core/utils'
import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { File, Function, FunctionParams, Type } from '@kubb/react'
import type { ReactNode } from 'react'
import type { PluginSvelteQuery, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginSvelteQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({}: GetParamsProps) {
  return FunctionParams.factory({})
}

const getTransformer: Transformer = ({ operation, casing }) => {
  const path = new URLPath(operation.path, { casing })

  return [JSON.stringify({ url: path.toURLPath() })].filter(Boolean)
}

export function MutationKey({ name, typeSchemas, paramsCasing, pathParamsType, operation, typeName, transformer = getTransformer }: Props): ReactNode {
  const params = getParams({ pathParamsType, typeSchemas })
  const keys = transformer({ operation, schemas: typeSchemas, casing: paramsCasing })

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
