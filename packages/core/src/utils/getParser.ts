type ParserModuleTs = typeof import('@kubb/parser-ts')

export type ParserModule = ParserModuleTs

export async function getParser(language: string | undefined) {
  let modulePromise: Promise<ParserModule>

  switch (language) {
    default:
      modulePromise = import('@kubb/parser-ts')
      break
  }

  const module = await modulePromise

  return module
}
