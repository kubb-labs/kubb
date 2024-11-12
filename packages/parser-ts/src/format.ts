import { type PrintOptions, print } from './print.ts'

/**
 * Format the generated code based on the TypeScript printer.
 */
export function format(source: string, options: Omit<PrintOptions, 'source'> = {}) {
  // do some basic linting with the ts compiler
  return print([], { source, noEmitHelpers: false, ...options })
}
