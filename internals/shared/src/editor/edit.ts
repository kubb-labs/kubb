import { getErrorMessage, memo, read, writeRaw } from '@internals/utils'
import { type CallExpression, type Comment, type Expression, type ObjectExpression, type Program, nodeTypes, parseSource } from './ast.ts'
import { findEscapingOutputPath, isAllowedPlugin, isOptionValue, isOutputKey, isOutputValue, isSafeKey, toExportName } from './rules.ts'
import { appendItem, getPosition, IDENTIFIER_PATTERN, printKey, printValue, quotes, type Quote, removeItem, replaceText, wrapPath } from './text.ts'
import { type ConfigEdit, ConfigEditOperation, type ConfigEditOutcome, extensionKinds, type InstalledExtensions, type OptionValue } from './types.ts'
import type { ParsedConfig } from './find.ts'
import {
  detectQuote,
  findCalls,
  findConfigEntry,
  findConfigs,
  findDisabled,
  findProperty,
  getImports,
  getOutput,
  getValue,
  importBindings,
  isImportStatement,
  isOverridden,
  isPlainProperty,
  moduleKinds,
  readLiteral,
  requireBindings,
} from './find.ts'

const OPERATIONS = new Set<string>(Object.values(ConfigEditOperation))
const OPTION_OPERATIONS = new Set<string>([ConfigEditOperation.SET_OPTION, ConfigEditOperation.REMOVE_OPTION])
const OUTPUT_OPERATIONS = new Set<string>([ConfigEditOperation.SET_OUTPUT, ConfigEditOperation.REMOVE_OUTPUT])
const KINDS = new Set<string>(Object.values(extensionKinds))

type EditResult = { source: string } | { reason: string }
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
  const { operation, plugin, config, path, kind, input, value, options } = (typeof edit === 'object' && edit !== null ? edit : {}) as Record<string, unknown>

  if (typeof operation !== 'string' || !OPERATIONS.has(operation)) return `unknown operation ${JSON.stringify(operation)}`
  if (config !== undefined && typeof config !== 'string' && !Number.isSafeInteger(config)) return 'config must name an entry or give its index'

  if (operation === ConfigEditOperation.SET_INPUT) {
    return typeof input === 'string' && input.trim() !== '' ? undefined : 'the edit names no input'
  }

  const isOption = OPTION_OPERATIONS.has(operation)
  const isOutput = OUTPUT_OPERATIONS.has(operation)

  if (!isOutput && !isNonEmptyString(plugin)) return 'the edit names no plugin'

  // The next generation writes there, so an edit may only point a plugin inside the output folder.
  const written =
    operation === ConfigEditOperation.SET_OPTION && Array.isArray(path) ? path.reduceRight<unknown>((inner, key) => ({ [String(key)]: inner }), value) : options
  const escaping = findEscapingOutputPath(written)
  if (escaping !== undefined) return `output.path ${JSON.stringify(escaping)} resolves outside the output folder`

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
      return member.type === nodeTypes.property && readLiteral(member.value) !== undefined
        ? { object, index, value: member.value }
        : { reason: `${path.join('.')} is customized in code` }
    }
    if (member.type !== nodeTypes.property || member.value.type !== nodeTypes.objectExpression) {
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
  if (options.type !== nodeTypes.objectExpression) return { reason: 'the factory was not called with an object literal' }
  return setAtPath({ source, options, path, value, quote })
}

function removeOption(source: string, call: CallExpression, path: Array<string>): EditResult {
  const options = call.arguments[0]
  if (!options) return { source }
  if (options.type !== nodeTypes.objectExpression) return { reason: 'the factory was not called with an object literal' }
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
  if (found.member.type !== nodeTypes.property || !isPlainProperty(found.member)) return { reason: 'input is not a plain property' }
  if (isOverridden(config, found.index)) return { reason: 'a spread after input could override it' }
  return { source: replaceText(source, found.member.value.start, found.member.value.end, value) }
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
  if (array ? array.type !== nodeTypes.arrayExpression : !isParser) return { reason: `${key} is not an array literal` }
  // A config without `parsers` runs the defaults, so the new array lists them before the added parser.
  const defaults = isParser && !array ? DEFAULT_PARSERS.filter((parser) => parser.importName !== importName) : []

  // The missing imports by package, so `parserTs` and `parserTsx` share one line.
  const imports = getImports(parsed.program)
  const missing = memo.create<string, Array<string>>()
  for (const item of [...defaults, { importName, packageName: edit.plugin }]) {
    const from = imports.get(item.importName)?.from
    if (from && from !== item.packageName) return { reason: `${item.importName} is already imported from ${from}` }
    if (!from) memo(missing, item.packageName, () => []).push(item.importName)
  }

  // The array sits below the imports, so adding to it first leaves the import lines where they are.
  const call = `${importName}(${Object.keys(options).length ? printValue(options, quote) : ''})`
  const next =
    array?.type === nodeTypes.arrayExpression
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

function enablePlugin(source: string, comments: ReadonlyArray<Comment>, config: ObjectExpression, plugin: string): EditResult {
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
      statement.type === nodeTypes.importDeclaration
        ? importBindings(statement)
        : statement.type === nodeTypes.variableDeclaration
          ? requireBindings(statement)
          : []
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

    if (calls[0] && array?.type === nodeTypes.arrayExpression) {
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
    try {
      const invalid = validateEdit(edit)
      if (invalid) return { edit, applied: false, reason: invalid }

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
