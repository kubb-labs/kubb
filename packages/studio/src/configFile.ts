import { writeFile } from 'node:fs/promises'
import type { ExtensionKind } from '@kubb/core'
import { getErrorMessage, read } from '@internals/utils'
import { detectCodeFormat, parseExpression, parseModule } from 'magicast'
import type { ASTNode, ProxifiedModule } from 'magicast'
import type { ConfigEdit, ConfigEditOutcome, ConfigFileView, ConfigView, InstalledExtensions, OptionValue, PluginView } from './protocol.ts'
import { isAllowedPlugin, isOptionValue, isSafeKey, toExportName } from './resolveConfig.ts'

/**
 * A valid JavaScript identifier, so an import name can only ever print as `import { name } from`,
 * never as source that breaks out of the import statement.
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/**
 * The marker line a `disable-plugin` writes above the block it comments out. It carries the block's
 * line count, so `enable-plugin` restores exactly those lines and not whatever comments follow.
 */
const DISABLED_MARKER = /^\/\/ kubb:disabled (.+)\s+(\d+)$/

const OPERATIONS = new Set<string>(['set', 'remove', 'add-plugin', 'disable-plugin', 'enable-plugin'])
const KINDS = new Set<string>(['plugin', 'adapter', 'parser'])

type ObjectNode = Extract<ASTNode, { type: 'ObjectExpression' }>
type ArrayNode = Extract<ASTNode, { type: 'ArrayExpression' }>
type CallNode = Extract<ASTNode, { type: 'CallExpression' }>
/** A member of an object literal: `key: value`, a method or accessor, or a `...spread`. */
type ObjectMember = ObjectNode['properties'][number]
/** How the file exports its config, which decides how an import for a new plugin is written. */
type ModuleKind = 'esm' | 'cjs'
type Quote = `'` | `"`
/** What one edit did: the rewritten source, or why it was refused. */
type EditResult = { source: string } | { reason: string }
type ParsedConfig = { mod: ProxifiedModule; configs: Array<ObjectNode>; kind: ModuleKind }

/**
 * Why an edit from Studio cannot be applied as sent, checked before anything reads its fields.
 * The edit crossed the wire, so its declared type is a promise the sender may not have kept.
 */
function invalidEdit(edit: ConfigEdit): string | undefined {
  const { operation, plugin, config, path, kind } = (typeof edit === 'object' && edit !== null ? edit : {}) as Record<string, unknown>

  if (typeof operation !== 'string' || !OPERATIONS.has(operation)) return `unknown operation ${JSON.stringify(operation)}`
  if (typeof plugin !== 'string' || !plugin) return 'the edit names no plugin'
  if (kind !== undefined && (typeof kind !== 'string' || !KINDS.has(kind))) return `unknown kind ${JSON.stringify(kind)}`
  if (config !== undefined && typeof config !== 'string' && !Number.isSafeInteger(config)) return 'config must name an entry or give its index'
  if (operation === 'set' || operation === 'remove') {
    if (!Array.isArray(path) || !path.every((key) => typeof key === 'string' && key)) return 'path must be a list of option names'
    if (!path.length) return 'no option path given'
    const unsafe = path.find((key: string) => !isSafeKey(key))
    if (unsafe !== undefined) return `${unsafe} cannot be used as an option name`
  }
  return undefined
}

/** Where a node sits in the source text. */
function rangeOf(node: { start?: number | null; end?: number | null }): { start: number; end: number } {
  if (typeof node.start !== 'number' || typeof node.end !== 'number') throw new Error('the config file could not be mapped back to its source text')
  return { start: node.start, end: node.end }
}

/** `source` with the text between `start` and `end` replaced by `text`. */
function splice(source: string, start: number, end: number, text = ''): string {
  return `${source.slice(0, start)}${text}${source.slice(end)}`
}

function bodyOf(mod: ProxifiedModule): Array<ASTNode> {
  return mod.$ast.type === 'Program' ? mod.$ast.body : []
}

/**
 * Steps through a config's wrappers to the object literal underneath: a `satisfies`/`as`
 * assertion, a `() => ...` factory, or a factory whose block body returns the config.
 */
function unwrap(node: ASTNode | null | undefined): ASTNode | undefined {
  if (!node) return undefined
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') return unwrap(node.expression)
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') return node
  if (node.body.type !== 'BlockStatement') return unwrap(node.body)

  const returned = node.body.body.find((statement): statement is Extract<ASTNode, { type: 'ReturnStatement' }> => statement.type === 'ReturnStatement')
  return unwrap(returned?.argument)
}

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
 * Parses `source` and finds every config object in `export default defineConfig(...)` or
 * `module.exports = defineConfig(...)`, or why the file is unmanaged. An array export gets one entry
 * per element, matching a numeric `config` index.
 *
 * Walks the parsed AST rather than magicast's proxies, which throw on node types they cannot
 * cast, most of what an unmanaged config file is made of.
 */
function parseConfigs(source: string): ParsedConfig | { reason: string } {
  let mod: ProxifiedModule
  try {
    mod = parseModule(source)
  } catch {
    return { reason: 'the config file could not be parsed' }
  }

  let exported: ASTNode | null | undefined
  let kind: ModuleKind = 'esm'
  for (const node of bodyOf(mod)) {
    if (node.type === 'ExportDefaultDeclaration') {
      exported = node.declaration
      break
    }
    if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && isModuleExports(node.expression.left)) {
      exported = node.expression.right
      kind = 'cjs'
      break
    }
  }

  const value = unwrap(exported)
  if (!value) return { reason: 'no `export default` or `module.exports` found' }
  if (value.type !== 'CallExpression' || value.callee.type !== 'Identifier' || value.callee.name !== 'defineConfig') {
    return { reason: 'the exported config is not a defineConfig(...) call' }
  }

  const argument = unwrap(value.arguments[0])
  if (!argument) return { reason: 'defineConfig(...) was called without a config' }

  const entries = argument.type === 'ArrayExpression' ? argument.elements.map((element) => unwrap(element)) : [argument]
  const configs = entries.filter((entry): entry is ObjectNode => entry?.type === 'ObjectExpression')
  if (configs.length !== entries.length) return { reason: 'config is not an object literal' }

  return { mod, configs, kind }
}

/** The name of a `key` or `'key'` member, `undefined` for a spread or a computed key. */
function memberKey(entry: ObjectMember): string | undefined {
  if (entry.type === 'SpreadElement' || entry.computed) return undefined
  return entry.key.type === 'Identifier' ? entry.key.name : entry.key.type === 'StringLiteral' ? entry.key.value : undefined
}

/** The member named `key`. The last one wins when the key repeats, as it does when the object is evaluated. */
function findMember(node: ObjectNode, key: string): { member: ObjectMember; index: number } | undefined {
  const index = node.properties.findLastIndex((entry) => memberKey(entry) === key)
  return index === -1 ? undefined : { member: node.properties[index]!, index }
}

/** The value node of a member. A method or accessor is its own value: it is code, never a literal. */
function property(node: ObjectNode, key: string): ASTNode | undefined {
  const member = findMember(node, key)?.member
  return member?.type === 'ObjectProperty' ? member.value : member
}

function configName(config: ObjectNode): string | undefined {
  const name = property(config, 'name')
  return name?.type === 'StringLiteral' ? name.value : undefined
}

/** Whether a `...spread` after the member at `index` could override it. */
function isShadowed(node: ObjectNode, index: number): boolean {
  return node.properties.slice(index + 1).some((entry) => entry.type === 'SpreadElement')
}

/**
 * Reads a literal node's value: a primitive, or an object/array built only from primitives.
 * `undefined` for anything else, so a caller can use this both to read a value and to check
 * whether a node is a literal at all.
 */
function readLiteral(node: ASTNode | null | undefined): OptionValue | undefined {
  switch (node?.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'TemplateLiteral':
      return node.expressions.length ? undefined : (node.quasis[0]?.value.cooked ?? '')
    case 'UnaryExpression': {
      const value = readLiteral(node.argument)
      if (typeof value !== 'number') return undefined
      return node.operator === '-' ? -value : node.operator === '+' ? value : undefined
    }
    case 'ArrayExpression': {
      const values = node.elements.map((element) => readLiteral(element))
      return values.every((value) => value !== undefined) ? values : undefined
    }
    case 'ObjectExpression': {
      const entries: Record<string, OptionValue> = {}
      for (const entry of node.properties) {
        if (entry.type !== 'ObjectProperty') return undefined
        const key = memberKey(entry)
        const value = readLiteral(entry.value)
        // A `__proto__` key would replace the object's prototype instead of adding an entry.
        if (key === undefined || !isSafeKey(key) || value === undefined) return undefined
        entries[key] = value
      }
      return entries
    }
  }
  return undefined
}

/** Writes `value` as a single-line literal with the file's quote style. */
function printValue(value: OptionValue, quote: Quote): string {
  if (typeof value === 'string') {
    // JSON's escaping covers every character that could end the literal or the line.
    const escaped = JSON.stringify(value).slice(1, -1)
    return quote === `"` ? `"${escaped}"` : `'${escaped.replaceAll(`\\"`, `"`).replaceAll(`'`, `\\'`)}'`
  }
  if (value === null || typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map((item) => printValue(item, quote)).join(', ')}]`

  const entries = Object.entries(value)
  return entries.length ? `{ ${entries.map(([key, item]) => `${printKey(key, quote)}: ${printValue(item, quote)}`).join(', ')} }` : '{}'
}

/** An object key as source text: bare when it is an identifier, quoted otherwise. */
function printKey(key: string, quote: Quote): string {
  return IDENTIFIER.test(key) ? key : printValue(key, quote)
}

/** `value` wrapped in one object per key of `path`: `nest(['enum', 'type'], 'enum')` is `{ enum: { type: 'enum' } }`. */
function nest(path: Array<string>, value: OptionValue): OptionValue {
  return path.reduceRight<OptionValue>((inner, key) => ({ [key]: inner }), value)
}

/**
 * Adds `text` as the last item of an object or array literal, following its layout: on a line of
 * its own with the last item's indentation when the literal spans lines, inline otherwise.
 */
function insertItem(source: string, container: ObjectNode | ArrayNode, text: string): string {
  const { start, end } = rangeOf(container)
  const items: Array<ASTNode | null> = container.type === 'ObjectExpression' ? container.properties : container.elements
  const last = items.filter((item): item is ASTNode => item !== null).at(-1)

  if (!last) {
    const inner = source.slice(start + 1, end - 1)
    // A comment inside the empty literal stays, after the new item.
    if (inner.trim()) return splice(source, start + 1, start + 1, /^\s/.test(inner) ? `${text},` : `${text}, `)
    return splice(source, start, end, container.type === 'ObjectExpression' ? `{ ${text} }` : `[${text}]`)
  }

  const lastRange = rangeOf(last)
  const between = source.slice(lastRange.end, end - 1)
  // The closing bracket shares the last item's line: add the item inline.
  if (!between.includes('\n')) return splice(source, lastRange.end, lastRange.end, `, ${text}`)

  const lineStart = source.lastIndexOf('\n', lastRange.start - 1) + 1
  const indent = source.slice(lineStart).match(/^[ \t]*/)?.[0] ?? ''
  // After the last item's comma and any comment on its line, so neither moves. `between` holds a
  // newline, so one always follows.
  const lineEnd = source.indexOf('\n', lastRange.end)
  const comma = /^\s*,/.test(between)

  return `${source.slice(0, lastRange.end)}${comma ? '' : ','}${source.slice(lastRange.end, lineEnd)}\n${indent}${text}${comma ? ',' : ''}${source.slice(lineEnd)}`
}

/** Drops the member at `index` from an object literal, with its own lines when it sits on them alone. */
function removeMember(source: string, node: ObjectNode, index: number): string {
  if (node.properties.length === 1) return splice(source, rangeOf(node).start, rangeOf(node).end, '{}')

  const { start, end } = rangeOf(node.properties[index]!)
  const lineStart = source.lastIndexOf('\n', start - 1) + 1
  const nextNewline = source.indexOf('\n', end)
  const lineEnd = nextNewline === -1 ? source.length : nextNewline
  if (!source.slice(lineStart, start).trim() && /^\s*,?\s*(\/\/.*)?$/.test(source.slice(end, lineEnd))) {
    return splice(source, lineStart, Math.min(lineEnd + 1, source.length))
  }

  const next = node.properties[index + 1]
  return next ? splice(source, start, rangeOf(next).start) : splice(source, rangeOf(node.properties[index - 1]!).end, end)
}

/** The module a `require('...')` call loads, when `node` is one. */
function requiredModule(node: ASTNode | null | undefined): string | undefined {
  if (node?.type !== 'CallExpression' || node.callee.type !== 'Identifier' || node.callee.name !== 'require') return undefined
  const [argument] = node.arguments
  return argument?.type === 'StringLiteral' ? argument.value : undefined
}

/** Maps each identifier the file imports, through `import { x } from` or `const { x } = require(...)`, to its module. */
function importedFrom(mod: ProxifiedModule): Map<string, string> {
  const imports = new Map<string, string>()

  for (const statement of bodyOf(mod)) {
    if (statement.type === 'ImportDeclaration') {
      for (const specifier of statement.specifiers) imports.set(specifier.local.name, statement.source.value)
      continue
    }
    if (statement.type !== 'VariableDeclaration') continue
    for (const declarator of statement.declarations) {
      const from = requiredModule(declarator.init)
      if (from === undefined || declarator.id.type !== 'ObjectPattern') continue
      for (const entry of declarator.id.properties) {
        if (entry.type === 'ObjectProperty' && entry.value.type === 'Identifier') imports.set(entry.value.name, from)
      }
    }
  }
  return imports
}

/**
 * Every factory call of one kind that resolves to an import: the `pluginX(...)` elements of the
 * `plugins` array, the `adapter` value, or the elements of the `parsers` array.
 */
function factoryCalls(
  mod: ProxifiedModule,
  config: ObjectNode,
  kind: ExtensionKind = 'plugin',
): Array<{ importName: string; packageName: string; call: CallNode }> {
  const node = property(config, kind === 'adapter' ? 'adapter' : `${kind}s`)
  const elements = kind === 'adapter' ? [node] : node?.type === 'ArrayExpression' ? node.elements : []

  const imports = importedFrom(mod)
  return elements.flatMap((element) => {
    if (element?.type !== 'CallExpression' || element.callee.type !== 'Identifier') return []
    const packageName = imports.get(element.callee.name)
    return packageName ? [{ importName: element.callee.name, packageName, call: element }] : []
  })
}

/**
 * The blocks a previous `disable-plugin` commented out of this config, read from the marker lines
 * since a commented-out call is no longer a node. `code` holds the block's lines as they were.
 */
function disabledBlocks(source: string, config: ObjectNode): Array<{ packageName: string; line: number; end: number; code: Array<string> }> {
  const lines = source.split('\n')
  const first = config.loc?.start.line ?? 0
  const last = config.loc?.end.line ?? Number.POSITIVE_INFINITY

  return lines.flatMap((text, index) => {
    const match = text.trim().match(DISABLED_MARKER)
    // Only markers inside this entry, so an array config never touches another entry's plugin.
    if (!match || index + 1 < first || index + 1 > last) return []

    const end = index + 1 + Number(match[2])
    // A blank line comes back empty, not as the indentation the comment carried.
    const code = lines.slice(index + 1, end).map((line) => line.replace(/^(\s*)\/\/ ?/, '$1').replace(/^\s+$/, ''))
    return [{ packageName: match[1]!, line: index + 1, end, code }]
  })
}

/** The top-level options of a plugin call, each flagged with whether Studio may write it. */
function readOptions(call: CallNode): PluginView['options'] {
  const entries: PluginView['options'] = {}
  const options = call.arguments[0]
  if (options?.type !== 'ObjectExpression') return entries

  for (const [index, entry] of options.properties.entries()) {
    const key = memberKey(entry)
    if (key === undefined || !isSafeKey(key)) continue
    // A spread after the option can override it, so `set` refuses it like code.
    const value = entry.type === 'ObjectProperty' && !isShadowed(options, index) ? readLiteral(entry.value) : undefined
    entries[key] = value === undefined ? { literal: false } : { literal: true, value }
  }
  return entries
}

/** The options a commented-out plugin call holds, so Studio can show them while it is disabled. */
function readDisabledOptions(code: Array<string>): PluginView['options'] {
  try {
    const call = (parseExpression(code.join('\n').trim().replace(/,$/, '')) as { $ast: ASTNode }).$ast
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
  if ('reason' in parsed) return { managed: false, reason: parsed.reason }

  const { mod, configs } = parsed
  const importNames = new Map([...importedFrom(mod)].map(([local, from]) => [from, local]))

  return {
    managed: true,
    configs: configs.map((config): ConfigView => {
      const active = factoryCalls(mod, config).map(({ importName, packageName, call }) => ({
        line: call.loc?.start.line ?? 0,
        plugin: { importName, packageName, options: readOptions(call) },
      }))
      const disabled = disabledBlocks(source, config).map(({ packageName, line, code }) => ({
        line,
        plugin: {
          importName: importNames.get(packageName) ?? toExportName(packageName),
          packageName,
          options: readDisabledOptions(code),
          disabled: true as const,
        },
      }))

      // In source order, so a disabled plugin keeps its place in the list.
      const plugins = [...active, ...disabled].sort((a, b) => a.line - b.line).map(({ plugin }) => plugin)
      const toView = ({ importName, packageName, call }: ReturnType<typeof factoryCalls>[number]): PluginView => ({
        importName,
        packageName,
        options: readOptions(call),
      })
      const [adapter] = factoryCalls(mod, config, 'adapter').map(toView)
      const parsers = factoryCalls(mod, config, 'parser').map(toView)
      return { name: configName(config), plugins, ...(adapter && { adapter }), ...(parsers.length ? { parsers } : {}) }
    }),
  }
}

/** The modules the config file imports, in source order. Empty when the file cannot be parsed. */
export function readImports(source: string): Array<string> {
  try {
    return [...new Set(importedFrom(parseModule(source)).values())]
  } catch {
    return []
  }
}

/**
 * Walks `path` through a plugin's options to the literal at its last key. Returns `missing` with
 * the index of the first key that is not there yet, so `set` can write the rest of the path as one
 * nested literal and `remove` can report it as unset. Refuses a value customized in code, so it is
 * never overwritten.
 */
function walk(
  options: ObjectNode,
  path: Array<string>,
): { object: ObjectNode; index: number; value: ASTNode } | { object: ObjectNode; missing: number } | { reason: string } {
  let object = options

  for (const [depth, key] of path.entries()) {
    const found = findMember(object, key)
    if (!found) return { object, missing: depth }
    if (isShadowed(object, found.index)) {
      return { reason: `${path.slice(0, depth + 1).join('.')} can be overridden by a spread after it, so it is customized in code` }
    }

    const { member, index } = found
    if (depth === path.length - 1) {
      return member.type === 'ObjectProperty' && readLiteral(member.value) !== undefined
        ? { object, index, value: member.value }
        : { reason: `${path.join('.')} is customized in code` }
    }
    if (member.type !== 'ObjectProperty' || member.value.type !== 'ObjectExpression')
      return { reason: `${key} is not an object, so ${path.join('.')} cannot be reached` }
    object = member.value
  }
  return { reason: 'no option path given' }
}

/** Writes `value` at `path` inside a plugin call's options, adding the options object and any intermediate object it needs. */
function applySet(source: string, call: CallNode, path: Array<string>, value: unknown, quote: Quote): EditResult {
  if (!isOptionValue(value)) return { reason: 'the value is not a literal that can be written to a config file' }

  const options = call.arguments[0]
  if (!options) {
    const closing = rangeOf(call).end - 1
    if (source[closing] !== ')') return { reason: 'the factory call could not be located in the file' }
    return { source: splice(source, closing, closing, printValue(nest(path, value), quote)) }
  }
  if (options.type !== 'ObjectExpression') return { reason: 'the factory was not called with an object literal' }

  const target = walk(options, path)
  if ('reason' in target) return target
  if ('missing' in target) {
    const [key, ...rest] = path.slice(target.missing)
    return { source: insertItem(source, target.object, `${printKey(key!, quote)}: ${printValue(nest(rest, value), quote)}`) }
  }
  return { source: splice(source, rangeOf(target.value).start, rangeOf(target.value).end, printValue(value, quote)) }
}

/** Deletes the option at `path`, falling the plugin back to its default for it. */
function applyRemove(source: string, call: CallNode, path: Array<string>): EditResult {
  const options = call.arguments[0]
  if (options?.type !== 'ObjectExpression') return { reason: 'the factory call has no options to remove' }

  const target = walk(options, path)
  if ('reason' in target) return target
  if ('missing' in target) return { reason: `${path.join('.')} is not set` }
  return { source: removeMember(source, target.object, target.index) }
}

/**
 * Writes an import after the last one already in the file, matching its quote style and whether it
 * ends in a semicolon: `import { x } from '...'`, or `const { x } = require('...')` in a CommonJS file.
 * The last import is read off the AST, so a multi-line `import {\n  x,\n} from '...'` counts to its closing line.
 */
function insertImport(source: string, { mod, kind }: ParsedConfig, importName: string, moduleSpecifier: string): string {
  const lastImport = bodyOf(mod).findLast((node) =>
    kind === 'esm'
      ? node.type === 'ImportDeclaration'
      : node.type === 'VariableDeclaration' && node.declarations.some((declarator) => requiredModule(declarator.init) !== undefined),
  )
  const afterLine = lastImport?.loc?.end.line ?? 0
  const lines = source.split('\n')

  const lastImportLine = afterLine > 0 ? lines[afterLine - 1] : undefined
  const quote = lastImportLine?.includes(`"`) ? `"` : `'`
  const semicolon = lastImportLine?.trimEnd().endsWith(';') ? ';' : ''
  const specifier = `${quote}${moduleSpecifier}${quote}`
  lines.splice(
    afterLine,
    0,
    kind === 'esm' ? `import { ${importName} } from ${specifier}${semicolon}` : `const { ${importName} } = require(${specifier})${semicolon}`,
  )
  if (afterLine === 0) lines.splice(1, 0, '')

  return lines.join('\n')
}

/**
 * Adds a `pluginX(...)` call to a config's plugins array, and its import. Replaying the same add is
 * a no-op, while an import name collision with an unrelated package remains an error.
 */
function applyAddPlugin({
  source,
  parsed,
  config,
  edit,
  quote,
  extensions,
}: {
  source: string
  parsed: ParsedConfig
  config: ObjectNode
  edit: Extract<ConfigEdit, { operation: 'add-plugin' }>
  quote: Quote
  extensions: InstalledExtensions
}): EditResult {
  if (!isAllowedPlugin({ packageName: edit.plugin, extensions })) {
    return { reason: `"${edit.plugin}" is not a @kubb/plugin-* package or an installed Kubb plugin` }
  }

  const importName = extensions.get(edit.plugin)?.manifest.export ?? toExportName(edit.plugin)
  if (!IDENTIFIER.test(importName)) return { reason: `"${importName}" is not a valid import name` }
  if (factoryCalls(parsed.mod, config).some((plugin) => plugin.packageName === edit.plugin)) return { source }

  const taken = importedFrom(parsed.mod).get(importName)
  if (taken && taken !== edit.plugin) return { reason: `${importName} is already imported from ${taken}` }

  const options = edit.options ?? {}
  if (!isOptionValue(options)) return { reason: 'the options are not literals that can be written to a config file' }

  const plugins = property(config, 'plugins')
  if (plugins?.type !== 'ArrayExpression') return { reason: 'plugins is not an array literal' }

  // The array sits below the imports, so adding to it first leaves the import lines where they are.
  const next = insertItem(source, plugins, `${importName}(${Object.keys(options).length ? printValue(options, quote) : ''})`)
  return { source: taken ? next : insertImport(next, parsed, importName, edit.plugin) }
}

/** Comments out a plugin call in place, keeping its options on disk so `enable-plugin` can restore them exactly. */
function disablePlugin(source: string, mod: ProxifiedModule, config: ObjectNode, plugin: string): EditResult {
  const loc = factoryCalls(mod, config).find((entry) => entry.packageName === plugin)?.call.loc
  if (!loc) return { reason: `${plugin} is not in the plugins array` }

  const lines = source.split('\n')
  const from = loc.start.line - 1
  const to = loc.end.line - 1
  const firstLine = lines[from] ?? ''

  // Only safe when the call sits alone on its lines: anything else on its first line, or on its last
  // line besides a trailing comma, would be swallowed into the comment and corrupt the file.
  if (firstLine.slice(0, loc.start.column).trim() || !/^,?\s*$/.test((lines[to] ?? '').slice(loc.end.column))) {
    return { reason: `${plugin} shares a line with other code, so it cannot be commented out safely` }
  }

  const indent = firstLine.match(/^\s*/)?.[0] ?? ''
  const commented = lines.slice(from, to + 1).map((line) => (line.trim() ? `${indent}// ${line.slice(indent.length)}` : `${indent}//`))
  lines.splice(from, commented.length, `${indent}// kubb:disabled ${plugin} ${commented.length}`, ...commented)

  return { source: lines.join('\n') }
}

/** Uncomments the block a previous `disable-plugin` left behind for `plugin` in this config. */
function enablePlugin(source: string, config: ObjectNode, plugin: string): EditResult {
  const block = disabledBlocks(source, config).find((entry) => entry.packageName === plugin)
  if (!block) return { reason: `${plugin} is not disabled` }

  const lines = source.split('\n')
  lines.splice(block.line - 1, block.end - block.line + 1, ...block.code)
  return { source: lines.join('\n') }
}

/** Applies one edit to `source`. Every edit re-parses the file, since the previous one rewrote it. */
function applyEdit({ source, edit, quote, extensions }: { source: string; edit: ConfigEdit; quote: Quote; extensions: InstalledExtensions }): EditResult {
  const parsed = parseConfigs(source)
  if ('reason' in parsed) return parsed

  const ref = edit.config
  const config = typeof ref === 'string' ? parsed.configs.find((entry) => configName(entry) === ref) : parsed.configs[ref ?? 0]
  if (!config) return { reason: `no config entry found for ${JSON.stringify(ref)}` }

  if (edit.operation === 'disable-plugin') return disablePlugin(source, parsed.mod, config, edit.plugin)
  if (edit.operation === 'enable-plugin') return enablePlugin(source, config, edit.plugin)
  if (edit.operation === 'add-plugin') return applyAddPlugin({ source, parsed, config, edit, quote, extensions })

  const kind = edit.kind ?? 'plugin'
  // A package can ship several factories (`parserTs` and `parserTsx`), so among its calls prefer the
  // export its manifest names: that is the one Studio knows the package by.
  const calls = factoryCalls(parsed.mod, config, kind).filter((entry) => entry.packageName === edit.plugin)
  const exportName = extensions.get(edit.plugin)?.manifest.export ?? toExportName(edit.plugin)
  const call = (calls.find((entry) => entry.importName === exportName) ?? calls[0])?.call
  if (!call) {
    if (kind === 'adapter') return { reason: `${edit.plugin} is not the config's adapter` }
    const disabled = kind === 'plugin' && disabledBlocks(source, config).some((block) => block.packageName === edit.plugin)
    return { reason: disabled ? `${edit.plugin} is disabled, enable it first` : `${edit.plugin} is not in the ${kind}s array` }
  }
  return edit.operation === 'set' ? applySet(source, call, edit.path, edit.value, quote) : applyRemove(source, call, edit.path)
}

/**
 * Applies edits to a `kubb.config.ts` in place. Each edit rewrites only the text it targets, so
 * comments, formatting, and hand-written code around the config survive.
 *
 * Edits are independent: one that cannot be applied is reported in `outcomes` and the rest still run.
 *
 * @example
 * ```ts
 * const { source, outcomes } = applyConfigEdits({
 *   source: current,
 *   edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }],
 * })
 * ```
 */
export function applyConfigEdits({ source, edits, extensions = new Map() }: { source: string; edits: Array<ConfigEdit>; extensions?: InstalledExtensions }): {
  source: string
  outcomes: Array<ConfigEditOutcome>
  changed: boolean
} {
  let current = source
  const quote: Quote = detectCodeFormat(source).quote === 'double' ? `"` : `'`

  const outcomes = edits.map((edit): ConfigEditOutcome => {
    const invalid = invalidEdit(edit)
    if (invalid) return { edit, applied: false, reason: invalid }

    try {
      const result = applyEdit({ source: current, edit, quote, extensions })
      if ('reason' in result) return { edit, applied: false, reason: result.reason }
      current = result.source
      return { edit, applied: true }
    } catch (error) {
      return { edit, applied: false, reason: getErrorMessage(error) }
    }
  })

  return { source: current, outcomes, changed: current !== source }
}

/**
 * Applies `edits` to the config file at `filePath`, writing it only when something changed.
 * `add-plugin` accepts `@kubb/plugin-*` packages and the plugins in `extensions`.
 */
export async function writeConfigEdits({ filePath, edits, extensions }: { filePath: string; edits: Array<ConfigEdit>; extensions?: InstalledExtensions }) {
  const current = await read(filePath)
  const result = applyConfigEdits({ source: current, edits, extensions })
  if (result.changed) await writeFile(filePath, result.source, 'utf-8')
  return result
}
