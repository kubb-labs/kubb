import ts from 'typescript'

import type { PrinterOptions } from 'typescript'

const { factory } = ts

type Options = {
  source?: string
  baseName?: string
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

export function print(
  elements: ts.Node | Array<ts.Node | undefined> | null,
  { source = '', baseName = 'print.ts', removeComments, noEmitHelpers, newLine = ts.NewLineKind.LineFeed }: Options = {},
): string {
  const sourceFile = ts.createSourceFile(baseName, escapeNewLines(source), ts.ScriptTarget.ES2022, false, ts.ScriptKind.TS)
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
