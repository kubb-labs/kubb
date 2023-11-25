/* eslint-disable @typescript-eslint/ban-types */
import type { Fn, Pipe, Tuples } from 'hotscript'
import type {
  FromSchema,
  JSONSchema,
} from 'json-schema-to-ts'
import type { OASDocument } from 'oas/rmoas.types'
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
> = TParameter extends { required: true } ? {
    [TName in TParameter['name']]: TParameter extends {
      schema: JSONSchema
    } ? FromSchema<TParameter['schema']>
      : TParameter extends { type: JSONSchemaTypeName; enum?: any[] } ? FromSchema<{
          type: TParameter['type']
          enum: TParameter['enum']
        }>
      : unknown
  }
  : {
    [TName in TParameter['name']]?: TParameter extends {
      schema: JSONSchema
    } ? FromSchema<TParameter['schema']>
      : TParameter extends { type: JSONSchemaTypeName; enum?: any[] } ? FromSchema<{
          type: TParameter['type']
          enum: TParameter['enum']
        }>
      : unknown
  }

interface ParamToRequestParam<TParameters extends { in: string; required?: boolean }[]> extends Fn {
  return: this['arg0'] extends { name: string; in: infer TParamType }
    // If there is any required parameter for this parameter type, make that parameter type required
    ? TParameters extends [{ in: TParamType; required?: true }] ? {
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

export type ParamMap<TParameters extends { name: string; in: string }[]> = Pipe<
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
> = MethodMap<TOAS, TPath>[TMethod] extends { responses: any } ? MethodMap<TOAS, TPath>[TMethod]['responses']
  : never
