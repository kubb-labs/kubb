import { builders, detectCodeFormat, generateCode, parseModule } from 'magicast'
import type { ASTNode, ProxifiedModule } from 'magicast'
import type { ConfigEdit, ConfigEditOutcome, ConfigFileView, ConfigRef, ConfigView, OptionValue, PluginView } from './protocol/index.ts'
import { isBareSpecifier, toExportName } from './resolveConfig.ts'

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
 * A `pluginX(...)` call in a config's `plugins` array.
 */
type CallNode = Extract<ASTNode, { type: 'CallExpression' }>

/**
 * A `key: value` entry of an object literal.
 */
type ObjectPropertyNode = Extract<ASTNode, { type: 'ObjectProperty' }>

/**
 * `key: value` as an object literal property, in the file's quote and key style.
 *
 * Uses magicast's literal builder for the key/value nodes, then wraps them as a Babel
 * `ObjectProperty`, the type the rest of this file reads.
 */
function literalProperty({ key, value }: { key: string; value: OptionValue }): ObjectPropertyNode {
  const built = (builders.literal({ [key]: value }) as unknown as ObjectNode).properties[0] as unknown as ObjectPropertyNode
  return { type: 'ObjectProperty', key: built.key, value: built.value, computed: false, shorthand: false }
}

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
 * Every config object in `export default defineConfig(...)`, or why the file is unmanaged.
 *
 * An array export gets one entry per element, matching {@link ConfigRef}'s numeric index.
 *
 * Walks the parsed AST rather than magicast's proxies, which throw on node types they cannot
 * cast, most of what an unmanaged config file is made of.
 */
function findConfigs(mod: ProxifiedModule): { configs: Array<ObjectNode> } | { reason: string } {
  const body = mod.$ast.type === 'Program' ? mod.$ast.body : []
  const declaration = body.find((node): node is Extract<ASTNode, { type: 'ExportDefaultDeclaration' }> => node.type === 'ExportDefaultDeclaration')

  const exported = unwrap(declaration?.declaration)
  if (!exported) {
    return { reason: 'no default export found' }
  }
  if (exported.type !== 'CallExpression' || exported.callee.type !== 'Identifier' || exported.callee.name !== 'defineConfig') {
    return { reason: 'default export is not a defineConfig(...) call' }
  }

  const argument = unwrap(exported.arguments[0])
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
    return { configs }
  }
  if (argument.type !== 'ObjectExpression') {
    return { reason: 'config is not an object literal' }
  }
  return { configs: [argument] }
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
 * The index of an object literal's own property named `key`, `-1` when it has none.
 */
function entryIndex({ node, key }: { node: ObjectNode; key: string }): number {
  return node.properties.findIndex((entry) => entry.type === 'ObjectProperty' && propertyKey(entry) === key)
}

/**
 * The value node of an object literal's own property.
 */
function property(node: ObjectNode, key: string): ASTNode | undefined {
  const index = entryIndex({ node, key })
  return index === -1 ? undefined : (node.properties[index] as ObjectPropertyNode).value
}

/**
 * Writes `key: value` on an object literal, replacing the value when the property is already there.
 *
 * An existing property has its value swapped in place rather than being replaced whole, so recast
 * reprints only that value and leaves the object's own layout alone.
 */
function setProperty({ node, key, value }: { node: ObjectNode; key: string; value: OptionValue }): void {
  const entry = literalProperty({ key, value })
  const index = entryIndex({ node, key })

  if (index === -1) {
    node.properties.push(entry)
    return
  }
  ;(node.properties[index] as ObjectPropertyNode).value = entry.value
}

/**
 * Drops `key` from an object literal.
 */
function removeProperty({ node, key }: { node: ObjectNode; key: string }): void {
  const index = entryIndex({ node, key })
  if (index !== -1) {
    node.properties.splice(index, 1)
  }
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
function pluginCalls(mod: ProxifiedModule, config: ObjectNode): Array<{ importName: string; packageName: string; call: CallNode }> {
  const plugins = property(config, 'plugins')
  if (plugins?.type !== 'ArrayExpression') {
    return []
  }

  const imports = importedFrom(mod)
  const resolved = []

  for (const element of plugins.elements) {
    if (element?.type !== 'CallExpression' || element.callee.type !== 'Identifier') {
      continue
    }
    const importName = element.callee.name
    const packageName = imports.get(importName)
    if (packageName) {
      resolved.push({ importName, packageName, call: element })
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

  const importNames = new Map([...importedFrom(mod)].map(([local, from]) => [from, local]))
  const disabled = disabledMarkers(source)

  return {
    managed: true,
    configs: found.configs.map((config): ConfigView => {
      const plugins = pluginCalls(mod, config).map(({ importName, packageName, call }): PluginView => {
        const entries: PluginView['options'] = {}
        const options = call.arguments[0]

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

      const start = config.loc?.start.line ?? 0
      const end = config.loc?.end.line ?? Number.POSITIVE_INFINITY

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
function getOptions(call: CallNode): ObjectNode | undefined {
  const options = call.arguments[0]
  return options?.type === 'ObjectExpression' ? options : undefined
}

/**
 * The options object of a plugin call, creating an empty one when the plugin was called bare.
 */
function ensureOptions(call: CallNode): ObjectNode | undefined {
  if (call.arguments.length === 0) {
    call.arguments.push({ type: 'ObjectExpression', properties: [] })
  }
  return getOptions(call)
}

/**
 * Walks `path` down to the object holding its last key, descending only through object literals.
 */
function optionParent(options: ObjectNode, path: Array<string>): { object: ObjectNode; key: string } | { reason: string } {
  let object = options

  for (const [index, key] of path.entries()) {
    // `__proto__` printed into the config reassigns its prototype on import instead of creating a
    // property. Refused here so one bad edit can't take the rest of the batch down.
    if (key === UNSAFE_KEY) {
      return { reason: `${path.join('.')} is not a valid option path` }
    }

    if (index === path.length - 1) {
      return { object, key }
    }

    if (property(object, key) === undefined) {
      setProperty({ node: object, key, value: {} })
    }

    const next = property(object, key)
    if (next?.type !== 'ObjectExpression') {
      return { reason: `${key} is not an object, so ${path.join('.')} cannot be reached` }
    }
    object = next
  }
  return { reason: 'no option path given' }
}

/**
 * Writes `value` at `path` inside a plugin call's options, creating the options object and any
 * intermediate object along the path as needed. Refuses when the current value at `path` is
 * something other than a literal, so an option customized in code is never overwritten.
 */
function applySet(call: CallNode, path: Array<string>, value: unknown): string | undefined {
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

  const current = property(target.object, target.key)
  if (current !== undefined && readLiteral(current) === undefined) {
    return `${path.join('.')} is customized in code`
  }

  setProperty({ node: target.object, key: target.key, value })
  return undefined
}

/**
 * Deletes the property at `path` inside a plugin call's options, falling the plugin back to its
 * default for that option. Refuses when the value at `path` is not a literal, for the same reason
 * `applySet` does.
 */
function applyRemove(call: CallNode, path: Array<string>): string | undefined {
  const options = getOptions(call)
  if (!options) {
    return 'the plugin has no options to remove'
  }

  const target = optionParent(options, path)
  if ('reason' in target) {
    return target.reason
  }

  const current = property(target.object, target.key)
  if (current === undefined) {
    return `${path.join('.')} is not set`
  }
  if (readLiteral(current) === undefined) {
    return `${path.join('.')} is customized in code`
  }

  removeProperty({ node: target.object, key: target.key })
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
function applyAddPlugin(mod: ProxifiedModule, config: ObjectNode, edit: Extract<ConfigEdit, { operation: 'add-plugin' }>): AddPluginResult {
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

  const plugins = property(config, 'plugins')
  if (plugins?.type !== 'ArrayExpression') {
    return { reason: 'plugins is not an array literal' }
  }

  const call = Object.keys(options).length ? builders.functionCall(importName, options) : builders.functionCall(importName)
  plugins.elements.push(call.$ast as CallNode)

  return taken ? {} : { addImport: { importName, moduleSpecifier: edit.plugin } }
}

/**
 * Comments out a plugin call in place, keeping its options on disk so `enable-plugin` can restore
 * them exactly. Operates on `source` text rather than the AST: a commented-out call is no longer a
 * node magicast can address, and the surrounding array must not reflow when its element count
 * never actually changes.
 */
function disablePlugin(source: string, mod: ProxifiedModule, config: ObjectNode, plugin: string): { source: string } | { reason: string } {
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
function parseTarget(source: string, ref: ConfigRef | undefined): { mod: ProxifiedModule; config: ObjectNode } | { reason: string } {
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
 *
 * @note recast always reprints a semicolon on a reprinted statement, so editing a block-body
 * `defineConfig` in a semicolon-free file adds one to the `return` line. This is a known gap.
 * Strip it when `detectCodeFormat` reports `useSemi: false`, if it turns out to matter in practice.
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

    const reason = edit.operation === 'set' ? applySet(pluginCall.call, edit.path, edit.value) : applyRemove(pluginCall.call, edit.path)
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
