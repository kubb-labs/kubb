import type { ImportNode } from '@kubb/ast'
import type { RefName } from './from.ts'

/**
 * Generated text plus the imports its names need, in the order of use.
 */
export type Code = {
  readonly text: string
  /**
   * Absolute paths without a `root`. Pass the importing file's path as `root` when you render them.
   */
  readonly imports: ReadonlyArray<ImportNode>
}

/**
 * A value `code` accepts in a hole. `null`, `undefined` and `false` print nothing, so `${cond && name}` works when `cond` is a boolean.
 */
export type CodeValue = Code | RefName | string | number | boolean | null | undefined

function isCode(value: CodeValue): value is Code {
  return typeof value === 'object' && value !== null && 'text' in value
}

function isRefName(value: CodeValue): value is RefName {
  return typeof value === 'object' && value !== null && 'import' in value
}

function toText(value: CodeValue): string {
  if (value === null || value === undefined || value === false) return ''
  if (isCode(value)) return value.text
  if (isRefName(value)) return value.name
  return String(value)
}

function build(strings: ReadonlyArray<string>, values: ReadonlyArray<CodeValue>): Code {
  return {
    text: strings.reduce((text, part, index) => text + toText(values[index - 1]) + part),
    // `createFile` merges and sorts imports per path, so they are kept as they are, in the order of use.
    imports: values.flatMap((value) => (isCode(value) ? value.imports : isRefName(value) && value.import ? [value.import] : [])),
  }
}

/**
 * A template tag that returns the text and the imports of the names in its holes.
 *
 * @example
 * `code\`satisfies z.ZodType<${from('plugin-ts').resolver.name('Pet')}>\`.text // 'satisfies z.ZodType<Pet>'`
 */
export function code(strings: TemplateStringsArray, ...values: Array<CodeValue>): Code {
  return build(strings, values)
}

/**
 * Joins parts with `separator` and keeps the imports of every part.
 */
code.join = function join(parts: ReadonlyArray<CodeValue>, separator = ''): Code {
  return build(parts.length ? ['', ...parts.slice(1).map(() => separator), ''] : [''], parts)
}
