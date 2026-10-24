import type { ExtensionKind } from '@kubb/core'
import { getErrorMessage, read, writeRaw } from '@internals/utils'
import {
  type AssignmentExpression,
  type BindingProperty,
  type CallExpression,
  type Comment,
  type Expression,
  type ObjectExpression,
  type ObjectPropertyKind,
  type Program,
  type RestElement,
  type SpreadElement,
  nodeTypes,
  parseExpression,
  parseSource,
} from './ast.ts'
import { isAllowedPlugin, isOptionValue, isOutputKey, isOutputValue, isSafeKey, pickOutput, toExportName } from './rules.ts'
import { appendItem, getPosition, IDENTIFIER_PATTERN, printKey, printValue, type Quote, removeProperty, replaceText, wrapPath } from './text.ts'
import {
  type ConfigEdit,
  ConfigEditOperation,
  type ConfigEditOutcome,
  type ConfigFileView,
  type ConfigView,
  type InstalledExtensions,
  type OptionsView,
  type OptionValue,
  type PluginView,
} from './types.ts'

/** The marker `disable-plugin` writes, with the block's line count so `enable-plugin` restores exactly those lines. */
const DISABLED_MARKER_PATTERN = /^kubb:disabled (.+)\s+(\d+)$/

const OPERATIONS = new Set<string>(Object.values(ConfigEditOperation))
const KINDS = new Set<string>(['plugin', 'adapter', 'parser'])

const moduleKinds = { esm: 'esm', cjs: 'cjs' } as const
type ModuleKind = (typeof moduleKinds)[keyof typeof moduleKinds]
type EditResult = { source: string } | { reason: string }
type ParsedConfig = { program: Program; comments: Array<Comment>; configs: Array<ObjectExpression>; kind: ModuleKind }
type ValueNode = Expression | SpreadElement | null | undefined

/** Edits cross the wire, so their shape is checked before anything reads them. */
function validateEdit(edit: ConfigEdit): string | undefined {
  const { operation, plugin, config, path, kind, input } = (typeof edit === 'object' && edit !== null ? edit : {}) as Record<string, unknown>

  if (typeof operation !== 'string' || !OPERATIONS.has(operation)) return `unknown operation ${JSON.stringify(operation)}`
  if (config !== undefined && typeof config !== 'string' && !Number.isSafeInteger(config)) return 'config must name an entry or give its index'
  if (operation === ConfigEditOperation.SET_INPUT) return typeof input === 'string' && input.trim() ? undefined : 'the edit names no input'
  const isOutput = operation === ConfigEditOperation.SET_OUTPUT || operation === ConfigEditOperation.REMOVE_OUTPUT
  if (!isOutput && (typeof plugin !== 'string' || !plugin)) return 'the edit names no plugin'
  if (kind !== undefined && (typeof kind !== 'string' || !KINDS.has(kind))) return `unknown kind ${JSON.stringify(kind)}`
  if (kind !== undefined && operation !== ConfigEditOperation.SET_OPTION && operation !== ConfigEditOperation.REMOVE_OPTION)
    return `${operation} edits the plugins array, so it takes no kind`
  if (isOutput || operation === ConfigEditOperation.SET_OPTION || operation === ConfigEditOperation.REMOVE_OPTION) {
    if (!Array.isArray(path) || !path.every((key) => typeof key === 'string' && key)) return 'path must be a list of option names'
    if (!path.length) return 'no option path given'
    const unsafe = path.find((key: string) => !isSafeKey(key))
    if (unsafe !== undefined) return `${unsafe} cannot be used as an option name`
    if (isOutput && !isOutputKey(path[0])) return `output.${path[0]} can only be changed in the config file`
  }
  return undefined
}

/** Steps through `as`/`satisfies` and `() => ...` wrappers to the config object. */
function unwrapValue(node: ValueNode): ValueNode {
  if (!node) return undefined
  if (node.type === nodeTypes.tSAsExpression || node.type === nodeTypes.tSSatisfiesExpression) return unwrapValue(node.expression)
  if (node.type !== nodeTypes.arrowFunctionExpression && node.type !== nodeTypes.functionExpression) return node
  if (node.body?.type !== nodeTypes.blockStatement) return unwrapValue(node.body as Expression | null)

  const returned = node.body.body.find((statement) => statement.type === nodeTypes.returnStatement)
  return unwrapValue(returned?.type === nodeTypes.returnStatement ? returned.argument : undefined)
}

function isModuleExports(node: AssignmentExpression['left']): boolean {
  return (
    node.type === nodeTypes.memberExpression &&
    !node.computed &&
    node.object.type === nodeTypes.identifier &&
    node.object.name === 'module' &&
    node.property.type === nodeTypes.identifier &&
    node.property.name === 'exports'
  )
}

/** Every config object in `export default` or `module.exports = defineConfig(...)`, or why the file is unmanaged. */
function findConfigs(source: string): ParsedConfig | { reason: string } {
  const parsed = parseSource(source)
  if ('reason' in parsed) return parsed

  let exported: ValueNode
  let kind: ModuleKind = moduleKinds.esm
  for (const node of parsed.program.body) {
    if (node.type === nodeTypes.exportDefaultDeclaration) {
      // A `function` or `class` declaration is never a `defineConfig(...)` call, so the check below refuses it.
      exported = node.declaration as Expression
      break
    }
    if (node.type === nodeTypes.expressionStatement && node.expression.type === nodeTypes.assignmentExpression && isModuleExports(node.expression.left)) {
      exported = node.expression.right
      kind = moduleKinds.cjs
      break
    }
  }

  const value = unwrapValue(exported)
  if (!value) return { reason: 'no `export default` or `module.exports` found' }
  if (value.type !== nodeTypes.callExpression || value.callee.type !== nodeTypes.identifier || value.callee.name !== 'defineConfig') {
    return { reason: 'the exported config is not a defineConfig(...) call' }
  }

  const argument = unwrapValue(value.arguments[0])
  if (!argument) return { reason: 'defineConfig(...) was called without a config' }

  const entries = argument.type === nodeTypes.arrayExpression ? argument.elements.map((element) => unwrapValue(element)) : [argument]
  const configs = entries.filter((entry): entry is ObjectExpression => entry?.type === nodeTypes.objectExpression)
  if (configs.length !== entries.length) return { reason: 'config is not an object literal' }

  return { ...parsed, configs, kind }
}

function getKey(entry: ObjectPropertyKind | BindingProperty | RestElement): string | undefined {
  if (entry.type !== nodeTypes.property || entry.computed) return undefined
  if (entry.key.type === nodeTypes.identifier) return entry.key.name
  return entry.key.type === nodeTypes.literal && typeof entry.key.value === 'string' ? entry.key.value : undefined
}

/** The last one wins when the key repeats, as at runtime. */
function findProperty(node: ObjectExpression, key: string): { member: ObjectPropertyKind; index: number } | undefined {
  const index = node.properties.findLastIndex((entry) => getKey(entry) === key)
  return index === -1 ? undefined : { member: node.properties[index]!, index }
}

function getValue(node: ObjectExpression, key: string): ValueNode {
  const member = findProperty(node, key)?.member
  return member?.type === nodeTypes.property ? member.value : member
}

function getConfigName(config: ObjectExpression): string | undefined {
  const name = getValue(config, 'name')
  return name?.type === nodeTypes.literal && typeof name.value === 'string' ? name.value : undefined
}

function isOverridden(node: ObjectExpression, index: number): boolean {
  return node.properties.slice(index + 1).some((entry) => entry.type === nodeTypes.spreadElement)
}

/** A literal's value, `undefined` for code. */
function readLiteral(node: ValueNode): OptionValue | undefined {
  switch (node?.type) {
    case nodeTypes.literal:
      // A bigint or a regex is code, not a value JSON can carry. A regex Node cannot compile also has a `null` value.
      return 'regex' in node || 'bigint' in node ? undefined : (node.value as OptionValue)
    case nodeTypes.templateLiteral:
      return node.expressions.length ? undefined : (node.quasis[0]?.value.cooked ?? '')
    case nodeTypes.unaryExpression: {
      const value = readLiteral(node.argument)
      if (typeof value !== 'number') return undefined
      return node.operator === '-' ? -value : node.operator === '+' ? value : undefined
    }
    case nodeTypes.arrayExpression: {
      const values = node.elements.map((element) => readLiteral(element))
      return values.every((value) => value !== undefined) ? values : undefined
    }
    case nodeTypes.objectExpression: {
      const entries: Record<string, OptionValue> = {}
      for (const entry of node.properties) {
        if (entry.type !== nodeTypes.property) return undefined
        const key = getKey(entry)
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

function getRequirePath(node: ValueNode): string | undefined {
  if (node?.type !== nodeTypes.callExpression || node.callee.type !== nodeTypes.identifier || node.callee.name !== 'require') return undefined
  const [argument] = node.arguments
  return argument?.type === nodeTypes.literal && typeof argument.value === 'string' ? argument.value : undefined
}

type Import = { from: string; exported: string }

function getImports(program: Program): Map<string, Import> {
  const imports = new Map<string, Import>()

  for (const statement of program.body) {
    if (statement.type === nodeTypes.importDeclaration) {
      for (const specifier of statement.specifiers) {
        // A default or namespace import has no exported name of its own, so its local name stands in.
        const imported = specifier.type === nodeTypes.importSpecifier ? specifier.imported : specifier.local
        imports.set(specifier.local.name, { from: statement.source.value, exported: imported.type === nodeTypes.identifier ? imported.name : imported.value })
      }
      continue
    }
    if (statement.type !== nodeTypes.variableDeclaration) continue
    for (const declarator of statement.declarations) {
      const from = getRequirePath(declarator.init)
      if (from === undefined || declarator.id.type !== nodeTypes.objectPattern) continue
      for (const entry of declarator.id.properties) {
        if (entry.type === nodeTypes.property && entry.value.type === nodeTypes.identifier) {
          imports.set(entry.value.name, { from, exported: getKey(entry) ?? entry.value.name })
        }
      }
    }
  }
  return imports
}

function detectQuote(node: unknown): Quote | undefined {
  if (!node || typeof node !== 'object') return undefined
  const { type, raw } = node as { type?: string; raw?: unknown }
  if (type === nodeTypes.literal && typeof raw === 'string' && (raw[0] === `'` || raw[0] === `"`)) return raw[0]
  for (const child of Object.values(node)) {
    const quote = detectQuote(child)
    if (quote) return quote
  }
  return undefined
}

function findCalls(
  program: Program,
  config: ObjectExpression,
  kind: ExtensionKind = 'plugin',
): Array<{ importName: string; exportName: string; packageName: string; call: CallExpression }> {
  const node = getValue(config, kind === 'adapter' ? 'adapter' : `${kind}s`)
  const elements = kind === 'adapter' ? [node] : node?.type === nodeTypes.arrayExpression ? node.elements : []

  const imports = getImports(program)
  return elements.flatMap((element) => {
    if (element?.type !== nodeTypes.callExpression || element.callee.type !== nodeTypes.identifier) return []
    const imported = imports.get(element.callee.name)
    return imported ? [{ importName: element.callee.name, exportName: imported.exported, packageName: imported.from, call: element }] : []
  })
}

/** The `disable-plugin` blocks in this config, read from marker comments since the call is no longer a node. */
function findDisabled(
  source: string,
  comments: Array<Comment>,
  config: ObjectExpression,
): Array<{ packageName: string; line: number; end: number; code: Array<string> }> {
  const lines = source.split('\n')

  return comments.flatMap((comment) => {
    const match = comment.type === nodeTypes.lineComment ? comment.value.trim().match(DISABLED_MARKER_PATTERN) : null
    // Only markers inside this entry, so an array config never touches another entry's plugin.
    if (!match || comment.start < config.start || comment.end > config.end) return []
    // A marker shares its line with nothing, so a trailing `// kubb:disabled ...` after code is not one.
    if (source.slice(source.lastIndexOf('\n', comment.start - 1) + 1, comment.start).trim()) return []

    const line = getPosition(source, comment.start).line
    const end = line + Number(match[2])
    const code = lines.slice(line, end).map((text) => text.replace(/^(\s*)\/\/ ?/, '$1').replace(/^\s+$/, ''))
    return [{ packageName: match[1]!, line, end, code }]
  })
}

/** Literal members as `value` and code paths as `locked`, `undefined` for a computed key. */
function readEditable(node: ObjectExpression, prefix: Array<string> = []): { value: Record<string, OptionValue>; locked: Array<Array<string>> } | undefined {
  const value: Record<string, OptionValue> = {}
  const locked: Array<Array<string>> = []

  for (const [index, entry] of node.properties.entries()) {
    if (entry.type === nodeTypes.spreadElement) continue
    const key = getKey(entry)
    if (key === undefined) return undefined
    if (findProperty(node, key)?.index !== index) continue

    const path = [...prefix, key]
    // A `__proto__` key replaces the prototype, so it reads as code.
    if (!isSafeKey(key)) {
      locked.push(path)
      continue
    }
    const member = !isOverridden(node, index) ? entry.value : undefined
    const literal = readLiteral(member)
    if (literal !== undefined) {
      value[key] = literal
      continue
    }
    if (member?.type !== nodeTypes.objectExpression) {
      locked.push(path)
      continue
    }
    const nested = readEditable(member, path)
    if (!nested) return undefined
    value[key] = nested.value
    locked.push(...nested.locked)
  }
  return { value, locked }
}

function readCallOptions(call: CallExpression): OptionsView {
  const options = call.arguments[0]
  return options?.type === nodeTypes.objectExpression ? readObjectOptions(options) : {}
}

function readObjectOptions(options: ObjectExpression): OptionsView {
  const entries: OptionsView = {}
  for (const [index, entry] of options.properties.entries()) {
    const key = getKey(entry)
    if (key === undefined || !isSafeKey(key)) continue
    const member = entry.type === nodeTypes.property && !isOverridden(options, index) ? entry.value : undefined
    const value = readLiteral(member)
    const partial = value === undefined && member?.type === nodeTypes.objectExpression ? readEditable(member) : undefined
    entries[key] = value !== undefined ? { literal: true, value } : { literal: false, ...partial }
  }
  return entries
}

function readDisabledOptions(code: Array<string>): OptionsView {
  const call = parseExpression(code.join('\n').trim().replace(/,$/, ''))
  return call?.type === nodeTypes.callExpression ? readCallOptions(call) : {}
}

/** Which plugins the file declares and which options Studio may write. */
export function readConfig(source: string): ConfigFileView {
  const parsed = findConfigs(source)
  if ('reason' in parsed) return { managed: false, reason: parsed.reason }

  const { program, comments, configs } = parsed
  const importNames = new Map([...getImports(program)].map(([local, { from }]) => [from, local]))

  return {
    managed: true,
    configs: configs.map((config): ConfigView => {
      const active = findCalls(program, config).map(({ importName, packageName, call }) => ({
        line: getPosition(source, call.start).line,
        plugin: { importName, packageName, options: readCallOptions(call) },
      }))
      const disabled = findDisabled(source, comments, config).map(({ packageName, line, code }) => ({
        line,
        plugin: {
          importName: importNames.get(packageName) ?? toExportName(packageName),
          packageName,
          options: readDisabledOptions(code),
          disabled: true as const,
        },
      }))

      const plugins = [...active, ...disabled].sort((a, b) => a.line - b.line).map(({ plugin }) => plugin)
      const toView = ({ importName, packageName, call }: ReturnType<typeof findCalls>[number]): PluginView => ({
        importName,
        packageName,
        options: readCallOptions(call),
      })
      const [adapter] = findCalls(program, config, 'adapter').map(toView)
      const parsers = findCalls(program, config, 'parser').map(toView)
      const output = getOutput(config)
      return {
        name: getConfigName(config),
        plugins,
        ...(adapter && { adapter }),
        ...(parsers.length ? { parsers } : {}),
        ...(!('reason' in output) && { output: pickOutput(readObjectOptions(output.object)) }),
      }
    }),
  }
}

/** The modules the file imports, empty when it cannot be parsed. */
export function readImports(source: string): Array<string> {
  const parsed = parseSource(source)
  if ('reason' in parsed) return []
  return [...new Set([...getImports(parsed.program).values()].map(({ from }) => from))]
}

/** Follows `path` to its literal, or to the first missing key. Refuses a value set in code. */
function findPath(
  options: ObjectExpression,
  path: Array<string>,
): { object: ObjectExpression; index: number; value: Expression } | { object: ObjectExpression; missing: number } | { reason: string } {
  let object = options

  for (const [depth, key] of path.entries()) {
    const found = findProperty(object, key)
    if (!found) return { object, missing: depth }
    if (isOverridden(object, found.index)) {
      return { reason: `${path.slice(0, depth + 1).join('.')} can be overridden by a spread after it, so it is customized in code` }
    }

    const { member, index } = found
    if (depth === path.length - 1) {
      return member.type === nodeTypes.property && readLiteral(member.value) !== undefined
        ? { object, index, value: member.value }
        : { reason: `${path.join('.')} is customized in code` }
    }
    if (member.type !== nodeTypes.property || member.value.type !== nodeTypes.objectExpression)
      return { reason: `${key} is not an object, so ${path.join('.')} cannot be reached` }
    object = member.value
  }
  return { reason: 'no option path given' }
}

function setOption(source: string, call: CallExpression, path: Array<string>, value: unknown, quote: Quote): EditResult {
  if (!isOptionValue(value)) return { reason: 'the value is not a literal that can be written to a config file' }

  const options = call.arguments[0]
  if (!options) {
    const closing = call.end - 1
    if (source[closing] !== ')') return { reason: 'the factory call could not be located in the file' }
    return { source: replaceText(source, closing, closing, printValue(wrapPath(path, value), quote)) }
  }
  if (options.type !== nodeTypes.objectExpression) return { reason: 'the factory was not called with an object literal' }
  return setAtPath({ source, options, path, value, quote })
}

function setAtPath({
  source,
  options,
  path,
  value,
  quote,
}: {
  source: string
  options: ObjectExpression
  path: Array<string>
  value: OptionValue
  quote: Quote
}): EditResult {
  const target = findPath(options, path)
  if ('reason' in target) return target
  if ('missing' in target) {
    const [key, ...rest] = path.slice(target.missing)
    return { source: appendItem(source, target.object, `${printKey(key!, quote)}: ${printValue(wrapPath(rest, value), quote)}`) }
  }
  return { source: replaceText(source, target.value.start, target.value.end, printValue(value, quote)) }
}

function setInput(source: string, config: ObjectExpression, input: string, quote: Quote): EditResult {
  const value = printValue(input, quote)
  const found = findProperty(config, 'input')
  if (!found) return { source: appendItem(source, config, `input: ${value}`) }
  if (found.member.type !== nodeTypes.property || found.member.method || found.member.shorthand || found.member.kind !== 'init')
    return { reason: 'input is not a plain property' }
  if (isOverridden(config, found.index)) return { reason: 'a spread after input could override it' }
  return { source: replaceText(source, found.member.value.start, found.member.value.end, value) }
}

function getOutput(config: ObjectExpression): { object: ObjectExpression } | { reason: string } {
  const found = findProperty(config, 'output')
  if (found?.member.type !== nodeTypes.property || found.member.value.type !== nodeTypes.objectExpression) return { reason: 'output is not an object literal' }
  if (isOverridden(config, found.index)) return { reason: 'a spread after output could override it' }
  return { object: found.member.value }
}

function editOutput({
  source,
  config,
  edit,
  quote,
}: {
  source: string
  config: ObjectExpression
  edit: Extract<ConfigEdit, { operation: typeof ConfigEditOperation.SET_OUTPUT | typeof ConfigEditOperation.REMOVE_OUTPUT }>
  quote: Quote
}): EditResult {
  const output = getOutput(config)
  if ('reason' in output) return output
  if (edit.operation === ConfigEditOperation.REMOVE_OUTPUT) return removeAtPath({ source, options: output.object, path: edit.path })
  if (!isOptionValue(edit.value) || !isOutputValue({ key: edit.path[0]!, value: wrapPath(edit.path.slice(1), edit.value) }))
    return { reason: `the value is not one output.${edit.path[0]} takes` }
  return setAtPath({ source, options: output.object, path: edit.path, value: edit.value, quote })
}

function removeOption(source: string, call: CallExpression, path: Array<string>): EditResult {
  const options = call.arguments[0]
  if (!options) return { source }
  if (options.type !== nodeTypes.objectExpression) return { reason: 'the factory was not called with an object literal' }
  return removeAtPath({ source, options, path })
}

function removeAtPath({ source, options, path }: { source: string; options: ObjectExpression; path: Array<string> }): EditResult {
  const target = findPath(options, path)
  if ('reason' in target) return target
  if ('missing' in target) return { source }
  return { source: removeProperty(source, target.object, target.index) }
}

/** Adds the import after the last one, matching its semicolon style. */
function addImport({
  source,
  parsed,
  importName,
  moduleSpecifier,
  quote,
}: {
  source: string
  parsed: ParsedConfig
  importName: string
  moduleSpecifier: string
  quote: Quote
}): string {
  const lastImport = parsed.program.body.findLast((node) =>
    parsed.kind === moduleKinds.esm
      ? node.type === nodeTypes.importDeclaration
      : node.type === nodeTypes.variableDeclaration && node.declarations.some((declarator) => getRequirePath(declarator.init) !== undefined),
  )
  const afterLine = lastImport ? getPosition(source, lastImport.end).line : 0
  const lines = source.split('\n')

  const semicolon = afterLine > 0 && lines[afterLine - 1]?.trimEnd().endsWith(';') ? ';' : ''
  const specifier = `${quote}${moduleSpecifier}${quote}`
  lines.splice(
    afterLine,
    0,
    parsed.kind === moduleKinds.esm ? `import { ${importName} } from ${specifier}${semicolon}` : `const { ${importName} } = require(${specifier})${semicolon}`,
  )
  if (afterLine === 0) lines.splice(1, 0, '')

  return lines.join('\n')
}

/** Replaying the same add is a no-op, while an import name taken by another package is an error. */
function addPlugin({
  source,
  parsed,
  config,
  edit,
  quote,
  extensions,
}: {
  source: string
  parsed: ParsedConfig
  config: ObjectExpression
  edit: Extract<ConfigEdit, { operation: typeof ConfigEditOperation.ADD_PLUGIN }>
  quote: Quote
  extensions: InstalledExtensions
}): EditResult {
  if (!isAllowedPlugin({ packageName: edit.plugin, extensions })) {
    return { reason: `"${edit.plugin}" is not a @kubb/plugin-* package or an installed Kubb plugin` }
  }

  const importName = extensions.get(edit.plugin)?.manifest.export ?? toExportName(edit.plugin)
  if (!IDENTIFIER_PATTERN.test(importName)) return { reason: `"${importName}" is not a valid import name` }
  if (findCalls(parsed.program, config).some((plugin) => plugin.packageName === edit.plugin)) return { source }

  const taken = getImports(parsed.program).get(importName)?.from
  if (taken && taken !== edit.plugin) return { reason: `${importName} is already imported from ${taken}` }

  const options = edit.options ?? {}
  if (!isOptionValue(options)) return { reason: 'the options are not literals that can be written to a config file' }

  const plugins = getValue(config, 'plugins')
  if (plugins?.type !== nodeTypes.arrayExpression) return { reason: 'plugins is not an array literal' }

  // The array sits below the imports, so adding to it first leaves the import lines where they are.
  const next = appendItem(source, plugins, `${importName}(${Object.keys(options).length ? printValue(options, quote) : ''})`)
  return { source: taken ? next : addImport({ source: next, parsed, importName, moduleSpecifier: edit.plugin, quote }) }
}

/** One item per line, so a call can be commented out alone. Skipped when comments sit between items. */
function splitPlugins(source: string, config: ObjectExpression): string | undefined {
  const array = getValue(config, 'plugins')
  if (array?.type !== nodeTypes.arrayExpression) return undefined

  const items = array.elements.flatMap((element) => (element ? [element] : []))
  const { start, end } = array
  const gaps = [source.slice(start + 1, items[0]?.start ?? end - 1), ...items.map((item, index) => source.slice(item.end, items[index + 1]?.start ?? end - 1))]
  if (!items.length || gaps.some((gap) => !/^[\s,]*$/.test(gap))) return undefined

  const lineStart = source.lastIndexOf('\n', start - 1) + 1
  const indent = source.slice(lineStart).match(/^[ \t]*/)?.[0] ?? ''
  const lines = items.map((item) => `${indent}  ${source.slice(item.start, item.end)},`)

  return replaceText(source, start, end, `[\n${lines.join('\n')}\n${indent}]`)
}

function disablePlugin(source: string, program: Program, config: ObjectExpression, plugin: string): EditResult {
  const call = findCalls(program, config).find((entry) => entry.packageName === plugin)?.call
  if (!call) return { reason: `${plugin} is not in the plugins array` }

  const start = getPosition(source, call.start)
  const end = getPosition(source, call.end)
  const lines = source.split('\n')
  const from = start.line - 1
  const to = end.line - 1
  const firstLine = lines[from] ?? ''

  // Only safe when the call sits alone on its lines: anything else on its first line, or on its last
  // line besides a trailing comma, would be swallowed into the comment and corrupt the file.
  if (firstLine.slice(0, start.column).trim() || !/^,?\s*$/.test((lines[to] ?? '').slice(end.column))) {
    return { reason: `${plugin} shares a line with other code, so it cannot be commented out safely` }
  }

  const indent = firstLine.match(/^\s*/)?.[0] ?? ''
  const commented = lines.slice(from, to + 1).map((line) => (line.trim() ? `${indent}// ${line.slice(indent.length)}` : `${indent}//`))
  lines.splice(from, commented.length, `${indent}// kubb:disabled ${plugin} ${commented.length}`, ...commented)

  return { source: lines.join('\n') }
}

function enablePlugin(source: string, comments: Array<Comment>, config: ObjectExpression, plugin: string): EditResult {
  const block = findDisabled(source, comments, config).find((entry) => entry.packageName === plugin)
  if (!block) return { reason: `${plugin} is not disabled` }

  const lines = source.split('\n')
  lines.splice(block.line - 1, block.end - block.line + 1, ...block.code)
  return { source: lines.join('\n') }
}

/** Every edit re-parses the file, since the previous one rewrote it. */
function applyEdit({ source, edit, extensions }: { source: string; edit: ConfigEdit; extensions: InstalledExtensions }): EditResult {
  const parsed = findConfigs(source)
  if ('reason' in parsed) return parsed

  const ref = edit.config
  const findConfig = (entries: ParsedConfig) =>
    typeof ref === 'string' ? entries.configs.find((entry) => getConfigName(entry) === ref) : entries.configs[ref ?? 0]
  const config = findConfig(parsed)
  if (!config) return { reason: `no config entry found for ${JSON.stringify(ref)}` }
  const quote = detectQuote(parsed.program) ?? `'`

  if (edit.operation === ConfigEditOperation.SET_INPUT) return setInput(source, config, edit.input, quote)
  if (edit.operation === ConfigEditOperation.SET_OUTPUT || edit.operation === ConfigEditOperation.REMOVE_OUTPUT)
    return editOutput({ source, config, edit, quote })
  if (edit.operation === ConfigEditOperation.DISABLE_PLUGIN) {
    const result = disablePlugin(source, parsed.program, config, edit.plugin)
    if (!('reason' in result) || !result.reason.includes('shares a line')) return result

    // A one-line `plugins: [a(), b()]`, which is also what `add-plugin` writes, gets one item per line first.
    const split = splitPlugins(source, config)
    const reparsed = split === undefined ? undefined : findConfigs(split)
    const reparsedConfig = reparsed && !('reason' in reparsed) ? findConfig(reparsed) : undefined
    return split !== undefined && reparsed && !('reason' in reparsed) && reparsedConfig
      ? disablePlugin(split, reparsed.program, reparsedConfig, edit.plugin)
      : result
  }
  if (edit.operation === ConfigEditOperation.ENABLE_PLUGIN) return enablePlugin(source, parsed.comments, config, edit.plugin)
  if (edit.operation === ConfigEditOperation.ADD_PLUGIN) return addPlugin({ source, parsed, config, edit, quote, extensions })

  const kind = edit.kind ?? 'plugin'
  // A package can ship several factories (`parserTs`, `parserTsx`), so prefer the export its manifest names.
  const calls = findCalls(parsed.program, config, kind).filter((entry) => entry.packageName === edit.plugin)
  const exportName = extensions.get(edit.plugin)?.manifest.export ?? toExportName(edit.plugin)
  const call = (calls.find((entry) => entry.exportName === exportName) ?? calls[0])?.call
  if (!call) {
    if (kind === 'adapter') return { reason: `${edit.plugin} is not the config's adapter` }
    const disabled = kind === 'plugin' && findDisabled(source, parsed.comments, config).some((block) => block.packageName === edit.plugin)
    return { reason: disabled ? `${edit.plugin} is disabled, enable it first` : `${edit.plugin} is not in the ${kind}s array` }
  }
  return edit.operation === ConfigEditOperation.SET_OPTION ? setOption(source, call, edit.path, edit.value, quote) : removeOption(source, call, edit.path)
}

/** Applies edits in place, touching only the text each targets. A refused edit is reported and the rest still run. */
export function editConfig({ source, edits, extensions = new Map() }: { source: string; edits: Array<ConfigEdit>; extensions?: InstalledExtensions }): {
  source: string
  outcomes: Array<ConfigEditOutcome>
  changed: boolean
} {
  let current = source

  const outcomes = edits.map((edit): ConfigEditOutcome => {
    const invalid = validateEdit(edit)
    if (invalid) return { edit, applied: false, reason: invalid }

    try {
      const result = applyEdit({ source: current, edit, extensions })
      if ('reason' in result) return { edit, applied: false, reason: result.reason }
      current = result.source
      return { edit, applied: true }
    } catch (error) {
      return { edit, applied: false, reason: getErrorMessage(error) }
    }
  })

  return { source: current, outcomes, changed: current !== source }
}

/** Applies `edits` to `filePath`, writing only when something changed. */
export async function editConfigFile({ filePath, edits, extensions }: { filePath: string; edits: Array<ConfigEdit>; extensions?: InstalledExtensions }) {
  const current = await read(filePath)
  const result = editConfig({ source: current, edits, extensions })
  if (result.changed) await writeRaw(filePath, result.source)
  return result
}
