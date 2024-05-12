import { createJSDocBlockText } from '@kubb/core/transformers'

import { useIndent } from '../hooks/useIndent.ts'

import type { JSDoc, KubbNode } from '../types.ts'

type Props = {
  /**
   * Change the indent.
   * @default 0
   */
  indentSize?: number
  children?: KubbNode
}

export function Text({ indentSize = 0, children }: Props): KubbNode {
  const indentBefore = useIndent({ size: indentSize })
  const indentChildren = useIndent({ size: 4, children })

  return (
    <kubb-text>
      {indentBefore}
      {indentChildren ? indentChildren : children}
    </kubb-text>
  )
}

type ConstProps = Props & {
  /**
   * Name of the const.
   */
  name: string
  /**
   * Does this const need to be exported.
   */
  export?: boolean
  /**
   * Options for JSdocs.
   */
  JSDoc?: JSDoc
}

/**
 * @deprecated
 */
export function Const({ name, export: canExport, JSDoc, children }: ConstProps): KubbNode {
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

      <Text>{children}</Text>
    </>
  )
}

type SpaceProps = {
  /**
   * Change the indent
   * @default 1
   */
  size?: number
}

function Space({ size = 1 }: SpaceProps): KubbNode {
  const indentBefore = useIndent({ size })

  return <kubb-text>{indentBefore}</kubb-text>
}

Text.Space = Space
/**
 * @deprecated
 */
Text.Const = Const
