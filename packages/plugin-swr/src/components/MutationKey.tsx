import { URLPath } from '@internals/utils'
import { createFunctionParameters } from '@kubb/ast'
import type { FunctionParametersNode, OperationNode } from '@kubb/ast/types'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Transformer } from '../types.ts'

type Props = {
  name: string
  typeName: string
  node: OperationNode
  paramsCasing: 'camelcase' | undefined
  pathParamsType: 'object' | 'inline'
  transformer: Transformer | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function getParams(): FunctionParametersNode {
  return createFunctionParameters({ params: [] })
}

const getTransformer: Transformer = ({ node, casing }) => {
  const path = new URLPath(node.path, { casing })
  return [`{ url: '${path.toURLPath()}' }`]
}

export function MutationKey({ name, pathParamsType, paramsCasing, node, typeName, transformer = getTransformer }: Props): KubbReactNode {
  const paramsNode = getParams()
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = transformer({ node, casing: paramsCasing })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={paramsSignature} singleLine>
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
