import { buildJSDoc } from '@internals/utils'
import type { JSDoc, Key, KubbReactElement, KubbReactNode } from '../types.ts'

export type ConstProps = {
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
  /**
   * Children nodes.
   */
  children?: KubbReactNode
}

/**
 * Generates a TypeScript constant declaration.
 */
export function Const({ children, ...props }: ConstProps): KubbReactElement {
  const { name, export: canExport, type, JSDoc, asConst } = props

  return (
    <>
      {JSDoc?.comments && (
        <>
          {buildJSDoc(JSDoc?.comments)}
          <br />
        </>
      )}
      <kubb-const name={name} type={type} export={canExport} asConst={asConst}>
        {children}
      </kubb-const>
    </>
  )
}

Const.displayName = 'Const'
