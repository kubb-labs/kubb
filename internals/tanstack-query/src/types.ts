import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'

export type ParamsCasing = 'camelcase' | undefined
export type PathParamsType = 'object' | 'inline'
export type ParamsType = 'object' | 'inline'

type TransformerProps = {
  operation: Operation
  schemas: OperationSchemas
  casing: ParamsCasing
}

export type Transformer = (props: TransformerProps) => unknown[]
