import type { SchemaNames } from '@kubb/plugin-oas/hooks'
import { Const, File } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import type { HttpMethod, Operation } from '@kubb/oas'
import type { KubbNode } from '@kubb/react/types'

type Props = {
  name: string
  operations: Array<{ operation: Operation; data: SchemaNames }>
}

export function Operations({ name, operations }: Props): KubbNode {
  const operationsJSON = operations.reduce(
    (prev, acc) => {
      prev[`"${acc.operation.getOperationId()}"`] = acc.data

      return prev
    },
    {} as Record<string, unknown>,
  )

  const pathsJSON = operations.reduce(
    (prev, acc) => {
      prev[`"${acc.operation.path}"`] = {
        ...(prev[`"${acc.operation.path}"`] || ({} as Record<HttpMethod, string>)),
        [acc.operation.method]: `operations["${acc.operation.getOperationId()}"]`,
      }

      return prev
    },
    {} as Record<string, Record<HttpMethod, string>>,
  )

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} asConst>
          {`{${transformers.stringifyObject(operationsJSON)}}`}
        </Const>
      </File.Source>
      <File.Source name={'paths'} isExportable isIndexable>
        <Const export name={'paths'} asConst>
          {`{${transformers.stringifyObject(pathsJSON)}}`}
        </Const>
      </File.Source>
    </>
  )
}
