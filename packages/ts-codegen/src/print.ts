import ts from 'typescript'

const { factory } = ts

export function print(elements: ts.Node | Array<ts.Node | undefined> | null, fileName = 'print.ts'): string {
  let nodes: Array<ts.Node | undefined> = []

  if (!elements) {
    return ''
  }
  if (Array.isArray(elements)) {
    nodes = elements
  } else {
    nodes = [elements]
  }

  const nodesArray = factory.createNodeArray(nodes.filter(Boolean) as ts.Node[])
  const sourceFile = ts.createSourceFile(fileName, '', ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS)

  const printer = ts.createPrinter({ omitTrailingSemicolon: false, newLine: ts.NewLineKind.CarriageReturnLineFeed })
  const outputFile = printer.printList(ts.ListFormat.MultiLine, nodesArray, sourceFile)

  return outputFile
}
