import { writeFile } from 'node:fs/promises'
import { getErrorMessage, read } from '@internals/utils'
import { detectCodeFormat, parseExpression, parseModule } from 'magicast'
import type { ASTNode, ProxifiedModule } from 'magicast'
import type { ConfigEdit, ConfigEditOutcome, ConfigFileView, ConfigRef, ConfigView, OptionValue, PluginView } from './protocol.ts'
import { isKubbPluginSpecifier, isOptionValue, isSafeKey, toExportName } from './resolveConfig.ts'

/**
 * A valid JavaScript identifier, so an import name can only ever print as `import { name } from`,
 * never as source that breaks out of the import statement.
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/**
 * A config or plugin options object literal in the file.
 */
type ObjectNode = Extract<ASTNode, { type: 'ObjectExpression' }>

/**
 * A config's `plugins` array literal.
 */
type ArrayNode = Extract<ASTNode, { type: 'ArrayExpression' }>

/**
 * A `pluginX(...)` call in a config's `plugins` array.
 */
type CallNode = Extract<ASTNode, { type: 'CallExpression' }>

/**
 * One member of an object literal: `key: value`, a method or accessor, or a `...spread`.
 */
type ObjectMember = ObjectNode['properties'][number]

/**
 * An object literal member that has a key: `key: value`, `key() {}`, `get key() {}`.
 */
type NamedMember = Extract<ObjectMember, { type: 'ObjectProperty' | 'ObjectMethod' }>

/**
 * How the file exports its config, which decides how an import for a new plugin is written.
 */
type ModuleKind = 'esm' | 'cjs'

/**
 * The quote character string literals are written with, matching the file.
 */
type Quote = `'` | `"`

/**
 * What `applyConfigEdits` did to a config file.
 */
type ApplyResult = {
  /**
   * The file's text after every applicable edit, unchanged from the input when none applied.
   */
  source: string
  /**
   * One entry per edit, in the order they were given.
   */
  outcomes: Array<ConfigEditOutcome>
  /**
   * Whether `source` differs from the input.
   */
  changed: boolean
}

/**
 * What a single edit did: the rewritten source, or why it was refused.
 */
type EditResult = { source: string } | { reason: string }

/**
 * Marks the comment block a `disable-plugin` leaves behind, so `enable-plugin` can find its way
 * back to the exact lines it commented out. Carries the block's line count, so `enable-plugin`
 * restores exactly those lines instead of scanning forward through whatever comments follow.
 */
const DISABLED_MARKER = 'kubb:disabled'

const OPERATIONS = new Set<string>(['set', 'remove', 'add-plugin', 'disable-plugin', 'enable-plugin'])

/**
 * Why an edit from Studio cannot be applied as sent, checked before anything reads its fields.
 * The edit crossed the wire, so its declared type is a promise the sender may not have kept.
 */
function invalidEdit(edit: ConfigEdit): string | undefined {
  const fields = (typeof edit === 'object' && edit !== null ? edit : {}) as Record<string, unknown>

  if (typeof fields['operation'] !== 'string' || !OPERATIONS.has(fields['operation'])) {
    return `unknown operation ${JSON.stringify(fields['operation'])}`
  }
  if (typeof fields['plugin'] !== 'string' || !fields['plugin']) {
    return 'the edit names no plugin'
  }
  const config = fields['config']
  if (config !== undefined && typeof config !== 'string' && !Number.isSafeInteger(config)) {
    return 'config must name an entry or give its index'
  }
  if (fields['operation'] === 'set' || fields['operation'] === 'remove') {
    const path = fields['path']
    if (!Array.isArray(path) || !path.every((key) => typeof key === 'string' && key)) {
      return 'path must be a list of option names'
    }
    if (!path.length) {
      return 'no option path given'
    }
    const unsafe = path.find((key: string) => !isSafeKey(key))
    if (unsafe !== undefined) {
      return `${unsafe} cannot be used as an option name`
    }
  }
  if (fields['operation'] === 'add-plugin' && fields['importName'] !== undefined && typeof fields['importName'] !== 'string') {
    return 'importName must be a string'
  }
  return undefined
}

/**
 * The plugin and comment-block length a marker line names, when `line` is one.
 */
function parseMarker(line: string): { plugin: string; lineCount: number } | undefined {
  const trimmed = line.trim()
  if (!trimmed.startsWith(`// ${DISABLED_MARKER} `)) {
    return undefined
  }

  const match = trimmed.slice(`// ${DISABLED_MARKER} `.length).match(/^(.+)\s+(\d+)$/)
  return match ? { plugin: match[1]!, lineCount: Number(match[2]) } : undefined
}

/**
 * One line of a block `disable-plugin` commented out, as it was before. A blank line comes back
 * empty rather than as the indentation the comment carried.
 */
function uncomment(line: string): string {
  const restored = line.replace(/^(\s*)\/\/ ?/, '$1')
  return restored.trim() ? restored : ''
}

/**
 * Where a node sits in the source text.
 */
function rangeOf(node: { start?: number | null; end?: number | null }): { start: number; end: number } {
  if (typeof node.start !== 'number' || typeof node.end !== 'number') {
    throw new Error('the config file could not be mapped back to its source text')
  }
  return { start: node.start, end: node.end }
}

/**
 * The first and last line a node spans, 1-based.
 */
function linesOf(node: ASTNode): { start: number; end: number } {
  return { start: node.loc?.start.line ?? 0, end: node.loc?.end.line ?? Number.POSITIVE_INFINITY }
}

/**
 * `source` with the text between `start` and `end` replaced by `text`.
 */
function splice({ source, start, end, text }: { source: string; start: number; end: number; text: string }): string {
  return `${source.slice(0, start)}${text}${source.slice(end)}`
}

/**
 * Steps through a config's wrappers to the object literal underneath: a `satisfies`/`as`
 * assertion, a `() => ...` factory, or a factory whose block body returns the config.
 */
function unwrap(node: ASTNode | null | undefined): ASTNode | undefined {
  if (!node) {
    return undefined
  }
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') {
    return unwrap(node.expression)
  }
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') {
    return node
  }
  if (node.body.type !== 'BlockStatement') {
    return unwrap(node.body)
  }

  const returned = node.body.body.find((statement): statement is Extract<ASTNode, { type: 'ReturnStatement' }> => statement.type === 'ReturnStatement')
  return unwrap(returned?.argument)
}

/**
 * Whether `node` is `module.exports`.
 */
function isModuleExports(node: ASTNode): boolean {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === 'module' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'exports'
  )
}

/**
 * The value the file exports as its config: `export default ...` or `module.exports = ...`.
 */
function exportedValue(mod: ProxifiedModule): { value: ASTNode | null | undefined; kind: ModuleKind } | undefined {
  const body = mod.$ast.type === 'Program' ? mod.$ast.body : []

  for (const node of body) {
    if (node.type === 'ExportDefaultDeclaration') {
      return { value: node.declaration, kind: 'esm' }
    }
    if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && isModuleExports(node.expression.left)) {
      return { value: node.expression.right, kind: 'cjs' }
    }
  }
  return undefined
}

/**
 * Every config object in `export default defineConfig(...)` (or `module.exports = defineConfig(...)`),
 * or why the file is unmanaged.
 *
 * An array export gets one entry per element, matching {@link ConfigRef}'s numeric index.
 *
 * Walks the parsed AST rather than magicast's proxies, which throw on node types they cannot
 * cast, most of what an unmanaged config file is made of.
 */
function findConfigs(mod: ProxifiedModule): { configs: Array<ObjectNode>; kind: ModuleKind } | { reason: string } {
  const exported = exportedValue(mod)
  const value = unwrap(exported?.value)
  if (!exported || !value) {
    return { reason: 'no `export default` or `module.exports` found' }
  }
  if (value.type !== 'CallExpression' || value.callee.type !== 'Identifier' || value.callee.name !== 'defineConfig') {
    return { reason: 'the exported config is not a defineConfig(...) call' }
  }

  const argument = unwrap(value.arguments[0])
  if (!argument) {
    return { reason: 'defineConfig(...) was called without a config' }
  }
  if (argument.type === 'ArrayExpression') {
    const configs: Array<ObjectNode> = []

    for (const element of argument.elements) {
      const entry = unwrap(element)
      if (entry?.type !== 'ObjectExpression') {
        return { reason: 'config is not an object literal' }
      }
      configs.push(entry)
    }
    return { configs, kind: exported.kind }
  }
  if (argument.type !== 'ObjectExpression') {
    return { reason: 'config is not an object literal' }
  }
  return { configs: [argument], kind: exported.kind }
}

/**
 * The config entry an edit names, defaulting to the first when it names none.
 */
function selectConfig(configs: Array<ObjectNode>, ref: ConfigRef | undefined): ObjectNode | undefined {
  if (ref === undefined) {
    return configs[0]
  }
  if (typeof ref === 'number') {
    return configs[ref]
  }
  return configs.find((config) => configName(config) === ref)
}

function configName(config: ObjectNode): string | undefined {
  const name = property(config, 'name')
  return name?.type === 'StringLiteral' ? name.value : undefined
}

/**
 * The name of an object literal member, for the two key shapes a config uses: `key` and `'key'`.
 * `undefined` for a spread or a computed key, which the patcher never touches.
 */
function memberKey(entry: ObjectMember): string | undefined {
  if (entry.type === 'SpreadElement' || entry.computed) {
    return undefined
  }
  if (entry.key.type === 'Identifier') {
    return entry.key.name
  }
  if (entry.key.type === 'StringLiteral') {
    return entry.key.value
  }
  return undefined
}

/**
 * The member of an object literal named `key`. The last one wins when the key repeats, as it does
 * when the object is evaluated.
 */
function findMember(node: ObjectNode, key: string): { member: NamedMember; index: number } | undefined {
  const index = node.properties.findLastIndex((entry) => memberKey(entry) === key)
  return index === -1 ? undefined : { member: node.properties[index] as NamedMember, index }
}

/**
 * The value node of an object literal's own member. A method or accessor is its own value: it is
 * code, never a literal.
 */
function property(node: ObjectNode, key: string): ASTNode | undefined {
  const found = findMember(node, key)
  if (!found) {
    return undefined
  }
  return found.member.type === 'ObjectProperty' ? found.member.value : found.member
}

/**
 * Whether a `...spread` after the member at `index` could override it.
 */
function isShadowed(node: ObjectNode, index: number): boolean {
  return node.properties.slice(index + 1).some((entry) => entry.type === 'SpreadElement')
}

/**
 * Reads a literal node's value: a primitive, or an object/array built only from primitives.
 * `undefined` for anything else, so a caller can use this both to read a value and to check
 * whether a node is a literal at all.
 */
function readLiteral(node: ASTNode | undefined): OptionValue | undefined {
  if (!node) {
    return undefined
  }
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') {
    return node.value
  }
  if (node.type === 'NullLiteral') {
    return null
  }
  if (node.type === 'TemplateLiteral') {
    return node.expressions.length === 0 ? (node.quasis[0]?.value.cooked ?? '') : undefined
  }
  if (node.type === 'UnaryExpression') {
    const value = readLiteral(node.argument)
    if (typeof value !== 'number') {
      return undefined
    }
    if (node.operator === '-') {
      return -value
    }
    if (node.operator === '+') {
      return value
    }
    return undefined
  }
  if (node.type === 'ArrayExpression') {
    const values = node.elements.map((element) => (element ? readLiteral(element) : undefined))
    return values.every((value) => value !== undefined) ? values : undefined
  }
  if (node.type === 'ObjectExpression') {
    const entries: Record<string, OptionValue> = {}
    for (const entry of node.properties) {
      if (entry.type !== 'ObjectProperty') {
        return undefined
      }
      const key = memberKey(entry)
      const value = readLiteral(entry.value)
      // A `__proto__` key would replace the object's prototype instead of adding an entry.
      if (key === undefined || !isSafeKey(key) || value === undefined) {
        return undefined
      }
      entries[key] = value
    }
    return entries
  }
  return undefined
}

/**
 * Writes `value` as source text: a single-line literal with the file's quote style.
 */
function printValue(value: OptionValue, quote: Quote): string {
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'string') {
    // JSON's escaping covers every character that could end the literal or the line.
    const escaped = JSON.stringify(value).slice(1, -1)
    return quote === `"` ? `"${escaped}"` : `'${escaped.replaceAll(`\\"`, `"`).replaceAll(`'`, `\\'`)}'`
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => printValue(item, quote)).join(', ')}]`
  }

  const entries = Object.entries(value)
  if (!entries.length) {
    return '{}'
  }
  return `{ ${entries.map(([key, item]) => `${printKey(key, quote)}: ${printValue(item, quote)}`).join(', ')} }`
}

/**
 * An object key as source text: bare when it is an identifier, quoted otherwise.
 */
function printKey(key: string, quote: Quote): string {
  return IDENTIFIER.test(key) ? key : printValue(key, quote)
}

/**
 * `value` wrapped in one object per key of `path`: `nest(['enum', 'type'], 'enum')` is `{ enum: { type: 'enum' } }`.
 */
function nest(path: Array<string>, value: OptionValue): OptionValue {
  return path.reduceRight<OptionValue>((inner, key) => ({ [key]: inner }), value)
}

/**
 * Adds `text` as the last item of an object or array literal, following its layout: on a line of
 * its own with the last item's indentation when the literal spans lines, inline otherwise.
 */
function insertItem({
  source,
  container,
  items,
  text,
}: {
  source: string
  container: ObjectNode | ArrayNode
  items: Array<ASTNode | null>
  text: string
}): string {
  const { start, end } = rangeOf(container)
  const last = items.filter((item): item is ASTNode => item !== null).at(-1)

  if (!last) {
    return splice({ source, start, end, text: container.type === 'ObjectExpression' ? `{ ${text} }` : `[${text}]` })
  }

  const lastRange = rangeOf(last)
  const closing = end - 1
  const between = source.slice(lastRange.end, closing)

  // The closing bracket shares the last item's line: add the item inline.
  if (!between.includes('\n')) {
    return splice({ source, start: lastRange.end, end: lastRange.end, text: `, ${text}` })
  }

  const lineStart = source.lastIndexOf('\n', lastRange.start - 1) + 1
  const indent = source.slice(lineStart).match(/^[ \t]*/)?.[0] ?? ''
  // After the last item's comma and any comment on its line, so neither moves.
  const lineEnd = source.indexOf('\n', lastRange.end)
  const hasComma = /^\s*,/.test(between)

  if (hasComma) {
    return splice({ source, start: lineEnd, end: lineEnd, text: `\n${indent}${text},` })
  }
  return `${source.slice(0, lastRange.end)},${source.slice(lastRange.end, lineEnd)}\n${indent}${text}${source.slice(lineEnd)}`
}

/**
 * Drops the member at `index` from an object literal, with its own lines when it sits on them alone.
 */
function removeMember({ source, node, index }: { source: string; node: ObjectNode; index: number }): string {
  const { start, end } = rangeOf(node.properties[index]!)

  if (node.properties.length === 1) {
    return splice({ source, ...rangeOf(node), text: '{}' })
  }

  const lineStart = source.lastIndexOf('\n', start - 1) + 1
  const nextNewline = source.indexOf('\n', end)
  const lineEnd = nextNewline === -1 ? source.length : nextNewline
  if (!source.slice(lineStart, start).trim() && /^\s*,?\s*(\/\/.*)?$/.test(source.slice(end, lineEnd))) {
    return splice({ source, start: lineStart, end: Math.min(lineEnd + 1, source.length), text: '' })
  }

  const next = node.properties[index + 1]
  if (next) {
    return splice({ source, start, end: rangeOf(next).start, text: '' })
  }
  return splice({ source, start: rangeOf(node.properties[index - 1]!).end, end, text: '' })
}

/**
 * Maps a factory identifier in the file back to the module it was imported from, through an
 * `import { x } from` or a `const { x } = require(...)`.
 */
function importedFrom(mod: ProxifiedModule): Map<string, string> {
  const imports = new Map(mod.imports.$items.map((item) => [item.local, item.from]))
  const body = mod.$ast.type === 'Program' ? mod.$ast.body : []

  for (const statement of body) {
    if (statement.type !== 'VariableDeclaration') {
      continue
    }
    for (const declarator of statement.declarations) {
      const from = requiredModule(declarator.init)
      if (from === undefined || declarator.id.type !== 'ObjectPattern') {
        continue
      }
      for (const entry of declarator.id.properties) {
        if (entry.type === 'ObjectProperty' && entry.value.type === 'Identifier') {
          imports.set(entry.value.name, from)
        }
      }
    }
  }
  return imports
}

/**
 * The module a `require('...')` call loads, when `node` is one.
 */
function requiredModule(node: ASTNode | null | undefined): string | undefined {
  if (node?.type !== 'CallExpression' || node.callee.type !== 'Identifier' || node.callee.name !== 'require') {
    return undefined
  }
  const [argument] = node.arguments
  return argument?.type === 'StringLiteral' ? argument.value : undefined
}

/**
 * Every `pluginX(...)` element of a config's plugins array that resolves to an import.
 */
function pluginCalls(mod: ProxifiedModule, config: ObjectNode): Array<{ importName: string; packageName: string; call: CallNode }> {
  const plugins = property(config, 'plugins')
  if (plugins?.type !== 'ArrayExpression') {
    return []
  }

  const imports = importedFrom(mod)

  return plugins.elements.flatMap((element) => {
    if (element?.type !== 'CallExpression' || element.callee.type !== 'Identifier') {
      return []
    }
    const packageName = imports.get(element.callee.name)
    return packageName ? [{ importName: element.callee.name, packageName, call: element }] : []
  })
}

/**
 * The blocks a previous `disable-plugin` commented out of this config, read from the marker lines
 * rather than the AST, since a commented-out call is no longer a node.
 */
function disabledBlocks(source: string, config: ObjectNode): Array<{ packageName: string; line: number; code: string }> {
  const lines = source.split('\n')
  const range = linesOf(config)

  return lines.flatMap((line, index) => {
    const marker = parseMarker(line)
    if (!marker || index + 1 < range.start || index + 1 > range.end) {
      return []
    }
    const code = lines
      .slice(index + 1, index + 1 + marker.lineCount)
      .map(uncomment)
      .join('\n')
    return [{ packageName: marker.plugin, line: index + 1, code }]
  })
}

/**
 * The top-level options of a plugin call, each flagged with whether Studio may write it.
 */
function readOptions(call: CallNode): PluginView['options'] {
  const entries: PluginView['options'] = {}
  const options = call.arguments[0]
  if (options?.type !== 'ObjectExpression') {
    return entries
  }

  for (const entry of options.properties) {
    const key = memberKey(entry)
    if (key === undefined || !isSafeKey(key)) {
      continue
    }
    const value = entry.type === 'ObjectProperty' ? readLiteral(entry.value) : undefined
    entries[key] = value === undefined ? { literal: false } : { literal: true, value }
  }
  return entries
}

/**
 * The options a commented-out plugin call holds, so Studio can show them while it is disabled.
 */
function readDisabledOptions(code: string): PluginView['options'] {
  try {
    const call = (parseExpression(code.trim().replace(/,$/, '')) as { $ast: ASTNode }).$ast
    return call.type === 'CallExpression' ? readOptions(call) : {}
  } catch {
    return {}
  }
}

/**
 * Reads which plugins the file declares and which of their options Studio may write.
 *
 * @example
 * ```ts
 * const view = readConfig(await readFile('kubb.config.ts', 'utf8'))
 * if (view.managed) {
 *   view.configs.forEach((config) => console.log(config.name, config.plugins.length))
 * }
 * ```
 */
export function readConfig(source: string): ConfigFileView {
  const parsed = parseConfigs(source)
  if ('reason' in parsed) {
    return { managed: false, reason: parsed.reason }
  }

  const { mod, configs } = parsed
  const importNames = new Map([...importedFrom(mod)].map(([local, from]) => [from, local]))

  return {
    managed: true,
    configs: configs.map((config): ConfigView => {
      const active = pluginCalls(mod, config).map(({ importName, packageName, call }) => ({
        line: call.loc?.start.line ?? 0,
        plugin: { importName, packageName, options: readOptions(call) } satisfies PluginView,
      }))
      const disabled = disabledBlocks(source, config).map(({ packageName, line, code }) => ({
        line,
        plugin: {
          importName: importNames.get(packageName) ?? toExportName(packageName),
          packageName,
          options: readDisabledOptions(code),
          disabled: true,
        } satisfies PluginView,
      }))

      // In source order, so a disabled plugin keeps its place in the list.
      const plugins = [...active, ...disabled].sort((a, b) => a.line - b.line).map(({ plugin }): PluginView => plugin)

      return { name: configName(config), plugins }
    }),
  }
}

/**
 * Walks `path` through a plugin's options to the object holding its last key.
 *
 * Returns `missing` with the index of the first key that is not there yet, so `set` can write the
 * rest of the path as one nested literal and `remove` can report it as unset.
 */
function walk(
  options: ObjectNode,
  path: Array<string>,
): { object: ObjectNode; found: { member: NamedMember; index: number } } | { object: ObjectNode; missing: number } | { reason: string } {
  let object = options

  for (const [index, key] of path.entries()) {
    const found = findMember(object, key)
    if (!found) {
      return { object, missing: index }
    }
    if (isShadowed(object, found.index)) {
      return { reason: `${path.slice(0, index + 1).join('.')} can be overridden by a spread after it, so it is customized in code` }
    }
    if (index === path.length - 1) {
      return { object, found }
    }
    if (found.member.type !== 'ObjectProperty' || found.member.value.type !== 'ObjectExpression') {
      return { reason: `${key} is not an object, so ${path.join('.')} cannot be reached` }
    }
    object = found.member.value
  }
  return { reason: 'no option path given' }
}

/**
 * Writes `value` at `path` inside a plugin call's options, adding the options object and any
 * intermediate object along the path as needed. Refuses when the current value at `path` is
 * something other than a literal, so an option customized in code is never overwritten.
 */
function applySet({ source, call, path, value, quote }: { source: string; call: CallNode; path: Array<string>; value: unknown; quote: Quote }): EditResult {
  if (!isOptionValue(value)) {
    return { reason: 'the value is not a literal that can be written to a config file' }
  }

  const options = call.arguments[0]
  if (!options) {
    const closing = rangeOf(call).end - 1
    if (source[closing] !== ')') {
      return { reason: 'the plugin call could not be located in the file' }
    }
    return { source: splice({ source, start: closing, end: closing, text: printValue(nest(path, value), quote) }) }
  }
  if (options.type !== 'ObjectExpression') {
    return { reason: 'the plugin was not called with an object literal' }
  }

  const target = walk(options, path)
  if ('reason' in target) {
    return target
  }
  if ('missing' in target) {
    const [key, ...rest] = path.slice(target.missing)
    const text = `${printKey(key!, quote)}: ${printValue(nest(rest, value), quote)}`
    return { source: insertItem({ source, container: target.object, items: target.object.properties, text }) }
  }

  const { member } = target.found
  if (member.type !== 'ObjectProperty' || readLiteral(member.value) === undefined) {
    return { reason: `${path.join('.')} is customized in code` }
  }
  return { source: splice({ source, ...rangeOf(member.value), text: printValue(value, quote) }) }
}

/**
 * Deletes the option at `path` inside a plugin call's options, falling the plugin back to its
 * default for that option. Refuses when the value at `path` is not a literal, for the same reason
 * `applySet` does.
 */
function applyRemove({ source, call, path }: { source: string; call: CallNode; path: Array<string> }): EditResult {
  const options = call.arguments[0]
  if (options?.type !== 'ObjectExpression') {
    return { reason: 'the plugin has no options to remove' }
  }

  const target = walk(options, path)
  if ('reason' in target) {
    return target
  }
  if ('missing' in target) {
    return { reason: `${path.join('.')} is not set` }
  }

  const { member, index } = target.found
  if (member.type !== 'ObjectProperty' || readLiteral(member.value) === undefined) {
    return { reason: `${path.join('.')} is customized in code` }
  }
  return { source: removeMember({ source, node: target.object, index }) }
}

/**
 * Adds a `pluginX(...)` call to a config's plugins array, and its import. Replaying the same add is
 * a no-op, while an import name collision with an unrelated package remains an error.
 */
function applyAddPlugin({
  source,
  mod,
  config,
  kind,
  edit,
  quote,
}: {
  source: string
  mod: ProxifiedModule
  config: ObjectNode
  kind: ModuleKind
  edit: Extract<ConfigEdit, { operation: 'add-plugin' }>
  quote: Quote
}): EditResult {
  if (!isKubbPluginSpecifier(edit.plugin)) {
    return { reason: `"${edit.plugin}" is not a @kubb/plugin-* package` }
  }

  const importName = edit.importName ?? toExportName(edit.plugin)
  if (!IDENTIFIER.test(importName)) {
    return { reason: `"${importName}" is not a valid import name` }
  }

  if (pluginCalls(mod, config).some((plugin) => plugin.packageName === edit.plugin)) {
    return { source }
  }

  const taken = importedFrom(mod).get(importName)
  if (taken && taken !== edit.plugin) {
    return { reason: `${importName} is already imported from ${taken}` }
  }

  const options = edit.options ?? {}
  if (!isOptionValue(options)) {
    return { reason: 'the options are not literals that can be written to a config file' }
  }

  const plugins = property(config, 'plugins')
  if (plugins?.type !== 'ArrayExpression') {
    return { reason: 'plugins is not an array literal' }
  }

  const call = `${importName}(${Object.keys(options).length ? printValue(options, quote) : ''})`
  // The array sits below the imports, so adding to it first leaves the import lines where they are.
  const next = insertItem({ source, container: plugins, items: plugins.elements, text: call })

  return { source: taken ? next : insertImport({ source: next, mod, kind, importName, moduleSpecifier: edit.plugin }) }
}

/**
 * Comments out a plugin call in place, keeping its options on disk so `enable-plugin` can restore
 * them exactly.
 */
function disablePlugin({ source, mod, config, plugin }: { source: string; mod: ProxifiedModule; config: ObjectNode; plugin: string }): EditResult {
  const target = pluginCalls(mod, config).find((entry) => entry.packageName === plugin)
  if (!target) {
    return { reason: `${plugin} is not in the plugins array` }
  }

  const loc = target.call.loc
  if (!loc?.start || !loc.end) {
    return { reason: `${plugin} has no source location to comment out` }
  }

  const lines = source.split('\n')
  const from = loc.start.line - 1
  const to = loc.end.line - 1
  const firstLine = lines[from] ?? ''
  const lastLine = lines[to] ?? ''

  // Only safe to comment out when the call sits alone on its lines: anything else sharing the
  // first line before it, or the last line after it besides a trailing comma, would be swallowed
  // into the comment along with the call, corrupting the file.
  if (firstLine.slice(0, loc.start.column).trim() !== '' || !/^,?\s*$/.test(lastLine.slice(loc.end.column))) {
    return { reason: `${plugin} shares a line with other code, so it cannot be commented out safely` }
  }

  const indent = firstLine.match(/^\s*/)?.[0] ?? ''
  const commented = lines.slice(from, to + 1).map((line) => (line.trim() ? `${indent}// ${line.slice(indent.length)}` : indent ? `${indent}//` : '//'))
  lines.splice(from, to - from + 1, `${indent}// ${DISABLED_MARKER} ${plugin} ${commented.length}`, ...commented)

  return { source: lines.join('\n') }
}

/**
 * Uncomments the block a previous `disable-plugin` left behind for `plugin` in this config.
 */
function enablePlugin({ source, config, plugin }: { source: string; config: ObjectNode; plugin: string }): EditResult {
  const lines = source.split('\n')
  const range = linesOf(config)

  for (const [index, line] of lines.entries()) {
    const marker = parseMarker(line)
    // Only markers inside this entry, so an array config never enables another entry's plugin.
    if (marker?.plugin !== plugin || index + 1 < range.start || index + 1 > range.end) {
      continue
    }

    // Bounded by the marker's own line count rather than scanning for trailing `//` lines, so a
    // comment or another disabled block right after this one is left untouched.
    const end = index + 1 + marker.lineCount
    lines.splice(index, end - index, ...lines.slice(index + 1, end).map(uncomment))

    return { source: lines.join('\n') }
  }

  return { reason: `${plugin} is not disabled` }
}

/**
 * Parses `source` and finds the config entries it exports.
 */
function parseConfigs(source: string): { mod: ProxifiedModule; configs: Array<ObjectNode>; kind: ModuleKind } | { reason: string } {
  let mod: ProxifiedModule
  try {
    mod = parseModule(source)
  } catch {
    return { reason: 'the config file could not be parsed' }
  }

  const found = findConfigs(mod)
  return 'reason' in found ? found : { mod, ...found }
}

/**
 * Applies one edit to `source`. Every edit re-parses the file, since the previous one rewrote it.
 */
function applyEdit({ source, edit, quote }: { source: string; edit: ConfigEdit; quote: Quote }): EditResult {
  const parsed = parseConfigs(source)
  if ('reason' in parsed) {
    return parsed
  }

  const { mod, kind } = parsed
  const config = selectConfig(parsed.configs, edit.config)
  if (!config) {
    return { reason: `no config entry found for ${JSON.stringify(edit.config)}` }
  }

  if (edit.operation === 'disable-plugin') {
    return disablePlugin({ source, mod, config, plugin: edit.plugin })
  }
  if (edit.operation === 'enable-plugin') {
    return enablePlugin({ source, config, plugin: edit.plugin })
  }
  if (edit.operation === 'add-plugin') {
    return applyAddPlugin({ source, mod, config, kind, edit, quote })
  }

  const pluginCall = pluginCalls(mod, config).find((plugin) => plugin.packageName === edit.plugin)
  if (!pluginCall) {
    const disabled = disabledBlocks(source, config).some((block) => block.packageName === edit.plugin)
    return { reason: disabled ? `${edit.plugin} is disabled, enable it first` : `${edit.plugin} is not in the plugins array` }
  }

  return edit.operation === 'set'
    ? applySet({ source, call: pluginCall.call, path: edit.path, value: edit.value, quote })
    : applyRemove({ source, call: pluginCall.call, path: edit.path })
}

/**
 * Applies edits to a `kubb.config.ts` in place. Each edit rewrites only the text it targets, so
 * comments, formatting, and hand-written code around the config survive.
 *
 * Edits are independent: one that cannot be applied is reported in `outcomes` and the rest still run.
 *
 * @example
 * ```ts
 * const { source, outcomes } = applyConfigEdits(current, [
 *   { operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' },
 * ])
 * ```
 */
export function applyConfigEdits(source: string, edits: Array<ConfigEdit>): ApplyResult {
  let current = source
  const quote: Quote = detectCodeFormat(source).quote === 'double' ? `"` : `'`

  const outcomes = edits.map((edit): ConfigEditOutcome => {
    const invalid = invalidEdit(edit)
    if (invalid) {
      return { edit, applied: false, reason: invalid }
    }

    try {
      const result = applyEdit({ source: current, edit, quote })
      if ('reason' in result) {
        return { edit, applied: false, reason: result.reason }
      }
      current = result.source
      return { edit, applied: true }
    } catch (error) {
      return { edit, applied: false, reason: getErrorMessage(error) }
    }
  })

  return { source: current, outcomes, changed: current !== source }
}

export async function writeConfigEdits({ filePath, edits }: { filePath: string; edits: Array<ConfigEdit> }): Promise<ApplyResult> {
  const current = await read(filePath)
  const result = applyConfigEdits(current, edits)
  if (result.changed) await writeFile(filePath, result.source, 'utf-8')
  return result
}

/**
 * The 1-based line where the file's last import ends: an `import` declaration, or for a CommonJS
 * file a `const { x } = require(...)`. `0` when it has none. Read off the parsed module, so a
 * multi-line `import {\n  x,\n} from '...'` reports its closing line rather than the `import` keyword.
 */
function lastImportEndLine(mod: ProxifiedModule, kind: ModuleKind): number {
  const body = mod.$ast.type === 'Program' ? mod.$ast.body : []
  const imports = body.filter((node) =>
    kind === 'esm'
      ? node.type === 'ImportDeclaration'
      : node.type === 'VariableDeclaration' && node.declarations.some((declarator) => requiredModule(declarator.init) !== undefined),
  )

  return imports.at(-1)?.loc?.end.line ?? 0
}

/**
 * Writes an import after the last one already in the file, matching its quote style and whether it
 * ends in a semicolon: `import { x } from '...'`, or `const { x } = require('...')` in a CommonJS file.
 */
function insertImport({
  source,
  mod,
  kind,
  importName,
  moduleSpecifier,
}: {
  source: string
  mod: ProxifiedModule
  kind: ModuleKind
  importName: string
  moduleSpecifier: string
}): string {
  const afterLine = lastImportEndLine(mod, kind)
  const lines = source.split('\n')

  const lastImportLine = afterLine > 0 ? lines[afterLine - 1] : undefined
  const quote = lastImportLine?.includes(`"`) ? `"` : `'`
  const semicolon = lastImportLine?.trimEnd().endsWith(';') ? ';' : ''
  const specifier = `${quote}${moduleSpecifier}${quote}`
  const line = kind === 'esm' ? `import { ${importName} } from ${specifier}${semicolon}` : `const { ${importName} } = require(${specifier})${semicolon}`

  lines.splice(afterLine, 0, ...(afterLine > 0 ? [line] : [line, '']))

  return lines.join('\n')
}
