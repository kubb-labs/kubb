import type { FromSchema } from 'json-schema-to-ts'
import type { OasTypes } from '../types.ts'
import type { MethodMap, PathMap, StatusMap } from './mappers.ts'

type Checks = {
  Content: { content: any }
}

type ResponseSchemas<
  TOAS extends OasTypes.OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
  TStatus extends keyof StatusMap<TOAS, TPath, TMethod>,
> = StatusMap<TOAS, TPath, TMethod>[TStatus]['content']

type JSONResponseSchema<
  TOAS extends OasTypes.OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
  TStatus extends keyof StatusMap<TOAS, TPath, TMethod>,
> = StatusMap<TOAS, TPath, TMethod>[TStatus] extends Checks['Content']
  ? ResponseSchemas<TOAS, TPath, TMethod, TStatus>[keyof ResponseSchemas<TOAS, TPath, TMethod, TStatus>]['schema']
  : StatusMap<TOAS, TPath, TMethod>[TStatus]['schema']

export type Response<
  TOAS extends OasTypes.OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
  TStatusCode extends keyof StatusMap<TOAS, TPath, TMethod> = 200,
> = FromSchema<JSONResponseSchema<TOAS, TPath, TMethod, TStatusCode>>
