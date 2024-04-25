import type { Fn, Pipe, Tuples } from 'hotscript'
import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import type { OasTypes } from '../types.ts'

type Checks<TParamType = never> = {
  Required: { required: true }

  Schemas: {
    schema: JSONSchema
  }
  Enum: { type: JSONSchemaTypeName; enum?: any[] }
  Parameters: { in: string; required?: boolean }[]
  SingleParameter: [{ in: TParamType; required?: true }]
  Responses: { responses: any }
}

export type PathMap<TOAS extends OasTypes.OASDocument> = TOAS['paths']

interface ParamPropMap {
  query: 'query'
  path: 'params'
  header: 'headers'
}

type JSONSchemaTypeName = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'

type ParamObj<
  TParameter extends {
    name: string
  },
> = TParameter extends Checks['Required']
  ? {
      [TName in TParameter['name']]: TParameter extends Checks['Schemas']
        ? FromSchema<TParameter['schema']>
        : TParameter extends Checks['Enum']
          ? FromSchema<{
              type: TParameter['type']
              enum: TParameter['enum']
            }>
          : unknown
    }
  : {
      [TName in TParameter['name']]?: TParameter extends Checks['Schemas']
        ? FromSchema<TParameter['schema']>
        : TParameter extends Checks['Enum']
          ? FromSchema<{
              type: TParameter['type']
              enum: TParameter['enum']
            }>
          : unknown
    }

interface ParamToRequestParam<TParameters extends Checks['Parameters']> extends Fn {
  return: this['arg0'] extends { name: string; in: infer TParamType }
    ? // If there is any required parameter for this parameter type, make that parameter type required
      TParameters extends Checks<TParamType>['SingleParameter']
      ? {
          [TKey in TParamType extends keyof ParamPropMap ? ParamPropMap[TParamType] : never]: ParamObj<this['arg0']>
        }
      : {
          [TKey in TParamType extends keyof ParamPropMap ? ParamPropMap[TParamType] : never]?: ParamObj<this['arg0']>
        }
    : {}
}

export type ParamMap<TParameters extends Checks['Parameters']> = Pipe<TParameters, [Tuples.Map<ParamToRequestParam<TParameters>>, Tuples.ToIntersection]>

export type MethodMap<TOAS extends OasTypes.OASDocument, TPath extends keyof PathMap<TOAS>> = PathMap<TOAS>[TPath]

export type StatusMap<TOAS extends OasTypes.OASDocument, TPath extends keyof PathMap<TOAS>, TMethod extends keyof MethodMap<TOAS, TPath>> = MethodMap<
  TOAS,
  TPath
>[TMethod] extends Checks['Responses']
  ? MethodMap<TOAS, TPath>[TMethod]['responses']
  : never
