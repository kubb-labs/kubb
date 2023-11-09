import { transformers } from '@kubb/core/utils'

import { Text } from './Text.tsx'

import type { KubbNode } from '../types.ts'

type Props = {
  /**
   * Name of the type, this needs to start with a capital letter.
   */
  name: string
  /**
   * Does this type need to be exported
   */
  export?: boolean
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[]
  }
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
          <Text>{transformers.JSDoc.createJSDocBlockText({ comments: JSDoc.comments })}</Text>
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
    </>
  )
}
