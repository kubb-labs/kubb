import { createJSDocBlockText } from '@kubb/core/transformers'
import type { JSDoc, Key, KubbNode } from '../types.ts'
import { Space } from './Text.tsx'

type Props = {
  key?: Key
  /**
   * Name of the type, this needs to start with a capital letter.
   */
  name: string
  /**
   * Does this type need to be exported.
   */
  export?: boolean
  /**
   * Options for JSdocs.
   */
  JSDoc?: JSDoc
  children?: KubbNode
}

export function Type({ name, export: canExport, JSDoc, children }: Props) {
  if (name.charAt(0).toUpperCase() !== name.charAt(0)) {
    throw new Error('Name should start with a capital letter(see TypeScript types)')
  }

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
      type {name} = {children}
    </>
  )
}

Type.displayName = 'KubbType'
