import { builders, detectCodeFormat, generateCode, parseModule } from 'magicast'
import type { ASTNode, ProxifiedArray, ProxifiedModule, ProxifiedObject, ProxyBase } from 'magicast'
import type { ConfigEdit, ConfigEditOutcome, ConfigFileView, ConfigRef, ConfigView, OptionValue, PluginView } from './protocol/index.ts'
import { isBareSpecifier, toExportName } from './resolveConfig.ts'

/**
 * A valid JavaScript identifier, so an import name can only ever print as `import { name } from`,
 * never as source that breaks out of the import statement.
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

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
 * back to the exact lines it commented out. Carries the block's line count, so `enable-plugin`
 * restores exactly those lines instead of scanning forward through whatever comments follow.
 */
const DISABLED_MARKER = 'kubb:disabled'

/**
 * The one line `disable-plugin` writes above the comment block it produces for `plugin`.
 */
function formatMarker(plugin: string, lineCount: number, indent = ''): string {
  return `${indent}// ${DISABLED_MARKER} ${plugin} ${lineCount}`
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
function selectConfig(configs: Array<ObjectProxy>, ref: ConfigRef | undefined): ObjectProxy | undefined {
  if (ref === undefined) {
    return configs[0]
  }
  if (typeof ref === 'number') {
    return configs[ref]
  }
  return configs.find((config) => configName(config) === ref)
}

function configName(config: ObjectProxy): string | undefined {
  const name = property(config.$ast, 'name')
  return name?.type === 'StringLiteral' ? name.value : undefined
}

/**
 * The name of an object literal property, for the two key shapes a config uses: `key: value` and
 * `'key': value`. `undefined` for a computed key, which the patcher never touches.
 */
function propertyKey(property: Extract<ASTNode, { type: 'ObjectProperty' }>): string | undefined {
  if (property.key.type === 'Identifier') {
    return property.key.name
  }
  if (property.key.type === 'StringLiteral') {
    return property.key.value
  }
  return undefined
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
    if (entry.type === 'ObjectProperty' && propertyKey(entry) === key) {
      return entry.value
    }
  }
  return undefined
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
      const key = propertyKey(entry)
      const value = readLiteral(entry.value)
      if (key === undefined || value === undefined) {
        return undefined
      }
      entries[key] = value
    }
    return entries
  }
  return undefined
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
function pluginCalls(
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
function disabledMarkers(source: string): Array<{ packageName: string; line: number }> {
  return source.split('\n').flatMap((line, index) => {
    const marker = parseMarker(line)
    return marker ? [{ packageName: marker.plugin, line: index + 1 }] : []
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

  // Keyed by package rather than by local name, which is the direction the disabled plugins below
  // look it up in.
  const importNames = new Map([...importedFrom(mod)].map(([local, from]) => [from, local]))
  const disabled = disabledMarkers(source)

  return {
    managed: true,
    configs: found.configs.map((config): ConfigView => {
      const plugins = pluginCalls(mod, config).map(({ importName, packageName, options }): PluginView => {
        const entries: PluginView['options'] = {}

        if (options?.type === 'ObjectExpression') {
          for (const entry of options.properties) {
            if (entry.type !== 'ObjectProperty') {
              continue
            }
            const key = propertyKey(entry)
            if (key === undefined) {
              continue
            }
            const value = readLiteral(entry.value)
            entries[key] = value === undefined ? { literal: false } : { literal: true, value }
          }
        }
        return { importName, packageName, options: entries }
      })

      const start = config.$ast.loc?.start.line ?? 0
      const end = config.$ast.loc?.end.line ?? Number.POSITIVE_INFINITY

      for (const { packageName } of disabled.filter((entry) => entry.line >= start && entry.line <= end)) {
        plugins.push({
          importName: importNames.get(packageName) ?? toExportName(packageName),
          packageName,
          options: {},
          disabled: true,
        })
      }

      return { name: configName(config), plugins }
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
 * The options object of a plugin call, when it was called with one.
 */
function getOptions(call: CallProxy): ObjectProxy | undefined {
  const options = call.$args[0] as ObjectProxy | undefined
  return options?.$type === 'object' ? options : undefined
}

/**
 * The options object of a plugin call, creating an empty one when the plugin was called bare.
 */
function ensureOptions(call: CallProxy): ObjectProxy | undefined {
  if (call.$args.length === 0) {
    call.$args.push({})
  }
  return getOptions(call)
}

/**
 * Walks `path` down to the object holding its last key, descending only through object literals.
 */
function optionParent(options: ObjectProxy, path: Array<string>): { object: ObjectProxy; key: string } | { reason: string } {
  let object = options

  for (const [index, key] of path.entries()) {
    // `object[key] = {}` for `__proto__` reassigns the object's prototype instead of creating an
    // own property, which breaks every read after it. Refused here rather than left to throw, so
    // one bad edit in a batch cannot take the rest down with it.
    if (key === UNSAFE_KEY) {
      return { reason: `${path.join('.')} is not a valid option path` }
    }

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

  const options = ensureOptions(call)
  if (!options) {
    return 'the plugin was not called with an object literal'
  }

  const target = optionParent(options, path)
  if ('reason' in target) {
    return target.reason
  }

  const current = property(target.object.$ast, target.key)
  if (current !== undefined && readLiteral(current) === undefined) {
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
  const options = getOptions(call)
  if (!options) {
    return 'the plugin has no options to remove'
  }

  const target = optionParent(options, path)
  if ('reason' in target) {
    return target.reason
  }

  const current = property(target.object.$ast, target.key)
  if (current === undefined) {
    return `${path.join('.')} is not set`
  }
  if (readLiteral(current) === undefined) {
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
  if (!isBareSpecifier(edit.plugin)) {
    return { reason: `"${edit.plugin}" is not a package name` }
  }

  const importName = edit.importName ?? toExportName(edit.plugin)
  if (!IDENTIFIER.test(importName)) {
    return { reason: `"${importName}" is not a valid import name` }
  }

  if (pluginCalls(mod, config).some((plugin) => plugin.packageName === edit.plugin)) {
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
  const target = pluginCalls(mod, config).find((entry) => entry.packageName === plugin)
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
  lines.splice(from, to - from + 1, formatMarker(plugin, commented.length, indent), ...commented)

  return { source: lines.join('\n') }
}

/**
 * Uncomments the block a previous `disable-plugin` left behind for `plugin`.
 */
function enablePlugin(source: string, plugin: string): { source: string } | { reason: string } {
  const lines = source.split('\n')

  for (const [index, line] of lines.entries()) {
    const marker = parseMarker(line)
    if (marker?.plugin !== plugin) {
      continue
    }

    // Bounded by the marker's own line count rather than scanning for trailing `//` lines, so a
    // comment or another disabled block right after this one is left untouched.
    const end = index + 1 + marker.lineCount
    const restored = lines.slice(index + 1, end).map((commented) => commented.replace(/^(\s*)\/\/ ?/, '$1'))
    lines.splice(index, end - index, ...restored)

    return { source: lines.join('\n') }
  }

  return { reason: `${plugin} is not disabled` }
}

/**
 * Re-parses `source` and resolves the config entry an edit targets. Every edit re-parses rather
 * than sharing one module across the batch, since the disable/enable edits rewrite `source` as
 * text and would otherwise leave the others working from a stale tree.
 */
function parseTarget(source: string, ref: ConfigRef | undefined): { mod: ProxifiedModule; config: ObjectProxy } | { reason: string } {
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

  const config = selectConfig(found.configs, ref)
  if (!config) {
    return { reason: `no config entry found for ${JSON.stringify(ref)}` }
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
    const target = parseTarget(current, edit.config)
    if ('reason' in target) {
      return { edit, applied: false, reason: target.reason }
    }
    const { mod, config } = target

    if (edit.operation === 'disable-plugin' || edit.operation === 'enable-plugin') {
      const result = edit.operation === 'disable-plugin' ? disablePlugin(current, mod, config, edit.plugin) : enablePlugin(current, edit.plugin)
      if ('reason' in result) {
        return { edit, applied: false, reason: result.reason }
      }
      current = result.source
      return { edit, applied: true }
    }

    if (edit.operation === 'add-plugin') {
      const result = applyAddPlugin(mod, config, edit)
      if ('reason' in result) {
        return { edit, applied: false, reason: result.reason }
      }
      // Read before `generateCode`, though an `add-plugin` only reflows the plugins array below
      // the imports, so their lines survive it either way.
      const afterLine = lastImportEndLine(mod)
      let next = generateCode(mod, { format }).code
      if (result.addImport) {
        next = insertImportLine({ source: next, afterLine, ...result.addImport })
      }
      current = withTrailingNewline(next, endsWithNewline)
      return { edit, applied: true }
    }

    const pluginCall = pluginCalls(mod, config).find((plugin) => plugin.packageName === edit.plugin)
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
 * The 1-based line where the file's last import declaration ends, or `0` when it has none. Read
 * off the parsed module, so a multi-line `import {\n  x,\n} from '...'` reports its closing line
 * rather than the `import` keyword.
 */
function lastImportEndLine(mod: ProxifiedModule): number {
  const body = mod.$ast.type === 'Program' ? mod.$ast.body : []

  return body.filter((node) => node.type === 'ImportDeclaration').at(-1)?.loc?.end.line ?? 0
}

/**
 * Writes an import after the last one already in the file, matching its quote style and whether it
 * ends in a semicolon. `afterLine` is where that last import ends, `0` for a file with none.
 *
 * Written as plain text rather than through magicast's import builder, which prints a brand-new
 * import declaration with its own default spacing and a semicolon regardless of `format`, since
 * that formatting only governs nodes recast can diff against the original source.
 */
function insertImportLine({
  source,
  importName,
  moduleSpecifier,
  afterLine,
}: {
  source: string
  importName: string
  moduleSpecifier: string
  afterLine: number
}): string {
  const lines = source.split('\n')

  const lastImportLine = afterLine > 0 ? lines[afterLine - 1] : undefined
  const quote = lastImportLine?.includes(`"`) ? `"` : `'`
  const semicolon = lastImportLine?.trimEnd().endsWith(';') ? ';' : ''
  const line = `import { ${importName} } from ${quote}${moduleSpecifier}${quote}${semicolon}`

  // A file with no imports gets a blank line after the one being added, so it does not run into
  // whatever was on the first line.
  lines.splice(afterLine, 0, ...(afterLine > 0 ? [line] : [line, '']))

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
