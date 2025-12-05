import { URLPath } from '@kubb/core/utils'
import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, Type } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { PluginPiniaColada, Transformer } from '../types'

type Props = {
  name: string
  typeName: string
  typeSchemas: OperationSchemas
  operation: Operation
  paramsCasing: PluginPiniaColada['resolvedOptions']['paramsCasing']
  pathParamsType: PluginPiniaColada['resolvedOptions']['pathParamsType']
  transformer: Transformer | undefined
}

type GetParamsProps = {
  pathParamsType: PluginPiniaColada['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
  paramsCasing: PluginPiniaColada['resolvedOptions']['paramsCasing']
}

function getParams({ pathParamsType, typeSchemas, paramsCasing }: GetParamsProps) {
  return FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
    },
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: true,
        }
      : undefined,
  })
}

const getTransformer: Transformer = ({ operation, schemas, casing }) => {
  const path = new URLPath(operation.path, { casing })
  const keys: string[] = [`'${path.toURLPath()}'`]

  if (schemas.pathParams?.name) {
    const pathParams = new URLPath(operation.path, { casing })
    keys.push(pathParams.toObject())
  }

  if (schemas.queryParams?.name) {
    keys.push('...(params ? [params] : [])')
  }

  return keys
}

export function QueryKey({ name, typeSchemas, paramsCasing, pathParamsType, operation, typeName, transformer = getTransformer }: Props): KubbNode {
  const params = getParams({ pathParamsType, typeSchemas, paramsCasing })
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

QueryKey.getParams = getParams
QueryKey.getTransformer = getTransformer
