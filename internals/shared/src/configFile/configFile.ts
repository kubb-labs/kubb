import type { ExtensionKind } from '@kubb/core'
import { getErrorMessage, read, writeRaw } from '@internals/utils'
import {
  type AssignmentExpression,
  type BindingProperty,
  type CallExpression,
  type Comment,
  type Expression,
  type ImportDeclaration,
  type ObjectExpression,
  type ObjectPropertyKind,
  type Program,
  type RestElement,
  type SpreadElement,
  type VariableDeclaration,
  parseExpression,
  parseSource,
} from './ast.ts'
import { isAllowedPlugin, isOptionValue, isOutputKey, isOutputValue, isSafeKey, pickOutput, toExportName } from './rules.ts'
import { appendItem, getPosition, IDENTIFIER_PATTERN, printKey, printValue, quotes, type Quote, removeItem, replaceText, wrapPath } from './text.ts'
import {
  type ConfigEdit,
  ConfigEditOperation,
  type ConfigEditOutcome,
  type ConfigFileView,
  type ConfigRef,
  type ConfigView,
  extensionKinds,
  type InstalledExtensions,
  type OptionsView,
  type OptionValue,
  type PluginView,
} from './types.ts'

/** The marker `disable-plugin` writes, with the block's line count so `enable-plugin` restores exactly those lines. */
const DISABLED_MARKER_PATTERN = /^kubb:disabled (.+)\s+(\d+)$/

const OPERATIONS = new Set<string>(Object.values(ConfigEditOperation))
const OPTION_OPERATIONS = new Set<string>([ConfigEditOperation.SET_OPTION, ConfigEditOperation.REMOVE_OPTION])
const OUTPUT_OPERATIONS = new Set<string>([ConfigEditOperation.SET_OUTPUT, ConfigEditOperation.REMOVE_OUTPUT])
const KINDS = new Set<string>(Object.values(extensionKinds))

/** Identifiers the editor matches by name. */
const identifiers = { defineConfig: 'defineConfig', require: 'require', module: 'module', exports: 'exports' } as const

const moduleKinds = { esm: 'esm', cjs: 'cjs' } as const
type ModuleKind = (typeof moduleKinds)[keyof typeof moduleKinds]

type EditResult = { source: string } | { reason: string }
type ParsedConfig = { program: Program; comments: Array<Comment>; configs: Array<ObjectExpression>; kind: ModuleKind }
type ValueNode = Expression | SpreadElement | null | undefined
type Import = { from: string; exported: string }
type FactoryCall = { importName: string; exportName: string; packageName: string; call: CallExpression }
type DisabledBlock = { packageName: string; line: number; end: number; code: Array<string> }
type OutputEdit = Extract<ConfigEdit, { operation: typeof ConfigEditOperation.SET_OUTPUT | typeof ConfigEditOperation.REMOVE_OUTPUT }>
type OptionEdit = Extract<ConfigEdit, { operation: typeof ConfigEditOperation.SET_OPTION | typeof ConfigEditOperation.REMOVE_OPTION }>
type AddPluginEdit = Extract<ConfigEdit, { operation: typeof ConfigEditOperation.ADD_PLUGIN }>
type DisablePluginEdit = Extract<ConfigEdit, { operation: typeof ConfigEditOperation.DISABLE_PLUGIN }>
type RemoveExtensionEdit = Extract<ConfigEdit, { operation: typeof ConfigEditOperation.REMOVE_EXTENSION }>

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}

/** Edits cross the wire, so their shape is checked before anything reads them. */
function validateEdit(edit: ConfigEdit): string | undefined {
  const { operation, plugin, config, path, kind, input } = (typeof edit === 'object' && edit !== null ? edit : {}) as Record<string, unknown>

  if (typeof operation !== 'string' || !OPERATIONS.has(operation)) return `unknown operation ${JSON.stringify(operation)}`
  if (config !== undefined && typeof config !== 'string' && !Number.isSafeInteger(config)) return 'config must name an entry or give its index'

  if (operation === ConfigEditOperation.SET_INPUT) {
    return typeof input === 'string' && input.trim() !== '' ? undefined : 'the edit names no input'
  }

  const isOption = OPTION_OPERATIONS.has(operation)
  const isOutput = OUTPUT_OPERATIONS.has(operation)

  if (!isOutput && !isNonEmptyString(plugin)) return 'the edit names no plugin'

  if (kind !== undefined) {
    if (typeof kind !== 'string' || !KINDS.has(kind)) return `unknown kind ${JSON.stringify(kind)}`
    const takesKind = operation === ConfigEditOperation.ADD_PLUGIN || operation === ConfigEditOperation.REMOVE_EXTENSION
    if (takesKind && kind === extensionKinds.adapter) return `${operation} takes a plugin or a parser, since a config has one adapter`
    if (!isOption && !takesKind) return `${operation} edits the plugins array, so it takes no kind`
  }

  if (!isOption && !isOutput) return undefined

  if (!Array.isArray(path) || !path.every(isNonEmptyString)) return 'path must be a list of option names'
  if (path.length === 0) return 'no option path given'

  const unsafe = path.find((key) => !isSafeKey(key))
  if (unsafe !== undefined) return `${unsafe} cannot be used as an option name`

  if (isOutput && !isOutputKey(path[0]!)) return `output.${path[0]} can only be changed in the config file`

  return undefined
}

// Finding the config

/** Steps through `as`/`satisfies` and `() => ...` wrappers to the config object. */
function unwrapValue(node: ValueNode): ValueNode {
  if (!node) return undefined
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') return unwrapValue(node.expression)
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') return node
  if (node.body?.type !== 'BlockStatement') return unwrapValue(node.body as Expression | null)

  const returned = node.body.body.find((statement) => statement.type === 'ReturnStatement')
  return unwrapValue(returned?.type === 'ReturnStatement' ? returned.argument : undefined)
}

function isModuleExports(node: AssignmentExpression['left']): boolean {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === identifiers.module &&
    node.property.type === 'Identifier' &&
    node.property.name === identifiers.exports
  )
}

/** The exported config value and how the file exports it. */
function findExport(program: Program): { exported: ValueNode; kind: ModuleKind } {
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      // A `function` or `class` declaration is never a `defineConfig(...)` call, so `findConfigs` refuses it.
      return { exported: node.declaration as Expression, kind: moduleKinds.esm }
    }
    if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && isModuleExports(node.expression.left)) {
      return { exported: node.expression.right, kind: moduleKinds.cjs }
    }
  }
  return { exported: undefined, kind: moduleKinds.esm }
}

/** Every config object in `export default` or `module.exports = defineConfig(...)`, or why the file is unmanaged. */
function findConfigs(source: string): ParsedConfig | { reason: string } {
  const parsed = parseSource(source)
  if ('reason' in parsed) return parsed

  const { exported, kind } = findExport(parsed.program)
  const value = unwrapValue(exported)
  if (!value) return { reason: 'no `export default` or `module.exports` found' }
  if (value.type !== 'CallExpression' || value.callee.type !== 'Identifier' || value.callee.name !== identifiers.defineConfig) {
    return { reason: 'the exported config is not a defineConfig(...) call' }
  }

  const argument = unwrapValue(value.arguments[0])
  if (!argument) return { reason: 'defineConfig(...) was called without a config' }

  const entries = argument.type === 'ArrayExpression' ? argument.elements.map((element) => unwrapValue(element)) : [argument]
  const configs = entries.filter((entry): entry is ObjectExpression => entry?.type === 'ObjectExpression')
  if (configs.length !== entries.length) return { reason: 'config is not an object literal' }

  return { ...parsed, configs, kind }
}

function findConfigEntry(configs: Array<ObjectExpression>, ref: ConfigRef | undefined): ObjectExpression | undefined {
  return typeof ref === 'string' ? configs.find((entry) => getConfigName(entry) === ref) : configs[ref ?? 0]
}

// Reading object literals

function getKey(entry: ObjectPropertyKind | BindingProperty | RestElement): string | undefined {
  if (entry.type !== 'Property' || entry.computed) return undefined
  if (entry.key.type === 'Identifier') return entry.key.name
  return entry.key.type === 'Literal' && typeof entry.key.value === 'string' ? entry.key.value : undefined
}

/** The last one wins when the key repeats, as at runtime. */
function findProperty(node: ObjectExpression, key: string): { member: ObjectPropertyKind; index: number } | undefined {
  const index = node.properties.findLastIndex((entry) => getKey(entry) === key)
  return index === -1 ? undefined : { member: node.properties[index]!, index }
}

function getValue(node: ObjectExpression, key: string): ValueNode {
  const member = findProperty(node, key)?.member
  return member?.type === 'Property' ? member.value : member
}

function getConfigName(config: ObjectExpression): string | undefined {
  const name = getValue(config, 'name')
  return name?.type === 'Literal' && typeof name.value === 'string' ? name.value : undefined
}

function isOverridden(node: ObjectExpression, index: number): boolean {
  return node.properties.slice(index + 1).some((entry) => entry.type === 'SpreadElement')
}

/** `key: value`, not a method, getter, setter, or `{ key }` shorthand. */
function isPlainProperty(member: Extract<ObjectPropertyKind, { type: 'Property' }>): boolean {
  return !member.method && !member.shorthand && member.kind === 'init'
}

/** A literal's value, `undefined` for code. */
function readLiteral(node: ValueNode): OptionValue | undefined {
  switch (node?.type) {
    case 'Literal':
      // A bigint or a regex is code, not a value JSON can carry. A regex Node cannot compile also has a `null` value.
      return 'regex' in node || 'bigint' in node ? undefined : (node.value as OptionValue)
    case 'TemplateLiteral':
      return node.expressions.length ? undefined : (node.quasis[0]?.value.cooked ?? '')
    case 'UnaryExpression': {
      const value = readLiteral(node.argument)
      if (typeof value !== 'number') return undefined
      if (node.operator === '-') return -value
      if (node.operator === '+') return value
      return undefined
    }
    case 'ArrayExpression': {
      const values = node.elements.map((element) => readLiteral(element))
      return values.every((value) => value !== undefined) ? values : undefined
    }
    case 'ObjectExpression': {
      const entries: Record<string, OptionValue> = {}
      for (const entry of node.properties) {
        if (entry.type !== 'Property') return undefined
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

// Imports and factory calls

function getRequirePath(node: ValueNode): string | undefined {
  if (node?.type !== 'CallExpression' || node.callee.type !== 'Identifier' || node.callee.name !== identifiers.require) return undefined
  const [argument] = node.arguments
  return argument?.type === 'Literal' && typeof argument.value === 'string' ? argument.value : undefined
}

/** `import { exported as local } from '...'`. A default or namespace import has no exported name, so its local name stands in. */
function importBindings(statement: ImportDeclaration): Array<[string, Import]> {
  return statement.specifiers.map((specifier) => {
    const imported = specifier.type === 'ImportSpecifier' ? specifier.imported : specifier.local
    const exported = imported.type === 'Identifier' ? imported.name : imported.value
    return [specifier.local.name, { from: statement.source.value, exported }]
  })
}

/** `const { exported: local } = require('...')`. */
function requireBindings(statement: VariableDeclaration): Array<[string, Import]> {
  return statement.declarations.flatMap((declarator): Array<[string, Import]> => {
    const from = getRequirePath(declarator.init)
    if (from === undefined || declarator.id.type !== 'ObjectPattern') return []

    return declarator.id.properties.flatMap((entry): Array<[string, Import]> => {
      if (entry.type !== 'Property' || entry.value.type !== 'Identifier') return []
      return [[entry.value.name, { from, exported: getKey(entry) ?? entry.value.name }]]
    })
  })
}

function getImports(program: Program): Map<string, Import> {
  return new Map(
    program.body.flatMap((statement) => {
      if (statement.type === 'ImportDeclaration') return importBindings(statement)
      if (statement.type === 'VariableDeclaration') return requireBindings(statement)
      return []
    }),
  )
}

function isImportStatement(node: Program['body'][number], kind: ModuleKind): boolean {
  if (kind === moduleKinds.esm) return node.type === 'ImportDeclaration'
  return node.type === 'VariableDeclaration' && node.declarations.some((declarator) => getRequirePath(declarator.init) !== undefined)
}

/** The quote of the first string literal in the file, so new code matches it. */
function detectQuote(node: unknown): Quote | undefined {
  if (!node || typeof node !== 'object') return undefined
  const { type, raw } = node as { type?: string; raw?: unknown }
  if (type === 'Literal' && typeof raw === 'string' && (raw[0] === quotes.single || raw[0] === quotes.double)) return raw[0]
  for (const child of Object.values(node)) {
    const quote = detectQuote(child)
    if (quote) return quote
  }
  return undefined
}

/** The `adapter` value, or the elements of the `plugins` or `parsers` array. */
function factoryNodes(config: ObjectExpression, kind: ExtensionKind): Array<ValueNode> {
  if (kind === extensionKinds.adapter) return [getValue(config, 'adapter')]
  const array = getValue(config, `${kind}s`)
  return array?.type === 'ArrayExpression' ? array.elements : []
}

/** The factory calls of one kind whose callee the file imports. */
function findCalls(program: Program, config: ObjectExpression, kind: ExtensionKind = extensionKinds.plugin): Array<FactoryCall> {
  const imports = getImports(program)
  return factoryNodes(config, kind).flatMap((node) => {
    if (node?.type !== 'CallExpression' || node.callee.type !== 'Identifier') return []
    const imported = imports.get(node.callee.name)
    return imported ? [{ importName: node.callee.name, exportName: imported.exported, packageName: imported.from, call: node }] : []
  })
}

// Disabled plugins

/** Whether nothing but whitespace precedes `offset` on its line. */
function startsLine(source: string, offset: number): boolean {
  return source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset).trim() === ''
}

/** The `disable-plugin` blocks in this config, read from marker comments since the call is no longer a node. */
function findDisabled(source: string, comments: Array<Comment>, config: ObjectExpression): Array<DisabledBlock> {
  const lines = source.split('\n')

  return comments.flatMap((comment) => {
    const match = comment.type === 'Line' ? comment.value.trim().match(DISABLED_MARKER_PATTERN) : null
    // Only markers inside this entry, on a line of their own, so another entry or a trailing comment never matches.
    if (!match || comment.start < config.start || comment.end > config.end || !startsLine(source, comment.start)) return []

    const line = getPosition(source, comment.start).line
    const end = line + Number(match[2])
    const code = lines.slice(line, end).map((text) => text.replace(/^(\s*)\/\/ ?/, '$1').replace(/^\s+$/, ''))
    return [{ packageName: match[1]!, line, end, code }]
  })
}

// Reading options

/** Literal members as `value` and code paths as `locked`, `undefined` for a computed key. */
function readEditable(node: ObjectExpression, prefix: Array<string> = []): { value: Record<string, OptionValue>; locked: Array<Array<string>> } | undefined {
  const value: Record<string, OptionValue> = {}
  const locked: Array<Array<string>> = []

  for (const [index, entry] of node.properties.entries()) {
    if (entry.type === 'SpreadElement') continue
    const key = getKey(entry)
    if (key === undefined) return undefined
    if (findProperty(node, key)?.index !== index) continue

    const path = [...prefix, key]
    // A `__proto__` key replaces the prototype, so it reads as code.
    if (!isSafeKey(key)) {
      locked.push(path)
      continue
    }

    const member = isOverridden(node, index) ? undefined : entry.value
    const literal = readLiteral(member)
    if (literal !== undefined) {
      value[key] = literal
      continue
    }
    if (member?.type !== 'ObjectExpression') {
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

function readObjectOptions(options: ObjectExpression): OptionsView {
  const entries: OptionsView = {}
  for (const [index, entry] of options.properties.entries()) {
    const key = getKey(entry)
    if (key === undefined || !isSafeKey(key)) continue

    const member = entry.type === 'Property' && !isOverridden(options, index) ? entry.value : undefined
    const value = readLiteral(member)
    if (value !== undefined) {
      entries[key] = { literal: true, value }
      continue
    }
    entries[key] = { literal: false, ...(member?.type === 'ObjectExpression' ? readEditable(member) : undefined) }
  }
  return entries
}

function readCallOptions(call: CallExpression): OptionsView {
  const options = call.arguments[0]
  return options?.type === 'ObjectExpression' ? readObjectOptions(options) : {}
}

function readDisabledOptions(code: Array<string>): OptionsView {
  const call = parseExpression(code.join('\n').trim().replace(/,$/, ''))
  return call?.type === 'CallExpression' ? readCallOptions(call) : {}
}

function toPluginView({ importName, packageName, call }: FactoryCall): PluginView {
  return { importName, packageName, options: readCallOptions(call) }
}

/** Active and disabled plugins, in source order so a disabled plugin keeps its place. */
function readPlugins({ source, parsed, config }: { source: string; parsed: ParsedConfig; config: ObjectExpression }): Array<PluginView> {
  const importNames = new Map([...getImports(parsed.program)].map(([local, { from }]) => [from, local]))

  const active = findCalls(parsed.program, config).map((call) => ({ line: getPosition(source, call.call.start).line, plugin: toPluginView(call) }))
  const disabled = findDisabled(source, parsed.comments, config).map(({ packageName, line, code }) => ({
    line,
    plugin: {
      importName: importNames.get(packageName) ?? toExportName(packageName),
      packageName,
      options: readDisabledOptions(code),
      disabled: true as const,
    },
  }))

  return [...active, ...disabled].sort((a, b) => a.line - b.line).map(({ plugin }) => plugin)
}

function readConfigView({ source, parsed, config }: { source: string; parsed: ParsedConfig; config: ObjectExpression }): ConfigView {
  const [adapter] = findCalls(parsed.program, config, extensionKinds.adapter).map(toPluginView)
  const parsers = findCalls(parsed.program, config, extensionKinds.parser).map(toPluginView)
  const output = getOutput(config)

  return {
    name: getConfigName(config),
    plugins: readPlugins({ source, parsed, config }),
    ...(adapter && { adapter }),
    ...(parsers.length ? { parsers } : {}),
    ...(!('reason' in output) && { output: pickOutput(readObjectOptions(output.object)) }),
  }
}

/** Which plugins the file declares and which options Studio may write. */
export function readConfig(source: string): ConfigFileView {
  const parsed = findConfigs(source)
  if ('reason' in parsed) return { managed: false, reason: parsed.reason }

  return { managed: true, configs: parsed.configs.map((config) => readConfigView({ source, parsed, config })) }
}

/** The modules the file imports, empty when it cannot be parsed. */
export function readImports(source: string): Array<string> {
  const parsed = parseSource(source)
  if ('reason' in parsed) return []
  return [...new Set([...getImports(parsed.program).values()].map(({ from }) => from))]
}

// Editing options

type FoundPath = { object: ObjectExpression; index: number; value: Expression } | { object: ObjectExpression; missing: number } | { reason: string }

/** Follows `path` to its literal, or to the first missing key. Refuses a value set in code. */
function findPath(options: ObjectExpression, path: Array<string>): FoundPath {
  let object = options

  for (const [depth, key] of path.entries()) {
    const found = findProperty(object, key)
    if (!found) return { object, missing: depth }
    if (isOverridden(object, found.index)) {
      return { reason: `${path.slice(0, depth + 1).join('.')} can be overridden by a spread after it, so it is customized in code` }
    }

    const { member, index } = found
    const isLast = depth === path.length - 1
    if (isLast) {
      return member.type === 'Property' && readLiteral(member.value) !== undefined
        ? { object, index, value: member.value }
        : { reason: `${path.join('.')} is customized in code` }
    }
    if (member.type !== 'Property' || member.value.type !== 'ObjectExpression') {
      return { reason: `${key} is not an object, so ${path.join('.')} cannot be reached` }
    }
    object = member.value
  }
  return { reason: 'no option path given' }
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

function removeAtPath({ source, options, path }: { source: string; options: ObjectExpression; path: Array<string> }): EditResult {
  const target = findPath(options, path)
  if ('reason' in target) return target
  if ('missing' in target) return { source }
  return { source: removeItem(source, target.object, target.index) }
}

function setOption(source: string, call: CallExpression, path: Array<string>, value: unknown, quote: Quote): EditResult {
  if (!isOptionValue(value)) return { reason: 'the value is not a literal that can be written to a config file' }

  const options = call.arguments[0]
  if (!options) {
    const closing = call.end - 1
    if (source[closing] !== ')') return { reason: 'the factory call could not be located in the file' }
    return { source: replaceText(source, closing, closing, printValue(wrapPath(path, value), quote)) }
  }
  if (options.type !== 'ObjectExpression') return { reason: 'the factory was not called with an object literal' }
  return setAtPath({ source, options, path, value, quote })
}

function removeOption(source: string, call: CallExpression, path: Array<string>): EditResult {
  const options = call.arguments[0]
  if (!options) return { source }
  if (options.type !== 'ObjectExpression') return { reason: 'the factory was not called with an object literal' }
  return removeAtPath({ source, options, path })
}

function editOption({
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
  edit: OptionEdit
  quote: Quote
  extensions: InstalledExtensions
}): EditResult {
  const kind = edit.kind ?? extensionKinds.plugin
  // A package can ship several factories (`parserTs`, `parserTsx`), so prefer the export its manifest names.
  const calls = findCalls(parsed.program, config, kind).filter((entry) => entry.packageName === edit.plugin)
  const exportName = extensions.get(edit.plugin)?.manifest.export ?? toExportName(edit.plugin)
  const call = (calls.find((entry) => entry.exportName === exportName) ?? calls[0])?.call

  if (!call) {
    if (kind === extensionKinds.adapter) return { reason: `${edit.plugin} is not the config's adapter` }
    const disabled = kind === extensionKinds.plugin && findDisabled(source, parsed.comments, config).some((block) => block.packageName === edit.plugin)
    return { reason: disabled ? `${edit.plugin} is disabled, enable it first` : `${edit.plugin} is not in the ${kind}s array` }
  }

  if (edit.operation === ConfigEditOperation.SET_OPTION) return setOption(source, call, edit.path, edit.value, quote)
  return removeOption(source, call, edit.path)
}

// Editing the config's own fields

function setInput(source: string, config: ObjectExpression, input: string, quote: Quote): EditResult {
  const value = printValue(input, quote)
  const found = findProperty(config, 'input')
  if (!found) return { source: appendItem(source, config, `input: ${value}`) }
  if (found.member.type !== 'Property' || !isPlainProperty(found.member)) return { reason: 'input is not a plain property' }
  if (isOverridden(config, found.index)) return { reason: 'a spread after input could override it' }
  return { source: replaceText(source, found.member.value.start, found.member.value.end, value) }
}

function getOutput(config: ObjectExpression): { object: ObjectExpression } | { reason: string } {
  const found = findProperty(config, 'output')
  if (found?.member.type !== 'Property' || found.member.value.type !== 'ObjectExpression') return { reason: 'output is not an object literal' }
  if (isOverridden(config, found.index)) return { reason: 'a spread after output could override it' }
  return { object: found.member.value }
}

function editOutput({ source, config, edit, quote }: { source: string; config: ObjectExpression; edit: OutputEdit; quote: Quote }): EditResult {
  const output = getOutput(config)
  if ('reason' in output) return output
  if (edit.operation === ConfigEditOperation.REMOVE_OUTPUT) return removeAtPath({ source, options: output.object, path: edit.path })

  const [key, ...rest] = edit.path
  if (!isOptionValue(edit.value) || !isOutputValue({ key: key!, value: wrapPath(rest, edit.value) }))
    return { reason: `the value is not one output.${key} takes` }
  return setAtPath({ source, options: output.object, path: edit.path, value: edit.value, quote })
}

// Adding, disabling, and enabling plugins

/** Adds the import after the last one, matching its semicolon style. */
function addImport({
  source,
  parsed,
  importNames,
  moduleSpecifier,
  quote,
}: {
  source: string
  parsed: ParsedConfig
  importNames: Array<string>
  moduleSpecifier: string
  quote: Quote
}): string {
  const lastImport = parsed.program.body.findLast((node) => isImportStatement(node, parsed.kind))
  const afterLine = lastImport ? getPosition(source, lastImport.end).line : 0
  const lines = source.split('\n')

  const semicolon = afterLine > 0 && lines[afterLine - 1]?.trimEnd().endsWith(';') ? ';' : ''
  const specifier = `${quote}${moduleSpecifier}${quote}`
  const statement =
    parsed.kind === moduleKinds.esm ? `import { ${importNames.join(', ')} } from ${specifier}` : `const { ${importNames.join(', ')} } = require(${specifier})`

  lines.splice(afterLine, 0, `${statement}${semicolon}`)
  if (afterLine === 0) lines.splice(1, 0, '')

  return lines.join('\n')
}

/**
 * The parsers `defineConfig` applies when a config sets no `parsers`, by import name. Adding a parser
 * to such a config writes these too, or the new array would replace them.
 */
const DEFAULT_PARSERS = [
  { importName: 'parserTs', packageName: '@kubb/parser-ts' },
  { importName: 'parserTsx', packageName: '@kubb/parser-ts' },
  { importName: 'parserMd', packageName: '@kubb/parser-md' },
] as const

/**
 * Adds a plugin to `plugins`, or with `kind: 'parser'` a parser to `parsers`. Replaying the same add
 * is a no-op, while an import name taken by another package is an error.
 */
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
  edit: AddPluginEdit
  quote: Quote
  extensions: InstalledExtensions
}): EditResult {
  const kind = edit.kind ?? extensionKinds.plugin
  const isParser = kind === extensionKinds.parser
  if (!isAllowedPlugin({ packageName: edit.plugin, extensions, kind })) {
    return {
      reason: isParser ? `"${edit.plugin}" is not an installed Kubb parser` : `"${edit.plugin}" is not a @kubb/plugin-* package or an installed Kubb plugin`,
    }
  }

  const importName = extensions.get(edit.plugin)?.manifest.export ?? toExportName(edit.plugin)
  if (!IDENTIFIER_PATTERN.test(importName)) return { reason: `"${importName}" is not a valid import name` }
  // A package can ship several parsers (`parserTs` and `parserTsx`), so a parser is matched by its export too.
  if (findCalls(parsed.program, config, kind).some((entry) => entry.packageName === edit.plugin && (!isParser || entry.exportName === importName))) {
    return { source }
  }

  const options = edit.options ?? {}
  if (!isOptionValue(options)) return { reason: 'the options are not literals that can be written to a config file' }

  const key = `${kind}s`
  const array = getValue(config, key)
  if (array ? array.type !== 'ArrayExpression' : !isParser) return { reason: `${key} is not an array literal` }
  // A config without `parsers` runs the defaults, so the new array lists them before the added parser.
  const defaults = isParser && !array ? DEFAULT_PARSERS.filter((parser) => parser.importName !== importName) : []

  // The missing imports by package, so `parserTs` and `parserTsx` share one line.
  const imports = getImports(parsed.program)
  const missing = new Map<string, Array<string>>()
  for (const item of [...defaults, { importName, packageName: edit.plugin }]) {
    const from = imports.get(item.importName)?.from
    if (from && from !== item.packageName) return { reason: `${item.importName} is already imported from ${from}` }
    if (!from) missing.set(item.packageName, [...(missing.get(item.packageName) ?? []), item.importName])
  }

  // The array sits below the imports, so adding to it first leaves the import lines where they are.
  const call = `${importName}(${Object.keys(options).length ? printValue(options, quote) : ''})`
  const next =
    array?.type === 'ArrayExpression'
      ? appendItem(source, array, call)
      : appendItem(source, config, `parsers: [${[...defaults.map((parser) => `${parser.importName}()`), call].join(', ')}]`)

  return {
    source: [...missing].reduceRight(
      (current, [moduleSpecifier, importNames]) => addImport({ source: current, parsed, importNames, moduleSpecifier, quote }),
      next,
    ),
  }
}

/** One item per line, so a call can be commented out alone. Skipped when comments sit between items. */
function splitPlugins(source: string, config: ObjectExpression): string | undefined {
  const array = getValue(config, 'plugins')
  if (array?.type !== 'ArrayExpression') return undefined

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

/** Disables the plugin, first putting a one-line `plugins: [a(), b()]` (what `add-plugin` writes) on separate lines. */
function disablePluginInConfig({
  source,
  parsed,
  config,
  edit,
}: {
  source: string
  parsed: ParsedConfig
  config: ObjectExpression
  edit: DisablePluginEdit
}): EditResult {
  const result = disablePlugin(source, parsed.program, config, edit.plugin)
  if (!('reason' in result) || !result.reason.includes('shares a line')) return result

  const split = splitPlugins(source, config)
  if (split === undefined) return result

  const reparsed = findConfigs(split)
  const reparsedConfig = 'reason' in reparsed ? undefined : findConfigEntry(reparsed.configs, edit.config)
  if ('reason' in reparsed || !reparsedConfig) return result

  return disablePlugin(split, reparsed.program, reparsedConfig, edit.plugin)
}

function enablePlugin(source: string, comments: Array<Comment>, config: ObjectExpression, plugin: string): EditResult {
  const block = findDisabled(source, comments, config).find((entry) => entry.packageName === plugin)
  if (!block) return { reason: `${plugin} is not disabled` }

  const lines = source.split('\n')
  lines.splice(block.line - 1, block.end - block.line + 1, ...block.code)
  return { source: lines.join('\n') }
}

// Removing extensions

/** Drops the import statements of `packageName` once nothing else in the file uses their names. */
function removeUnusedImports(source: string, packageName: string): string {
  const parsed = parseSource(source)
  if ('reason' in parsed) return source

  // From the last statement up, so the offsets of the earlier ones stay valid.
  return parsed.program.body.reduceRight((current, statement) => {
    const bindings =
      statement.type === 'ImportDeclaration' ? importBindings(statement) : statement.type === 'VariableDeclaration' ? requireBindings(statement) : []
    if (!bindings.length || bindings.some(([, { from }]) => from !== packageName)) return current

    const rest = replaceText(current, statement.start, statement.end)
    if (bindings.some(([local]) => new RegExp(`(?<![\\w$])${local.replaceAll('$', '\\$')}(?![\\w$])`).test(rest))) return current

    const lineStart = current.lastIndexOf('\n', statement.start - 1) + 1
    const lineEnd = current.indexOf('\n', statement.end)
    const after = lineEnd === -1 ? current.length : lineEnd + 1
    // At the top of the file, the blank line after the import goes too, so the file does not start with one.
    return replaceText(current, lineStart, lineStart === 0 && current[after] === '\n' ? after + 1 : after)
  }, source)
}

/**
 * Removes every call of a plugin or parser package, and the block `disable-plugin` commented out,
 * then its unused imports. Removing what the config does not hold is a no-op. Refuses to empty
 * `parsers`, since a config with no parser cannot print files.
 */
function removeExtension(source: string, edit: RemoveExtensionEdit): EditResult {
  const kind = edit.kind ?? extensionKinds.plugin
  let current = source

  // One call at a time, re-parsing in between, since each removal moves the ones after it.
  for (;;) {
    const parsed = findConfigs(current)
    if ('reason' in parsed) return parsed
    const config = findConfigEntry(parsed.configs, edit.config)
    if (!config) return { reason: `no config entry found for ${JSON.stringify(edit.config)}` }

    const array = getValue(config, `${kind}s`)
    const calls = findCalls(parsed.program, config, kind).filter((entry) => entry.packageName === edit.plugin)
    const block = findDisabled(current, parsed.comments, config).find((entry) => entry.packageName === edit.plugin)

    if (calls[0] && array?.type === 'ArrayExpression') {
      const elements = array.elements.filter((element) => element !== null)
      if (kind === extensionKinds.parser && elements.length === calls.length) return { reason: `${edit.plugin} is the last parser in the parsers array` }
      current = removeItem(current, array, elements.indexOf(calls[0].call))
      continue
    }
    if (block && kind === extensionKinds.plugin) {
      const lines = current.split('\n')
      lines.splice(block.line - 1, block.end - block.line + 1)
      current = lines.join('\n')
      continue
    }
    return { source: current === source ? source : removeUnusedImports(current, edit.plugin) }
  }
}

// Applying edits

/** Every edit re-parses the file, since the previous one rewrote it. */
function applyEdit({ source, edit, extensions }: { source: string; edit: ConfigEdit; extensions: InstalledExtensions }): EditResult {
  const parsed = findConfigs(source)
  if ('reason' in parsed) return parsed

  const config = findConfigEntry(parsed.configs, edit.config)
  if (!config) return { reason: `no config entry found for ${JSON.stringify(edit.config)}` }
  const quote = detectQuote(parsed.program) ?? quotes.single

  switch (edit.operation) {
    case ConfigEditOperation.SET_INPUT:
      return setInput(source, config, edit.input, quote)
    case ConfigEditOperation.SET_OUTPUT:
    case ConfigEditOperation.REMOVE_OUTPUT:
      return editOutput({ source, config, edit, quote })
    case ConfigEditOperation.DISABLE_PLUGIN:
      return disablePluginInConfig({ source, parsed, config, edit })
    case ConfigEditOperation.ENABLE_PLUGIN:
      return enablePlugin(source, parsed.comments, config, edit.plugin)
    case ConfigEditOperation.ADD_PLUGIN:
      return addPlugin({ source, parsed, config, edit, quote, extensions })
    case ConfigEditOperation.REMOVE_EXTENSION:
      return removeExtension(source, edit)
    case ConfigEditOperation.SET_OPTION:
    case ConfigEditOperation.REMOVE_OPTION:
      return editOption({ source, parsed, config, edit, quote, extensions })
  }
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
