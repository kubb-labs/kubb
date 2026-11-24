import { ast } from '@kubb/ast'
import type { KubbReactElement, KubbReactNode } from '../types.ts'
import { File } from './File.tsx'

export type SchemaProps<TOutput> = {
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
export function Schema<TOutput>({ node, printer, children }: SchemaProps<TOutput>): KubbReactElement | null {
  const output = printer.print(node)
  const imports = printer.drainImports()

  if (!output) return null

  return (
    <>
      {imports.map((imp) => {
        // `createImport` applies a deprecated `name` or `isTypeOnly` a printer set over `names`.
        const names = ast.file.getNames(ast.factory.createImport(imp))
        return <File.Import key={[imp.path, ...names.map((item) => item.alias ?? item.name)].join('-')} names={names} path={imp.path} root={imp.root} />
      })}
      {children(output)}
    </>
  )
}
