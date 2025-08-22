import ts from 'typescript'

const { factory } = ts

export type PrintOptions = {
  source?: string
  baseName?: string
  scriptKind?: ts.ScriptKind
}

/**
 * Escaped new lines in code with block comments so they can be restored by {@link restoreNewLines}
 */
const escapeNewLines = (code: string) => code.replace(/\n\n/g, '\n/* :newline: */')

/**
 * Reverses {@link escapeNewLines} and restores new lines
 */
const restoreNewLines = (code: string) => code.replace(/\/\* :newline: \*\//g, '\n')

/**
 * Convert AST TypeScript/TSX nodes to a string based on the TypeScript printer.
 * Ensures consistent output across environments.
 * Also works as a formatter when `source` is provided without `elements`.
 */
export function print(elements: Array<ts.Node> = [], { source = '', baseName = 'print.tsx', scriptKind = ts.ScriptKind.TSX }: PrintOptions = {}): string {
  const sourceFile = ts.createSourceFile(baseName, escapeNewLines(source), ts.ScriptTarget.ES2022, true, scriptKind)

  const printer = ts.createPrinter({
    omitTrailingSemicolon: true,
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    noEmitHelpers: true,
  })

  let output: string

  if (elements.length > 0) {
    // Print only provided nodes
    const nodes = elements.filter(Boolean).sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
    output = printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(nodes), sourceFile)
  } else {
    // Format the whole file
    output = printer.printFile(sourceFile)
  }

  return restoreNewLines(output).replace(/\r\n/g, '\n')
}
