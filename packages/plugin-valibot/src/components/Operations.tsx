import transformers from '@kubb/core/transformers'
import type { HttpMethod, Operation } from '@kubb/oas'
import type { SchemaNames } from '@kubb/plugin-oas/hooks'
import { Const, File, Type } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'

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
      <File.Source name="OperationSchema" isExportable isIndexable>
        <Type name="OperationSchema" export>{`{
  readonly request: v.GenericSchema | undefined;
  readonly parameters: {
        readonly path: v.GenericSchema | undefined;
        readonly query: v.GenericSchema | undefined;
        readonly header: v.GenericSchema | undefined;
  };
  readonly responses: {
        readonly [status: number]: v.GenericSchema;
        readonly default: v.GenericSchema;
  };
  readonly errors: {
        readonly [status: number]: v.GenericSchema;
  };
}`}</Type>
      </File.Source>
      <File.Source name="OperationsMap" isExportable isIndexable>
        <Type name="OperationsMap" export>
          {'Record<string, OperationSchema>'}
        </Type>
      </File.Source>
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
