import { print } from './print.ts'

/**
 * Format the generated code based on the TypeScript printer.
 */
export function format(source: string) {
  // do some basic linting with the ts compiler
  return print([], { source, noEmitHelpers: false })
}
