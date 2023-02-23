import ts from 'typescript'

const { factory } = ts

export const print = (elements: ts.Node | Array<ts.Node | undefined>, fileName = 'print.ts') => {
  let nodes: Array<ts.Node | undefined> = []
  if (Array.isArray(elements)) {
    nodes = elements
  } else {
    nodes = [elements]
  }

  const nodesArray = factory.createNodeArray(nodes.filter(Boolean) as ts.Node[])
  const sourceFile = ts.createSourceFile(fileName, '', ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS)

  const printer = ts.createPrinter()
  const outputFile = printer.printList(ts.ListFormat.MultiLine, nodesArray, sourceFile)

  return outputFile
}
