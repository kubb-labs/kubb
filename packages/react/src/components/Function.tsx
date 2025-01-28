import { createJSDocBlockText } from '@kubb/core/transformers'

import { Text } from './Text.tsx'

import type { JSDoc, Key, KubbNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Name of the function.
   */
  name: string
  /**
   * Add default when export is being used
   */
  default?: boolean
  /**
   * Parameters/options/props that need to be used.
   */
  params?: string
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

export function Function({ name, default: isDefault, export: canExport, async, generics, params, returnType, JSDoc, children }: Props) {
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
      {isDefault && (
        <Text>
          default
          <Text.Space />
        </Text>
      )}
      {async && (
        <Text>
          async
          <Text.Space />
        </Text>
      )}
      <Text>function {name}</Text>
      {generics && (
        <>
          <Text>{'<'}</Text>
          <Text>{Array.isArray(generics) ? generics.join(', ').trim() : generics}</Text>
          <Text>{'>'}</Text>
        </>
      )}
      <Text>({params})</Text>
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
      <Text indentSize={2}>{children}</Text>
      <br />
      <Text>{'}'}</Text>
    </>
  )
}

Function.displayName = 'KubbFunction'

type ArrowFunctionProps = Props & {
  /**
   * Create Arrow function in one line
   */
  singleLine?: boolean
}

function ArrowFunction({ name, default: isDefault, export: canExport, async, generics, params, returnType, JSDoc, singleLine, children }: ArrowFunctionProps) {
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
      {isDefault && (
        <Text>
          default
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
      <Text>({params})</Text>
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
          <Text indentSize={2}>{children}</Text>
          <br />
        </>
      )}

      {!singleLine && (
        <>
          <Text>{' => {'}</Text>
          <br />
          <Text indentSize={2}>{children}</Text>
          <br />
          <Text>{'}'}</Text>
          <br />
        </>
      )}
    </>
  )
}

ArrowFunction.displayName = 'KubbArrowFunction'
Function.Arrow = ArrowFunction
