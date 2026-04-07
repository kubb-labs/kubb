import { buildJSDoc } from '@internals/utils'
import type { JSDoc, Key, KubbReactElement, KubbReactNode } from '../types.ts'

export type TypeProps = {
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
  /**
   * Children nodes.
   */
  children?: KubbReactNode
}

/**
 * Generates a TypeScript type declaration.
 */
export function Type({ children, ...props }: TypeProps): KubbReactElement {
  const { name, export: canExport, JSDoc } = props

  if (name.charAt(0).toUpperCase() !== name.charAt(0)) {
    throw new Error('Name should start with a capital letter(see TypeScript types)')
  }

  return (
    <>
      {JSDoc?.comments && (
        <>
          {buildJSDoc(JSDoc?.comments)}
          <br />
        </>
      )}
      <kubb-type name={name} export={canExport}>
        {children}
      </kubb-type>
    </>
  )
}

Type.displayName = 'Type'
