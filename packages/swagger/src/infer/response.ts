import type {
  FromSchema,
} from 'json-schema-to-ts'
import type { OASDocument } from 'oas/rmoas.types'
import type { MethodMap, PathMap, StatusMap } from './mappers.ts'

type ResponseSchemas<
  TOAS extends OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
  TStatus extends keyof StatusMap<TOAS, TPath, TMethod>,
> = StatusMap<TOAS, TPath, TMethod>[TStatus]['content']

type JSONResponseSchema<
  TOAS extends OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
  TStatus extends keyof StatusMap<TOAS, TPath, TMethod>,
> = StatusMap<TOAS, TPath, TMethod>[TStatus] extends { content: any } ? ResponseSchemas<TOAS, TPath, TMethod, TStatus>[
    keyof ResponseSchemas<
      TOAS,
      TPath,
      TMethod,
      TStatus
    >
  ]['schema']
  : StatusMap<TOAS, TPath, TMethod>[TStatus]['schema']

export type Response<
  TOAS extends OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
  TStatusCode extends keyof StatusMap<TOAS, TPath, TMethod> = 200,
> = FromSchema<JSONResponseSchema<TOAS, TPath, TMethod, TStatusCode>>
