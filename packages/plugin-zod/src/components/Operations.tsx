import { stringifyObject } from '@internals/utils'
import type { OperationNode } from '@kubb/ast/types'
import { Const, File, Type } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type SchemaNames = {
  request: string | undefined
  parameters: {
    path: string | undefined
    query: string | undefined
    header: string | undefined
  }
  responses: { default?: string } & Record<number | string, string>
  errors: Record<number | string, string>
}

type Props = {
  name: string
  operations: Array<{ node: OperationNode; data: SchemaNames }>
}

export function Operations({ name, operations }: Props): FabricReactNode {
  const operationsJSON = operations.reduce(
    (prev, acc) => {
      prev[`"${acc.node.operationId}"`] = acc.data

      return prev
    },
    {} as Record<string, unknown>,
  )

  const pathsJSON = operations.reduce(
    (prev, acc) => {
      prev[`"${acc.node.path}"`] = {
        ...(prev[`"${acc.node.path}"`] || ({} as Record<string, string>)),
        [acc.node.method]: `operations["${acc.node.operationId}"]`,
      }

      return prev
    },
    {} as Record<string, Record<string, string>>,
  )

  return (
    <>
      <File.Source name="OperationSchema" isExportable isIndexable>
        <Type name="OperationSchema" export>{`{
  readonly request: z.ZodTypeAny | undefined;
  readonly parameters: {
        readonly path: z.ZodTypeAny | undefined;
        readonly query: z.ZodTypeAny | undefined;
        readonly header: z.ZodTypeAny | undefined;
  };
  readonly responses: {
        readonly [status: number]: z.ZodTypeAny;
        readonly default: z.ZodTypeAny;
  };
  readonly errors: {
        readonly [status: number]: z.ZodTypeAny;
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
          {`{${stringifyObject(operationsJSON)}}`}
        </Const>
      </File.Source>
      <File.Source name={'paths'} isExportable isIndexable>
        <Const export name={'paths'} asConst>
          {`{${stringifyObject(pathsJSON)}}`}
        </Const>
      </File.Source>
    </>
  )
}
