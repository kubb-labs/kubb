import { createJSDocBlockText } from '@kubb/core/transformers'

import { getParams, isParamItems } from '../shared/utils/getParams.ts'
import { Text } from './Text.tsx'

import type { Params } from '../shared/utils/getParams.ts'
import type { JSDoc, KubbNode } from '../types.ts'

type Props = {
  /**
   * Name of the function.
   */
  name: string
  /**
   * Parameters/options/props that need to be used.
   */
  params?: string | Params
  /**
   * Does this function need to be exported.
   */
  export?: boolean
  /**
   * Does the function has async/promise behaviour.
   * This will also add `Promise<returnType>` as the returnType.
   */
  async?: boolean
  /**
   * Generics that needs to be added for TypeScript.
   */
  generics?: string | string[]

  /**
   * ReturnType(see async for adding Promise type).
   */
  returnType?: string
  /**
   * Options for JSdocs.
   */
  JSDoc?: JSDoc
  children?: KubbNode
}

export function Function({ name, export: canExport, async, generics, params, returnType, JSDoc, children }: Props): KubbNode {
  return (
    <>
      {JSDoc?.comments && (
        <>
          {createJSDocBlockText({ comments: JSDoc?.comments })}
          <br />
        </>
      )}
      {canExport && (
        <Text>
          export
          <Text.Space />
        </Text>
      )}
      {async && (
        <Text>
          async
          <Text.Space />
        </Text>
      )}
      <Text>
        function {name}
        <Text.Space />
      </Text>
      {generics && (
        <>
          <Text>{'<'}</Text>
          <Text>{Array.isArray(generics) ? generics.join(', ').trim() : generics}</Text>
          <Text>{'>'}</Text>
        </>
      )}
      {isParamItems(params) ? <Text>({getParams(params)})</Text> : <Text>({params})</Text>}
      {returnType && !async && <Text>: {returnType}</Text>}
      {returnType && async && (
        <Text>
          : Promise{'<'}
          {returnType}
          {'>'}
        </Text>
      )}
      <Text>{' {'}</Text>
      <br />
      <Text indentSize={4}>{children}</Text>
      <br />
      <Text>{'}'}</Text>
      <br />
    </>
  )
}

type ArrowFunctionProps = Props & {
  /**
   * Create Arrow function in one line
   */
  singleLine?: boolean
}

export function ArrowFunction({ name, export: canExport, async, generics, params, returnType, JSDoc, singleLine, children }: ArrowFunctionProps): KubbNode {
  return (
    <>
      {JSDoc?.comments && (
        <>
          {createJSDocBlockText({ comments: JSDoc?.comments })}
          <br />
        </>
      )}
      {canExport && (
        <Text>
          export
          <Text.Space />
        </Text>
      )}
      <Text>
        const {name} =<Text.Space />
      </Text>
      {async && (
        <Text>
          async
          <Text.Space />
        </Text>
      )}
      {generics && (
        <>
          <Text>{'<'}</Text>
          <Text>{Array.isArray(generics) ? generics.join(', ').trim() : generics}</Text>
          <Text>{'>'}</Text>
        </>
      )}
      {isParamItems(params) ? <Text>({getParams(params)})</Text> : <Text>({params})</Text>}
      {returnType && !async && <Text>: {returnType}</Text>}
      {returnType && async && (
        <Text>
          : Promise{'<'}
          {returnType}
          {'>'}
        </Text>
      )}
      {singleLine && (
        <>
          <Text>{' => '}</Text>
          <Text indentSize={4}>{children}</Text>
          <br />
        </>
      )}

      {!singleLine && (
        <>
          <Text>{' => {'}</Text>
          <br />
          <Text indentSize={4}>{children}</Text>
          <br />
          <Text>{'}'}</Text>
          <br />
        </>
      )}
    </>
  )
}

type CallFunctionProps = {
  /**
   * Name of the caller.
   */
  name: string
  /**
   * Name of the function.
   */
  fnName: string
  /**
   * Parameters/options/props that need to be used.
   */
  params?: string | Params
  /**
   * Does the function has async/promise behaviour.
   */
  async?: boolean
  /**
   * Generics that needs to be added for TypeScript.
   */
  generics?: string | string[]
}

export function CallFunction({ name, fnName, async, params, generics }: CallFunctionProps) {
  return (
    <>
      const <Text>{name}</Text>
      <Text> = </Text>
      {async && (
        <Text>
          await
          <Text.Space />
        </Text>
      )}
      {fnName}
      {generics && (
        <>
          <Text>{'<'}</Text>
          <Text>{Array.isArray(generics) ? generics.join(', ').trim() : generics}</Text>
          <Text>{'>'}</Text>
        </>
      )}
      {isParamItems(params) ? <Text>({getParams(params)})</Text> : <Text>({params})</Text>}
      <br />
    </>
  )
}

Function.Arrow = ArrowFunction
Function.Call = CallFunction

export const Fun = Function
