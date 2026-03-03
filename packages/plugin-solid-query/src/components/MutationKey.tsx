import { URLPath } from '@kubb/core/utils'
import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginSolidQuery, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginSolidQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginSolidQuery['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  paramsCasing: PluginSolidQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginSolidQuery['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, paramsCasing, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
        }
      : undefined,
  })
}

const getTransformer: Transformer = ({ operation, schemas, casing }) => {
  const path = new URLPath(operation.path, { casing })

  return [path.toObject({ type: 'path', stringify: true }) as string]
}

export function MutationKey({ name, typeSchemas, pathParamsType, paramsCasing, operation, typeName, transformer = getTransformer }: Props): FabricReactNode {
  const params = getParams({ paramsCasing, pathParamsType, typeSchemas })
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
