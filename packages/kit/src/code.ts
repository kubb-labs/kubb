import { ast, type ImportNode } from '@kubb/ast'
import type { RefName } from './ref.ts'

/**
 * Generated text plus the imports its names need, grouped per path in the order of first use.
 */
export type Code = {
  readonly text: string
  /**
   * Absolute paths without a `root`. Pass the importing file's path as `root` when you render them.
   */
  readonly imports: ReadonlyArray<ImportNode>
}

/**
 * A value `code` accepts in a hole. `null`, `undefined` and `false` print nothing, so `${cond && name}` works.
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
  const groups = new Map<string, { path: string; isTypeOnly: boolean; names: Set<string> }>()
  const add = ({ name, path, isTypeOnly }: ImportNode) => {
    const key = `${path}\u0000${Boolean(isTypeOnly)}`
    const group = groups.get(key) ?? { path, isTypeOnly: Boolean(isTypeOnly), names: new Set<string>() }
    groups.set(key, group)
    for (const item of Array.isArray(name) ? name : [name]) if (typeof item === 'string') group.names.add(item)
  }

  for (const value of values) {
    if (isCode(value)) value.imports.forEach(add)
    if (isRefName(value) && value.import) add(value.import)
  }

  return {
    text: strings.reduce((text, part, index) => text + toText(values[index - 1]) + part),
    imports: [...groups.values()].map(({ path, isTypeOnly, names }) => ast.factory.createImport({ name: [...names], path, isTypeOnly })),
  }
}

/**
 * A template tag that returns the text and the imports of the names in its holes.
 *
 * @example
 * ```ts
 * const source = code`satisfies z.ZodType<${ref('plugin-ts').name('Pet')}>`
 * source.text // 'satisfies z.ZodType<Pet>'
 * ```
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
