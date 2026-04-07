import type { FileNode } from '@kubb/ast/types'

type PrintOptions = {
  extname?: FileNode['extname']
}

export type Parser<TMeta extends object = any> = {
  name: string
  /**
   * File extensions this parser handles.
   * Use `undefined` to create a catch-all fallback parser.
   *
   * @example ['.ts', '.js']
   */
  extNames: Array<FileNode['extname']> | undefined
  /**
   * Convert a resolved file to a string.
   */
  parse(file: FileNode<TMeta>, options?: PrintOptions): Promise<string> | string
}

/**
 * Defines a parser with type safety.
 *
 * Use this function to create parsers that transform generated files to strings
 * based on their extension.
 *
 * @example
 * ```ts
 * import { defineParser } from '@kubb/core'
 *
 * export const jsonParser = defineParser({
 *   name: 'json',
 *   extNames: ['.json'],
 *   parse(file) {
 *     const { extractStringsFromNodes } = await import('@kubb/ast')
 *     return file.sources.map((s) => extractStringsFromNodes(s.nodes ?? [])).join('\n')
 *   },
 * })
 * ```
 */
export function defineParser<TMeta extends object = any>(parser: Parser<TMeta>): Parser<TMeta> {
  return parser
}
