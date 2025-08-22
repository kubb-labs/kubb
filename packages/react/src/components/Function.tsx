import { createJSDocBlockText } from '@kubb/core/transformers'
import type { JSDoc, Key, KubbNode } from '../types.ts'
import { indentReactChildren } from '../utils/indentReactChildren.ts'
import { Space } from './Text.tsx'

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
        <>
          export
          <Space />
        </>
      )}
      {isDefault && (
        <>
          default
          <Space />
        </>
      )}
      {async && (
        <>
          async
          <Space />
        </>
      )}
      <>function {name}</>
      {generics && (
        <>
          {'<'}
          {Array.isArray(generics) ? generics.join(', ').trim() : generics}
          {'>'}
        </>
      )}
      ({params}){returnType && !async && <>: {returnType}</>}
      {returnType && async && (
        <>
          : Promise{'<'}
          {returnType}
          {'>'}
        </>
      )}
      {' {'}
      <br />
      {indentReactChildren({ size: 2, children: children })}
      <br />
      {'}'}
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
        <>
          export
          <Space />
        </>
      )}
      {isDefault && (
        <>
          default
          <Space />
        </>
      )}
      <>
        const {name} =<Space />
      </>
      {async && (
        <>
          async
          <Space />
        </>
      )}
      {generics && (
        <>
          {'<'}
          {Array.isArray(generics) ? generics.join(', ').trim() : generics}
          {'>'}
        </>
      )}
      <>({params})</>
      {returnType && !async && <>: {returnType}</>}
      {returnType && async && (
        <>
          : Promise{'<'}
          {returnType}
          {'>'}
        </>
      )}
      {singleLine && (
        <>
          <>{' => '}</>
          {indentReactChildren({ size: 2, children: children })}
          <br />
        </>
      )}

      {!singleLine && (
        <>
          <>{' => {'}</>
          <br />
          {indentReactChildren({ size: 2, children: children })}
          <br />
          <>{'}'}</>
          <br />
        </>
      )}
    </>
  )
}

ArrowFunction.displayName = 'KubbArrowFunction'
Function.Arrow = ArrowFunction
