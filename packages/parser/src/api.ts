import path from 'node:path'

import ts from 'typescript'

type ExportsResult = {
  name: string
  isTypeOnly: boolean
}

/**
 * @link https://github.com/microsoft/TypeScript/issues/15840
 */
export function getExports(filePath: string): undefined | Array<ExportsResult> {
  const rootName = path.extname(filePath) ? filePath : `${filePath}.ts`

  if (!rootName) {
    return undefined
  }

  const program = ts.createProgram({
    rootNames: [rootName],
    options: {},
  })

  const checker = program.getTypeChecker()
  const sources = program.getSourceFiles()
  const sourceFile = sources.find((sourceFile) => sourceFile.fileName === rootName)

  if (!sourceFile) {
    return undefined
  }

  const symbol = checker.getSymbolAtLocation(sourceFile)

  if (!symbol?.flags) {
    return undefined
  }

  const exports = checker.getExportsOfModule(symbol)
  return exports.map((e) => {
    // 5 is type and 90 is const
    const type = checker.getTypeOfSymbol(e) as unknown as { id?: 5 | 90 }

    return {
      name: e.escapedName.toString(),
      isTypeOnly: type?.id === 5,
    }
  })
}
