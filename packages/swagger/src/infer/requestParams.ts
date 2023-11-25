/* eslint-disable @typescript-eslint/ban-types */

import type { SplitByDelimiter, TupleToUnion } from '@kubb/types'
import type { Pipe, Strings, Tuples } from 'hotscript'
import type {
  FromSchema,
  JSONSchema,
} from 'json-schema-to-ts'
import type { OASDocument } from 'oas/rmoas.types'
import type { MethodMap, ParamMap, PathMap } from './mappers.ts'

type ExtractPathParamsWithPattern<TPath extends string> = Pipe<
  TPath,
  [
    Strings.Split<'/'>,
    Tuples.Filter<Strings.StartsWith<':'>>,
    Tuples.Map<Strings.Trim<':'>>,
    Tuples.ToUnion,
  ]
>

type IsPathParameter<T extends string> = T extends `{${infer U}}` ? U : never

type ExtractPathParameters<T extends any[]> = {
  [K in keyof T]: IsPathParameter<T[K]>
}

type ExtractSegments<TPath extends string> = SplitByDelimiter<TPath, '/'>

type ExtractSubSegments<T extends any[]> = {
  [K in keyof T]: SplitByDelimiter<T[K], ';'>
}

type ExtractPathParamsWithBrackets<TPath extends string> = TupleToUnion<
  ExtractPathParameters<ExtractSubSegments<ExtractSegments<TPath>>[number]>
>

export type RequestParams<
  TOAS extends OASDocument,
  TPath extends keyof PathMap<TOAS>,
  TMethod extends keyof MethodMap<TOAS, TPath>,
> =
  & (MethodMap<TOAS, TPath>[TMethod] extends {
    requestBody: { content: { 'application/json': { schema: JSONSchema } } }
  } ? MethodMap<TOAS, TPath>[TMethod]['requestBody'] extends { required: true } ? {
        /**
         * The request body in JSON is required for this request.
         *
         * The value of `json` will be stringified and sent as the request body with `Content-Type: application/json`.
         */
        json: FromSchema<
          MethodMap<TOAS, TPath>[TMethod]['requestBody']['content']['application/json']['schema']
        >
      }
    : {
      /**
       * The request body in JSON is optional for this request.
       *
       * The value of `json` will be stringified and sent as the request body with `Content-Type: application/json`.
       */
      json?: FromSchema<
        MethodMap<TOAS, TPath>[TMethod]['requestBody']['content']['application/json']['schema']
      >
    }
    : MethodMap<TOAS, TPath>[TMethod] extends {
      requestBody: {
        content: { 'multipart/form-data': { schema: JSONSchema } }
      }
    } ? MethodMap<TOAS, TPath>[TMethod]['requestBody'] extends { required: true } ? {
          /**
           * The request body in multipart/form-data is required for this request.
           *
           * The value of `formData` will be sent as the request body with `Content-Type: multipart/form-data`.
           */
          formData: FromSchema<
            MethodMap<
              TOAS,
              TPath
            >[TMethod]['requestBody']['content']['multipart/form-data']['schema']
          >
        }
      : {
        /**
         * The request body in multipart/form-data is optional for this request.
         *
         * The value of `formData` will be sent as the request body with `Content-Type: multipart/form-data`.
         */
        formData?: FromSchema<
          MethodMap<
            TOAS,
            TPath
          >[TMethod]['requestBody']['content']['multipart/form-data']['schema']
        >
      }
    : MethodMap<TOAS, TPath>[TMethod] extends {
      requestBody: {
        content: {
          'application/x-www-form-urlencoded': { schema: JSONSchema }
        }
      }
    } ? MethodMap<TOAS, TPath>[TMethod]['requestBody'] extends { required: true } ? {
          /**
           * The request body in application/x-www-form-urlencoded is required for this request.
           *
           * The value of `formUrlEncoded` will be sent as the request body with `Content-Type: application/x-www-form-urlencoded`.
           */
          formUrlEncoded: FromSchema<
            MethodMap<
              TOAS,
              TPath
            >[TMethod]['requestBody']['content']['application/x-www-form-urlencoded']['schema']
          >
        }
      : {
        /**
         * The request body in application/x-www-form-urlencoded is optional for this request.
         *
         * The value of `formUrlEncoded` will be sent as the request body with `Content-Type: application/x-www-form-urlencoded`.
         */
        formUrlEncoded?: FromSchema<
          MethodMap<
            TOAS,
            TPath
          >[TMethod]['requestBody']['content']['application/x-www-form-urlencoded']['schema']
        >
      }
    : {})
  & (MethodMap<TOAS, TPath>[TMethod] extends {
    parameters: { name: string; in: string }[]
  } ? ParamMap<MethodMap<TOAS, TPath>[TMethod]['parameters']>
    : {})
  & // If there is any parameters defined in path but not in the parameters array, we should add them to the params
  (TPath extends `${string}{${string}}${string}` ? {
      /**
       * Parameters defined in the path are required for this request.
       *
       * The value of `params` will be used to replace the path parameters.
       *
       * For example if path is `/todos/{id}` and `params` is `{ id: '1' }`, the path will be `/todos/1`
       */
      params: Record<ExtractPathParamsWithBrackets<TPath>, string | number | bigint | boolean>
    }
    : {})
  & (TPath extends `${string}:${string}${string}` ? {
      /**
       * Parameters defined in the path are required for this request.
       *
       * The value of `params` will be used to replace the path parameters.
       *
       * For example if path is `/todos/:id` and `params` is `{ id: '1' }`, the path will be `/todos/1`.
       */
      params: Record<ExtractPathParamsWithPattern<TPath>, string | number | bigint | boolean>
    }
    : {})
