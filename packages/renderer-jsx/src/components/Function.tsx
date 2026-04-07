import { buildJSDoc } from '@internals/utils'
import type { JSDoc, Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Name of the function.
   */
  name: string
  /**
   * Add default when export is being used
   */
  default?: boolean
  /**
   * Parameters/options/props that need to be used.
   */
  params?: string
  /**
   * Does this function need to be exported.
   */
  export?: boolean
  /**
   * Does the function has async/promise behavior.
   * This will also add `Promise<returnType>` as the returnType.
   */
  async?: boolean
  /**
   * Generics that needs to be added for TypeScript.
   */
  generics?: string | string[]
  /**
   * ReturnType(see async for adding Promise type).
   */
  returnType?: string
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
 * Generates a TypeScript function declaration.
 */
export function Function({ children, ...props }: Props): KubbReactElement {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc } = props

  // Normalize generics array to comma-separated string for DOM attribute storage
  const genericsString = Array.isArray(generics) ? generics.join(', ').trim() : generics

  return (
    <kubb-function
      name={name}
      params={params}
      export={canExport}
      default={isDefault}
      async={isAsync}
      generics={genericsString}
      returnType={returnType}
      JSDoc={JSDoc}
    >
      {children}
    </kubb-function>
  )
}

Function.displayName = 'Function'

type ArrowFunctionProps = Props & {
  /**
   * Create Arrow function in one line
   */
  singleLine?: boolean
}

/**
 * ArrowFunction
 *
 * Renders an arrow function definition. Supports the same flags as `Function`.
 * Use `singleLine` to render the body as a single-line expression.
 */
function ArrowFunction({ children, ...props }: ArrowFunctionProps) {
  const { name, default: isDefault, export: canExport, async, generics, params, returnType, JSDoc, singleLine } = props

  return (
    <>
      {JSDoc?.comments && (
        <>
          {buildJSDoc(JSDoc?.comments)}
          <br />
        </>
      )}
      {canExport && <>export </>}
      {isDefault && <>default </>}
      const {name} = {async && <>async </>}
      {generics && (
        <>
          {'<'}
          {Array.isArray(generics) ? generics.join(', ').trim() : generics}
          {'>'}
        </>
      )}
      ({params}){returnType && !async && <>: {returnType}</>}
      {returnType && async && (
        <>
          : Promise{'<'}
          {returnType}
          {'>'}
        </>
      )}
      {singleLine && (
        <>
          {' => '}
          {children}
          <br />
        </>
      )}
      {!singleLine && (
        <>
          {' => {'}
          <br />
          <indent />
          {/* Indent component to handle indentation*/}
          {children}
          <br />
          <dedent />
          {/* Indent component to handle indentation*/}
          {'}'}
          <br />
        </>
      )}
    </>
  )
}

ArrowFunction.displayName = 'ArrowFunction'
Function.Arrow = ArrowFunction
