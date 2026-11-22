import type { ast } from '@kubb/ast'
import type { KubbReactElement, KubbReactNode } from '../types.ts'
import { File } from './File.tsx'

type Props<TOutput> = {
  node: ast.SchemaNode
  printer: Pick<ast.Printer, 'drainImports'> & { print: (node: ast.SchemaNode) => TOutput | null }
  children: (output: NonNullable<TOutput>) => KubbReactNode
}

/**
 * Prints `node`, adds the printer's imports, and renders `children` with the code. Renders nothing when the printer returns nothing.
 *
 * @example
 * ```tsx
 * <Schema node={node} printer={printer}>{(code) => <Const export name="petSchema">{code}</Const>}</Schema>
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
          names={imp.names}
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
