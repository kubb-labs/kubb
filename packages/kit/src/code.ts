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

function isNamed(node: ImportNode): node is ImportNode & { name: Array<string> } {
  return Array.isArray(node.name) && node.name.every((item) => typeof item === 'string') && !node.isNameSpace
}

function build(strings: ReadonlyArray<string>, values: ReadonlyArray<CodeValue>): Code {
  const imports: Array<ImportNode> = []
  // Named imports from one path merge into the first. Default, alias and namespace imports keep their shape.
  const add = (node: ImportNode) => {
    const index = isNamed(node)
      ? imports.findIndex((imp) => isNamed(imp) && imp.path === node.path && Boolean(imp.isTypeOnly) === Boolean(node.isTypeOnly))
      : -1
    const first = imports[index] as (ImportNode & { name: Array<string> }) | undefined
    if (!first) return void imports.push(node)
    imports[index] = ast.factory.createImport({
      name: [...new Set([...first.name, ...(node.name as Array<string>)])],
      path: node.path,
      isTypeOnly: node.isTypeOnly,
    })
  }

  for (const value of values) {
    if (isCode(value)) value.imports.forEach(add)
    if (isRefName(value) && value.import) add(value.import)
  }

  return {
    text: strings.reduce((text, part, index) => text + toText(values[index - 1]) + part),
    imports,
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
