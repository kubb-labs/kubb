import type { ast } from '@kubb/ast'
import type { KubbReactElement, KubbReactNode } from '../types.ts'
import { File } from './File.tsx'

type Props<TOutput> = {
  /**
   * Schema node to print.
   */
  node: ast.SchemaNode
  /**
   * Printer that turns `node` into code. Its collected imports are added to the enclosing file.
   */
  printer: Pick<ast.Printer, 'drainImports'> & { print: (node: ast.SchemaNode) => TOutput | null }
  /**
   * Renders the declarations for the printed code. Not called when the printer returns nothing.
   */
  children: (output: NonNullable<TOutput>) => KubbReactNode
}

/**
 * Prints a schema node, adds the imports the printer collected, and renders `children` with the code.
 * Renders nothing, imports included, when the printer returns no output.
 *
 * @example
 * ```tsx
 * <File baseName="pet.ts" path="src/zod/pet.ts">
 *   <Schema node={node} printer={printer}>
 *     {(code) => <Const export name="petSchema">{code}</Const>}
 *   </Schema>
 * </File>
 * ```
 */
export function Schema<TOutput>({ node, printer, children }: Props<TOutput>): KubbReactElement | null {
  const output = printer.print(node)
  const imports = printer.drainImports()

  if (!output) return null

  return (
    <>
      {imports.map((imp) => (
        <File.Import
          key={[imp.path, imp.name].join('-')}
          name={imp.name}
          path={imp.path}
          root={imp.root}
          isTypeOnly={imp.isTypeOnly}
          isNameSpace={imp.isNameSpace}
        />
      ))}
      {children(output)}
    </>
  )
}
