import { createJSDocBlockText } from '@kubb/core/transformers'
import type { JSDoc, Key, KubbNode } from '../types.ts'

import { Space } from './Text.tsx'

type Props = {
  key?: Key
  /**
   * Name of the const
   */
  name: string
  /**
   * Does this type need to be exported.
   */
  export?: boolean
  /**
   * Type to make the const being typed
   */
  type?: string
  /**
   * Options for JSdocs.
   */
  JSDoc?: JSDoc
  /**
   * Use of `const` assertions
   */
  asConst?: boolean
  children?: KubbNode
}

export function Const({ name, export: canExport, type, JSDoc, asConst, children }: Props) {
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
      <>
        const {name}
        <Space />
      </>
      {type && (
        <>
          <>{':'}</>
          <>{type}</>
          <Space />
        </>
      )}
      = {children}
      {asConst && (
        <>
          <Space />
          as const
        </>
      )}
    </>
  )
}

Const.displayName = 'KubbConst'
