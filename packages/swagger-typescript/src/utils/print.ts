import ts, { factory } from 'typescript'

import { format } from '@kubb/core'

type Options = {
  format?: boolean
}

export const print = (elements: ts.Node | Array<ts.Node | undefined>, fileName = 'print.ts', options: Options = { format: false }) => {
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

  if (options.format) {
    return format(outputFile)
  }
  return outputFile
}
