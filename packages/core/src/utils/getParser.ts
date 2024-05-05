type ParserModuleTs = typeof import('@kubb/ts-parser')

export type ParserModule = ParserModuleTs

export async function getParser(language: string | undefined) {
  let modulePromise: Promise<ParserModule>

  switch (language) {
    default:
      modulePromise = import('@kubb/ts-parser')
      break
  }

  const module = await modulePromise

  return module
}
