import { createJSDocBlockText } from '@kubb/core/transformers'

import { Text } from './Text.tsx'

import type { JSDoc, KubbNode } from '../types.ts'

type Props = {
  /**
   * Name of the const
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
  /**
   * Use of `const` assertions
   */
  asConst?: boolean
  children?: KubbNode
}

export function Const({ name, export: canExport, JSDoc, asConst, children }: Props): KubbNode {
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
        const {name} =
        <Text.Space />
      </Text>
      <Text>{children}</Text>
      {asConst && (
        <Text>
          <Text.Space />
          as const
        </Text>
      )}
      <br />
    </>
  )
}
