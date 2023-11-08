import { transformers } from '@kubb/core/utils'

import { Text } from './Text.tsx'

import type { KubbNode } from '../types.ts'

type Props = {
  name: string
  export?: boolean
  children?: KubbNode
  JSDoc?: {
    comments: string[]
  }
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
