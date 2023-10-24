import ts from 'typescript'

import type { PrinterOptions } from 'typescript'

const { factory } = ts

type Options = {
  source?: string
  baseName?: string
} & PrinterOptions

export function print(
  elements: ts.Node | Array<ts.Node | undefined> | null,
  { source = '', baseName = 'print.ts', removeComments, noEmitHelpers, newLine }: Options = {},
): string {
  const printer = ts.createPrinter({ omitTrailingSemicolon: false, newLine: newLine || ts.NewLineKind.LineFeed, removeComments, noEmitHelpers })
  const sourceFile = ts.createSourceFile(baseName, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS)

  let nodes: Array<ts.Node> = []

  if (!elements) {
    return ''
  }

  if (Array.isArray(elements)) {
    nodes = elements.filter(Boolean) as ts.Node[]
  } else {
    nodes = [elements].filter(Boolean)
  }

  const outputFile = printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(nodes), sourceFile)
  const outputSource = printer.printFile(sourceFile)

  return [outputFile, outputSource].filter(Boolean).join('\n')
}
