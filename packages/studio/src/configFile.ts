import { builders, detectCodeFormat, generateCode, parseModule } from 'magicast'
import type { ASTNode, ProxifiedArray, ProxifiedModule, ProxifiedObject, ProxyBase } from 'magicast'
import type { ConfigEdit, ConfigEditOutcome, ConfigFileView, ConfigSelector, ManagedConfig, ManagedPlugin } from './protocol/index.ts'
import { toExportName } from './resolveConfig.ts'

/**
 * A config or options object proxy, indexed by a key only known at runtime.
 */
type ObjectProxy = ProxifiedObject<Record<string, unknown>> & { plugins: ProxifiedArray }

/**
 * A `pluginX(...)` call proxy, narrowed to the one property the patcher reads or writes: its
 * argument list.
 */
type CallProxy = ProxyBase & { $args: ProxifiedArray<Array<unknown>> }

/**
 * Any proxified node, narrowed only to the `$type` discriminant the read path switches on.
 */
type AnyProxy = ProxyBase & { $type: string; $callee?: string; $args?: ProxifiedArray<Array<unknown>>; $body?: unknown; [key: string]: unknown }

/**
 * A value Studio can round-trip through JSON and print back as a config literal.
 */
type OptionValue = string | number | boolean | null | Array<OptionValue> | { [key: string]: OptionValue }

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
 * Marks the comment block a `disable-plugin` leaves behind, so `enable-plugin` can find its way
 * back to the exact lines it commented out.
 */
const DISABLED_MARKER = 'kubb:disabled'

/**
 * The one line `disable-plugin` writes above the comment block it produces for `plugin`.
 */
function formatMarker(plugin: string, indent = ''): string {
  return `${indent}// ${DISABLED_MARKER} ${plugin}`
}

/**
 * The plugin a marker line names, when `line` is one.
 */
function parseMarker(line: string): string | undefined {
  const trimmed = line.trim()
  return trimmed.startsWith(`// ${DISABLED_MARKER} `) ? trimmed.slice(`// ${DISABLED_MARKER} `.length).trim() : undefined
}

/**
 * Steps through a `() => ...` / `(cli) => ...` wrapper to the expression underneath.
 *
 * Babel drops parentheses, so unlike a TypeScript AST there is no wrapper node to walk past here.
 */
function unwrap(node: AnyProxy | undefined): AnyProxy | undefined {
  if (node?.$type === 'arrow-function-expression' && (node.$body as AnyProxy | undefined)?.$type !== 'blockStatement') {
    return unwrap(node.$body as AnyProxy | undefined)
  }
  return node
}

/**
 * Every config object in `export default defineConfig(...)`, or why the file is unmanaged.
 *
 * A file exporting an array gets one entry per element, in source order.
 */
function findConfigs(mod: ProxifiedModule): { configs: Array<ObjectProxy> } | { reason: string } {
  const exported = unwrap(mod.exports.default as AnyProxy | undefined)
  if (!exported) {
    return { reason: 'no default export found' }
  }
  if (exported.$type !== 'function-call' || exported.$callee !== 'defineConfig') {
    return { reason: 'default export is not a defineConfig(...) call' }
  }

  const argument = unwrap(exported.$args?.[0] as AnyProxy | undefined)
  if (!argument) {
    return { reason: 'defineConfig(...) was called without a config' }
  }
  if (argument.$type === 'array') {
    const entries = [...(argument as unknown as ProxifiedArray)] as Array<AnyProxy>
    return { configs: entries.map((entry) => unwrap(entry) as unknown as ObjectProxy) }
  }
  if (argument.$type !== 'object') {
    return { reason: 'config is not an object literal' }
  }
  return { configs: [argument as unknown as ObjectProxy] }
}

/**
 * The config entry an edit names, defaulting to the first when it names none.
 */
function selectConfig(configs: Array<ObjectProxy>, selector: ConfigSelector | undefined): ObjectProxy | undefined {
  if (selector === undefined) {
    return configs[0]
  }
  if (typeof selector === 'number') {
    return configs[selector]
  }
  return configs.find((config) => nameOf(config) === selector)
}

function nameOf(config: ObjectProxy): string | undefined {
  const name = property(config.$ast, 'name')
  return name?.type === 'StringLiteral' ? name.value : undefined
}

/**
 * The value node of an object literal's own property, read off the AST rather than the proxy.
 *
 * Magicast throws on reading a property whose value is a node it cannot cast, `-1` among them, so
 * everything that only inspects the file goes through the AST instead.
 */
function property(node: ASTNode, key: string): ASTNode | undefined {
  if (node.type !== 'ObjectExpression') {
    return undefined
  }
  for (const entry of node.properties) {
    if (entry.type !== 'ObjectProperty') {
      continue
    }
    const name = entry.key.type === 'Identifier' ? entry.key.name : entry.key.type === 'StringLiteral' ? entry.key.value : undefined
    if (name === key) {
      return entry.value
    }
  }
  return undefined
}

/**
 * True for a primitive, or an object/array built only from primitives.
 */
function isLiteral(node: ASTNode | undefined): boolean {
  if (!node) {
    return false
  }
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral' || node.type === 'NullLiteral') {
    return true
  }
  if (node.type === 'TemplateLiteral') {
    return node.expressions.length === 0
  }
  if (node.type === 'UnaryExpression') {
    return isLiteral(node.argument)
  }
  if (node.type === 'ArrayExpression') {
    return node.elements.every((element) => element !== null && isLiteral(element))
  }
  if (node.type === 'ObjectExpression') {
    return node.properties.every((entry) => entry.type === 'ObjectProperty' && isLiteral(entry.value))
  }
  return false
}

/**
 * Maps a factory identifier in the file back to the module it was imported from.
 */
function importedFrom(mod: ProxifiedModule): Map<string, string> {
  return new Map(mod.imports.$items.map((item) => [item.local, item.from]))
}

/**
 * Every `pluginX(...)` element of a config's plugins array that resolves to an import.
 */
function resolvePluginCalls(
  mod: ProxifiedModule,
  config: ObjectProxy,
): Array<{ index: number; importName: string; packageName: string; options: ASTNode | undefined }> {
  const plugins = property(config.$ast, 'plugins')
  if (plugins?.type !== 'ArrayExpression') {
    return []
  }

  const imports = importedFrom(mod)
  const resolved = []

  for (const [index, element] of plugins.elements.entries()) {
    if (element?.type !== 'CallExpression' || element.callee.type !== 'Identifier') {
      continue
    }
    const importName = element.callee.name
    const packageName = imports.get(importName)
    if (packageName) {
      resolved.push({ index, importName, packageName, options: element.arguments[0] })
    }
  }
  return resolved
}

/**
 * Plugins a previous `disable-plugin` commented out of this config, keyed by package name.
 *
 * Read from the marker lines rather than the AST, since a commented-out call is no longer a node.
 */
function disabledPlugins(source: string): Array<{ packageName: string; line: number }> {
  return source.split('\n').flatMap((line, index) => {
    const packageName = parseMarker(line)
    return packageName ? [{ packageName, line: index + 1 }] : []
  })
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
  let mod: ProxifiedModule
  try {
    mod = parseModule(source)
  } catch {
    return { managed: false, reason: 'the config file could not be parsed' }
  }

  const found = findConfigs(mod)
  if ('reason' in found) {
    return { managed: false, reason: found.reason }
  }

  const imports = importedFrom(mod)
  const disabled = disabledPlugins(source)

  return {
    managed: true,
    configs: found.configs.map((config): ManagedConfig => {
      const plugins = resolvePluginCalls(mod, config).map(({ importName, packageName, options }): ManagedPlugin => {
        const entries: ManagedPlugin['options'] = {}

        if (options?.type === 'ObjectExpression') {
          for (const entry of options.properties) {
            if (entry.type !== 'ObjectProperty') {
              continue
            }
            const key = entry.key.type === 'Identifier' ? entry.key.name : entry.key.type === 'StringLiteral' ? entry.key.value : undefined
            if (key !== undefined) {
              entries[key] = { literal: isLiteral(entry.value) }
            }
          }
        }
        return { importName, packageName, options: entries }
      })

      const start = config.$ast.loc?.start.line ?? 0
      const end = config.$ast.loc?.end.line ?? Number.POSITIVE_INFINITY

      for (const { packageName } of disabled.filter((entry) => entry.line >= start && entry.line <= end)) {
        plugins.push({
          importName: [...imports.entries()].find(([, from]) => from === packageName)?.[0] ?? toExportName(packageName),
          packageName,
          options: {},
          disabled: true,
        })
      }

      return { name: nameOf(config), plugins }
    }),
  }
}

/**
 * An object literal key that would change the prototype rather than add a property.
 */
const UNSAFE_KEY = '__proto__'

/**
 * Whether a value can be written into a config file as a literal.
 *
 * This is the trust boundary for edits that arrive over the agent WebSocket: anything else, a
 * function, `undefined`, a non-finite number, or an object carrying a `__proto__` key, is refused
 * rather than printed into the user's source.
 */
export function isOptionValue(value: unknown): value is OptionValue {
  if (value === null) {
    return true
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return true
  }
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }
  if (Array.isArray(value)) {
    return value.every(isOptionValue)
  }
  if (typeof value === 'object') {
    return Object.entries(value).every(([key, entry]) => key !== UNSAFE_KEY && isOptionValue(entry))
  }
  return false
}

/**
 * Prints a string as a single-quoted literal. `JSON.stringify` does the escaping, so a newline, a
 * backslash, or a control character cannot break out of the literal and into the surrounding file.
 */
function printString(value: string): string {
  const escaped = JSON.stringify(value).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")
  return `'${escaped}'`
}

/**
 * Prints a value the way Kubb configs are written: single quotes, spaced braces.
 */
export function printValue(value: OptionValue): string {
  if (typeof value === 'string') {
    return printString(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(printValue).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, entry]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : printString(key)}: ${printValue(entry)}`)
    return entries.length ? `{ ${entries.join(', ')} }` : '{}'
  }
  return String(value)
}

/**
 * The options object of a plugin call, when it was called with one.
 */
function existingOptionsOf(call: CallProxy): ObjectProxy | undefined {
  const options = call.$args[0] as ObjectProxy | undefined
  return options?.$type === 'object' ? options : undefined
}

/**
 * The options object of a plugin call, creating an empty one when the plugin was called bare.
 */
function optionsObjectOf(call: CallProxy): ObjectProxy | undefined {
  if (call.$args.length === 0) {
    call.$args.push({})
  }
  return existingOptionsOf(call)
}

/**
 * Walks `path` down to the object holding its last key, descending only through object literals.
 */
function descend(options: ObjectProxy, path: Array<string>): { object: ObjectProxy; key: string } | { reason: string } {
  let object = options

  for (const [index, key] of path.entries()) {
    if (index === path.length - 1) {
      return { object, key }
    }

    const next = property(object.$ast, key)
    if (next === undefined) {
      object[key] = {}
      object = object[key] as ObjectProxy
      continue
    }
    if (next.type !== 'ObjectExpression') {
      return { reason: `${key} is not an object, so ${path.join('.')} cannot be reached` }
    }
    object = object[key] as ObjectProxy
  }
  return { reason: 'no option path given' }
}

/**
 * Writes `value` at `path` inside a plugin call's options, creating the options object and any
 * intermediate object along the path as needed. Refuses when the current value at `path` is
 * something other than a literal, so an option customized in code is never overwritten.
 */
function applySet(call: CallProxy, path: Array<string>, value: unknown): string | undefined {
  if (!isOptionValue(value)) {
    return 'the value is not a literal that can be written to a config file'
  }

  const options = optionsObjectOf(call)
  if (!options) {
    return 'the plugin was not called with an object literal'
  }

  const target = descend(options, path)
  if ('reason' in target) {
    return target.reason
  }

  const current = property(target.object.$ast, target.key)
  if (current !== undefined && !isLiteral(current)) {
    return `${path.join('.')} is customized in code`
  }

  target.object[target.key] = value
  return undefined
}

/**
 * Deletes the property at `path` inside a plugin call's options, falling the plugin back to its
 * default for that option. Refuses when the value at `path` is not a literal, for the same reason
 * `applySet` does.
 */
function applyRemove(call: CallProxy, path: Array<string>): string | undefined {
  const options = existingOptionsOf(call)
  if (!options) {
    return 'the plugin has no options to remove'
  }

  const target = descend(options, path)
  if ('reason' in target) {
    return target.reason
  }

  const current = property(target.object.$ast, target.key)
  if (current === undefined) {
    return `${path.join('.')} is not set`
  }
  if (!isLiteral(current)) {
    return `${path.join('.')} is customized in code`
  }

  delete target.object[target.key]
  return undefined
}

/**
 * Outcome of `applyAddPlugin`. `addImport` is set when the new plugin call needs an import line
 * the caller must still insert; absent when the import was already there.
 */
type AddPluginResult = { reason: string } | { addImport?: { importName: string; moduleSpecifier: string } }

/**
 * Adds a `pluginX(...)` call to a config's plugins array. Refuses when the plugin is already
 * present, or when its import name collides with an unrelated existing import.
 */
function applyAddPlugin(mod: ProxifiedModule, config: ObjectProxy, edit: Extract<ConfigEdit, { operation: 'add-plugin' }>): AddPluginResult {
  const importName = edit.importName ?? toExportName(edit.plugin)

  if (resolvePluginCalls(mod, config).some((plugin) => plugin.packageName === edit.plugin)) {
    return { reason: `${edit.plugin} is already in the plugins array` }
  }

  const taken = importedFrom(mod).get(importName)
  if (taken && taken !== edit.plugin) {
    return { reason: `${importName} is already imported from ${taken}` }
  }

  const options = edit.options ?? {}
  if (!isOptionValue(options)) {
    return { reason: 'the options are not literals that can be written to a config file' }
  }

  const plugins = property(config.$ast, 'plugins')
  if (plugins?.type !== 'ArrayExpression') {
    return { reason: 'plugins is not an array literal' }
  }

  config.plugins.push(Object.keys(options).length ? builders.functionCall(importName, options) : builders.functionCall(importName))

  return taken ? {} : { addImport: { importName, moduleSpecifier: edit.plugin } }
}

/**
 * Comments out a plugin call in place, keeping its options on disk so `enable-plugin` can restore
 * them exactly. Operates on `source` text rather than the AST: a commented-out call is no longer a
 * node magicast can address, and the surrounding array must not reflow when its element count
 * never actually changes.
 */
function disablePlugin(source: string, mod: ProxifiedModule, config: ObjectProxy, plugin: string): { source: string } | { reason: string } {
  const target = resolvePluginCalls(mod, config).find((entry) => entry.packageName === plugin)
  if (!target) {
    return { reason: `${plugin} is not in the plugins array` }
  }

  const pluginsNode = property(config.$ast, 'plugins')
  const element = pluginsNode?.type === 'ArrayExpression' ? pluginsNode.elements[target.index] : undefined
  const loc = element?.loc
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
  lines.splice(from, to - from + 1, formatMarker(plugin, indent), ...commented)

  return { source: lines.join('\n') }
}

/**
 * Uncomments the block a previous `disable-plugin` left behind for `plugin`.
 */
function enablePlugin(source: string, plugin: string): { source: string } | { reason: string } {
  const lines = source.split('\n')
  const markerIndex = lines.findIndex((line) => parseMarker(line) === plugin)
  if (markerIndex < 0) {
    return { reason: `${plugin} is not disabled` }
  }

  let end = markerIndex + 1
  while (end < lines.length && lines[end]?.trim().startsWith('//')) {
    end++
  }

  const restored = lines.slice(markerIndex + 1, end).map((line) => line.replace(/^(\s*)\/\/ ?/, '$1'))
  lines.splice(markerIndex, end - markerIndex, ...restored)

  return { source: lines.join('\n') }
}

/**
 * Re-parses `source` and resolves the config entry an edit targets. Every edit re-parses rather
 * than sharing one module across the batch, since the disable/enable edits rewrite `source` as
 * text and would otherwise leave the others working from a stale tree.
 */
function parseTarget(source: string, selector: ConfigSelector | undefined): { mod: ProxifiedModule; config: ObjectProxy } | { reason: string } {
  let mod: ProxifiedModule
  try {
    mod = parseModule(source)
  } catch {
    return { reason: 'the config file could not be parsed' }
  }

  const found = findConfigs(mod)
  if ('reason' in found) {
    return { reason: found.reason }
  }

  const config = selectConfig(found.configs, selector)
  if (!config) {
    return { reason: `no config entry found for ${JSON.stringify(selector)}` }
  }

  return { mod, config }
}

/**
 * Applies edits to a `kubb.config.ts` in place. Every node the edits do not touch keeps its
 * original text, so comments, formatting, and hand-written code around the config survive.
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
  const format = detectCodeFormat(source)
  const endsWithNewline = source.endsWith('\n')

  const outcomes = edits.map((edit): ConfigEditOutcome => {
    if (edit.operation === 'disable-plugin' || edit.operation === 'enable-plugin') {
      const target = parseTarget(current, edit.config)
      if ('reason' in target) {
        return { edit, applied: false, reason: target.reason }
      }

      const result = edit.operation === 'disable-plugin' ? disablePlugin(current, target.mod, target.config, edit.plugin) : enablePlugin(current, edit.plugin)
      if ('reason' in result) {
        return { edit, applied: false, reason: result.reason }
      }
      current = result.source
      return { edit, applied: true }
    }

    const target = parseTarget(current, edit.config)
    if ('reason' in target) {
      return { edit, applied: false, reason: target.reason }
    }
    const { mod, config } = target

    if (edit.operation === 'add-plugin') {
      const result = applyAddPlugin(mod, config, edit)
      if ('reason' in result) {
        return { edit, applied: false, reason: result.reason }
      }
      let next = generateCode(mod, { format }).code
      if (result.addImport) {
        next = insertImportLine(next, result.addImport.importName, result.addImport.moduleSpecifier)
      }
      current = withTrailingNewline(next, endsWithNewline)
      return { edit, applied: true }
    }

    const pluginCall = resolvePluginCalls(mod, config).find((plugin) => plugin.packageName === edit.plugin)
    if (!pluginCall) {
      return { edit, applied: false, reason: `${edit.plugin} is not in the plugins array` }
    }

    const call = config.plugins[pluginCall.index] as CallProxy
    const reason = edit.operation === 'set' ? applySet(call, edit.path, edit.value) : applyRemove(call, edit.path)
    if (!reason) {
      current = withTrailingNewline(generateCode(mod, { format }).code, endsWithNewline)
    }
    return { edit, applied: !reason, reason }
  })

  return { source: current, outcomes, changed: current !== source }
}

/**
 * Writes an import after the last one already in the file, matching its quote style and whether it
 * ends in a semicolon.
 *
 * Written as plain text rather than through magicast's import builder, which prints a brand-new
 * import declaration with its own default spacing and a semicolon regardless of `format`, since
 * that formatting only governs nodes recast can diff against the original source.
 */
function insertImportLine(source: string, importName: string, moduleSpecifier: string): string {
  const lines = source.split('\n')
  let lastImportIndex = -1
  for (const [index, line] of lines.entries()) {
    if (/^import\b/.test(line)) {
      lastImportIndex = index
    }
  }

  const lastImportLine = lastImportIndex >= 0 ? lines[lastImportIndex] : undefined
  const quote = lastImportLine?.includes(`"`) ? `"` : `'`
  const semicolon = lastImportLine?.trimEnd().endsWith(';') ? ';' : ''
  const line = `import { ${importName} } from ${quote}${moduleSpecifier}${quote}${semicolon}`

  if (lastImportIndex < 0) {
    lines.splice(0, 0, line, '')
  } else {
    lines.splice(lastImportIndex + 1, 0, line)
  }
  return lines.join('\n')
}

/**
 * `generateCode` always drops the file's trailing newline. Restore it when the input had one.
 */
function withTrailingNewline(code: string, hadTrailingNewline: boolean): string {
  if (!hadTrailingNewline || code.endsWith('\n')) {
    return code
  }
  return `${code}\n`
}
