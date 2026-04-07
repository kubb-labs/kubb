import { URLPath } from '@internals/utils'
import { FunctionParams } from '@kubb/core'
import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { ParamsCasing, PathParamsType, Transformer } from '../types.ts'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: ParamsCasing
  pathParamsType: PathParamsType
  transformer: Transformer | undefined
}

type GetParamsProps = {
  pathParamsType: PathParamsType
  typeSchemas: OperationSchemas
}

function getParams({}: GetParamsProps) {
  return FunctionParams.factory({})
}

const getTransformer: Transformer = ({ operation, casing }) => {
  const path = new URLPath(operation.path, { casing })

  return [`{ url: '${path.toURLPath()}' }`]
}

export function MutationKey({ name, typeSchemas, pathParamsType, paramsCasing, operation, typeName, transformer = getTransformer }: Props): KubbReactNode {
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
