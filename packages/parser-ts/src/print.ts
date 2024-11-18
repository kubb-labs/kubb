import ts, { LanguageVariant } from 'typescript'

import type { PrinterOptions } from 'typescript'

const { factory } = ts

export type PrintOptions = {
  source?: string
  baseName?: string
  scriptKind?: ts.ScriptKind
} & PrinterOptions

/**
 * Escaped new lines in code with block comments so they can be restored by {@link restoreNewLines}
 * @param {string} code The code to escape new lines in
 * @returns The same code but with new lines escaped using block comments
 */
const escapeNewLines = (code: string) => code.replace(/\n\n/g, '\n/* :newline: */')

/**
 * Reverses {@link escapeNewLines} and restores new lines
 * @param {string} code The code with escaped new lines
 * @returns The same code with new lines restored
 */
const restoreNewLines = (code: string) => code.replace(/\/\* :newline: \*\//g, '\n')

/**
 * Convert AST TypeScript nodes to a string based on the TypeScript printer.
 */
export function print(
  elements: Array<ts.Node>,
  { source = '', baseName = 'print.ts', removeComments, noEmitHelpers, newLine = ts.NewLineKind.LineFeed, scriptKind = ts.ScriptKind.TS }: PrintOptions = {},
): string {
  const sourceFile = ts.createSourceFile(baseName, escapeNewLines(source), ts.ScriptTarget.ES2022, false, scriptKind)
  const printer = ts.createPrinter({
    omitTrailingSemicolon: true,
    newLine,
    removeComments,
    noEmitHelpers,
  })

  let nodes: Array<ts.Node> = []

  if (!elements) {
    return ''
  }

  if (Array.isArray(elements)) {
    nodes = elements.filter(Boolean)
  } else {
    nodes = [elements].filter(Boolean)
  }

  const outputFile = printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(nodes), sourceFile)
  const outputSource = printer.printFile(sourceFile)

  return [outputFile, restoreNewLines(outputSource)].filter(Boolean).join('\n')
}
