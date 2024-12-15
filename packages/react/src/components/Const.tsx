import { createJSDocBlockText } from '@kubb/core/transformers'

import { Text } from './Text.tsx'

import type { JSDoc, Key, KubbNode } from '../types.ts'

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
        <Text>
          export
          <Text.Space />
        </Text>
      )}
      <Text>
        const {name}
        <Text.Space />
      </Text>
      {type && (
        <>
          <Text>{':'}</Text>
          <Text>{type}</Text>
          <Text.Space />
        </>
      )}
      <Text>
        =
        <Text.Space />
      </Text>
      <Text>{children}</Text>
      {asConst && (
        <Text>
          <Text.Space />
          as const
        </Text>
      )}
    </>
  )
}

Const.displayName = 'KubbConst'
