import { createJSDocBlockText } from '@kubb/core/transformers'

import { Text } from './Text.tsx'

import type { JSDoc, KubbNode } from '../types.ts'

type Props = {
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

export function Type({ name, export: canExport, JSDoc, children }: Props): KubbNode {
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
        <Text>
          export
          <Text.Space />
        </Text>
      )}
      <Text>
        type {name} =
        <Text.Space />
      </Text>
      <Text>{children}</Text>
      <br />
    </>
  )
}
