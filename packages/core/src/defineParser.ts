import type { FileNode } from '@kubb/ast/types'

type PrintOptions = {
  extname?: FileNode['extname']
}

export type Parser<TMeta extends object = any> = {
  name: string
  type: 'parser'
  /**
   * File extensions this parser handles.
   * Use `undefined` to create a catch-all fallback parser.
   *
   * @example ['.ts', '.js']
   */
  extNames: Array<FileNode['extname']> | undefined
  /**
   * @deprecated Will be removed once Fabric no longer requires it.
   * @default () => {}
   */
  install(...args: unknown[]): void | Promise<void>
  /**
   * Convert a resolved file to a string.
   */
  parse(file: FileNode<TMeta>, options?: PrintOptions): Promise<string> | string
}

export type UserParser<TMeta extends object = any> = Omit<Parser<TMeta>, 'type' | 'install'> & {
  install?(...args: unknown[]): void | Promise<void>
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
 *     return file.sources.map((s) => s.value).join('\n')
 *   },
 * })
 * ```
 */
export function defineParser<TMeta extends object = any>(parser: UserParser<TMeta>): Parser<TMeta> {
  return {
    install() {},
    type: 'parser',
    ...parser,
  }
}
