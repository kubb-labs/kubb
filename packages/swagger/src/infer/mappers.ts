/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-namespace */
import type { Fn, Pipe, Tuples } from 'hotscript'
import type {
  FromSchema,
  JSONSchema,
} from 'json-schema-to-ts'
import type { OASDocument } from 'oas/types'

namespace Checks {
  export type Required = { required: true }

  export type Schemas = {
    schema: JSONSchema
  }
  export type Enum = { type: JSONSchemaTypeName; enum?: any[] }
  export type Parameters = { in: string; required?: boolean }[]
  export type SingleParameter<TParamType> = [{ in: TParamType; required?: true }]
  export type Responses = { responses: any }
}

export type PathMap<TOAS extends OASDocument> = TOAS['paths']

interface ParamPropMap {
  query: 'query'
  path: 'params'
  header: 'headers'
}

type JSONSchemaTypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'

type ParamObj<
  TParameter extends {
    name: string
  },
> = TParameter extends Checks.Required ? {
    [TName in TParameter['name']]: TParameter extends Checks.Schemas ? FromSchema<TParameter['schema']>
      : TParameter extends Checks.Enum ? FromSchema<{
          type: TParameter['type']
          enum: TParameter['enum']
        }>
      : unknown
  }
  : {
    [TName in TParameter['name']]?: TParameter extends Checks.Schemas ? FromSchema<TParameter['schema']>
      : TParameter extends Checks.Enum ? FromSchema<{
          type: TParameter['type']
          enum: TParameter['enum']
        }>
      : unknown
  }

interface ParamToRequestParam<TParameters extends Checks.Parameters> extends Fn {
  return: this['arg0'] extends { name: string; in: infer TParamType }
    // If there is any required parameter for this parameter type, make that parameter type required
    ? TParameters extends Checks.SingleParameter<TParamType> ? {
        [
          TKey in TParamType extends keyof ParamPropMap ? ParamPropMap[TParamType]
            : never
        ]: ParamObj<this['arg0']>
      }
    : {
      [
        TKey in TParamType extends keyof ParamPropMap ? ParamPropMap[TParamType]
          : never
      ]?: ParamObj<this['arg0']>
    }
    : {}
}

export type ParamMap<TParameters extends Checks.Parameters> = Pipe<
  TParameters,
  [Tuples.Map<ParamToRequestParam<TParameters>>, Tuples.ToIntersection]
>

export type MethodMap<
  TOAS extends OASDocument,
  TPath extends keyof PathMap<TOAS>,
> = PathMap<TOAS>[TPath]

export type StatusMap<
  TOAS extends OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
> = MethodMap<TOAS, TPath>[TMethod] extends Checks.Responses ? MethodMap<TOAS, TPath>[TMethod]['responses']
  : never
