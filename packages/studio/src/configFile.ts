import {
  type ArrayLiteralExpression,
  type CallExpression,
  IndentationText,
  Node,
  type ObjectLiteralExpression,
  Project,
  type PropertyAssignment,
  QuoteKind,
  type SourceFile,
} from 'ts-morph'
import type { ConfigEdit, ConfigEditOutcome, ConfigFileView, ManagedPlugin } from './protocol/index.ts'
import { toExportName } from './resolveConfig.ts'

/**
 * A value Studio can round-trip through JSON and print back as a config literal.
 */
export type OptionValue = string | number | boolean | null | Array<OptionValue> | { [key: string]: OptionValue }

export type ApplyResult = {
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

function createProject(source: string): SourceFile {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: { quoteKind: QuoteKind.Single, indentationText: IndentationText.TwoSpaces, useTrailingCommas: true },
  })
  return project.createSourceFile('kubb.config.ts', source)
}

/**
 * Steps through parentheses and a `() => ...` / `(cli) => ...` wrapper to the expression underneath.
 */
function unwrap(node: Node): Node {
  if (Node.isParenthesizedExpression(node)) {
    return unwrap(node.getExpression())
  }
  if (Node.isArrowFunction(node)) {
    const body = node.getBody()
    return Node.isBlock(body) ? node : unwrap(body)
  }
  return node
}

/**
 * The config object inside `export default defineConfig(...)`, or why the file is unmanaged.
 */
function findConfigObject(file: SourceFile): { object: ObjectLiteralExpression } | { reason: string } {
  const exported = file.getExportAssignment((assignment) => !assignment.isExportEquals())
  if (!exported) {
    return { reason: 'no default export found' }
  }

  const call = unwrap(exported.getExpression())
  if (!Node.isCallExpression(call) || call.getExpression().getText() !== 'defineConfig') {
    return { reason: 'default export is not a defineConfig(...) call' }
  }

  const [argument] = call.getArguments()
  if (!argument) {
    return { reason: 'defineConfig(...) was called without a config' }
  }

  const config = unwrap(argument)
  if (!Node.isObjectLiteralExpression(config)) {
    return { reason: 'config is not a single object literal, array configs are not supported' }
  }
  return { object: config }
}

function getPropertyAssignment(object: ObjectLiteralExpression, key: string): PropertyAssignment | undefined {
  const property = object.getProperty(key)
  return property && Node.isPropertyAssignment(property) ? property : undefined
}

function getPluginsArray(file: SourceFile): { array: ArrayLiteralExpression } | { reason: string } {
  const config = findConfigObject(file)
  if ('reason' in config) {
    return config
  }
  const plugins = getPropertyAssignment(config.object, 'plugins')
  const initializer = plugins?.getInitializer()
  if (!initializer || !Node.isArrayLiteralExpression(initializer)) {
    return { reason: 'plugins is not an array literal' }
  }
  return { array: initializer }
}

/**
 * True for a primitive, or an object/array built only from primitives.
 */
function isLiteral(node: Node): boolean {
  if (Node.isStringLiteral(node) || Node.isNumericLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return true
  }
  if (Node.isTrueLiteral(node) || Node.isFalseLiteral(node) || Node.isNullLiteral(node)) {
    return true
  }
  if (Node.isPrefixUnaryExpression(node)) {
    return isLiteral(node.getOperand())
  }
  if (Node.isArrayLiteralExpression(node)) {
    return node.getElements().every(isLiteral)
  }
  if (Node.isObjectLiteralExpression(node)) {
    return node.getProperties().every((property) => Node.isPropertyAssignment(property) && isLiteral(property.getInitializerOrThrow()))
  }
  return false
}

/**
 * Maps a factory identifier in the file back to the module it was imported from.
 */
function importedFrom(file: SourceFile): Map<string, string> {
  const byName = new Map<string, string>()
  for (const declaration of file.getImportDeclarations()) {
    for (const named of declaration.getNamedImports()) {
      // Keyed by the local binding: that is what a plugin call in the file actually names.
      byName.set(named.getAliasNode()?.getText() ?? named.getName(), declaration.getModuleSpecifierValue())
    }
  }
  return byName
}

/**
 * Every `pluginX(...)` element of the plugins array that resolves to an import.
 */
function resolvePluginCalls(file: SourceFile, array: ArrayLiteralExpression): Array<{ call: CallExpression; importName: string; packageName: string }> {
  const imports = importedFrom(file)
  const resolved: Array<{ call: CallExpression; importName: string; packageName: string }> = []

  for (const element of array.getElements()) {
    if (!Node.isCallExpression(element)) {
      continue
    }
    const callee = element.getExpression()
    if (!Node.isIdentifier(callee)) {
      continue
    }
    const importName = callee.getText()
    const packageName = imports.get(importName)
    if (packageName) {
      resolved.push({ call: element, importName, packageName })
    }
  }
  return resolved
}

/**
 * Reads which plugins the file declares and which of their options Studio may write.
 *
 * @example
 * ```ts
 * const view = readConfig(await readFile('kubb.config.ts', 'utf8'))
 * if (view.managed) {
 *   view.plugins.forEach((plugin) => console.log(plugin.packageName, plugin.options))
 * }
 * ```
 */
export function readConfig(source: string): ConfigFileView {
  const file = createProject(source)
  const plugins = getPluginsArray(file)
  if ('reason' in plugins) {
    return { managed: false, reason: plugins.reason }
  }

  return {
    managed: true,
    plugins: resolvePluginCalls(file, plugins.array).map(({ call, importName, packageName }) => {
      const options: ManagedPlugin['options'] = {}
      const [argument] = call.getArguments()

      if (argument && Node.isObjectLiteralExpression(argument)) {
        for (const property of argument.getProperties()) {
          if (Node.isPropertyAssignment(property)) {
            options[property.getName().replace(/^['"]|['"]$/g, '')] = { literal: isLiteral(property.getInitializerOrThrow()) }
          }
        }
      }
      return { importName, packageName, options }
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
 * The options object of a plugin call, creating an empty one when the plugin was called bare.
 */
function optionsObjectOf(call: CallExpression): ObjectLiteralExpression | undefined {
  const [argument] = call.getArguments()
  if (argument) {
    return Node.isObjectLiteralExpression(argument) ? argument : undefined
  }
  return call.addArgument('{}') as ObjectLiteralExpression
}

function applySet(call: CallExpression, path: Array<string>, value: unknown): string | undefined {
  if (!isOptionValue(value)) {
    return 'the value is not a literal that can be written to a config file'
  }

  const options = optionsObjectOf(call)
  if (!options) {
    return 'the plugin was not called with an object literal'
  }

  let object = options
  for (const [index, key] of path.entries()) {
    const last = index === path.length - 1
    const property = getPropertyAssignment(object, key)

    if (!property) {
      object.addPropertyAssignment({ name: key, initializer: printValue(last ? value : {}) })
      if (last) {
        return undefined
      }
      object = getPropertyAssignment(object, key)!.getInitializerOrThrow() as ObjectLiteralExpression
      continue
    }

    const initializer = property.getInitializerOrThrow()

    if (last) {
      if (!isLiteral(initializer)) {
        return `${path.join('.')} is customized in code`
      }
      property.setInitializer(printValue(value))
      return undefined
    }

    if (!Node.isObjectLiteralExpression(initializer)) {
      return `${key} is not an object, so ${path.join('.')} cannot be reached`
    }
    object = initializer
  }
  return 'no option path given'
}

/**
 * Re-adds the trailing comma `remove()` strips off the new last property of a multi-line object.
 */
function restoreTrailingComma(object: ObjectLiteralExpression): void {
  const last = object.getProperties().at(-1)
  if (!last || !object.getText().includes('\n')) {
    return
  }
  const between = object.getSourceFile().getFullText().slice(last.getEnd(), object.getEnd())
  if (!between.trimStart().startsWith(',')) {
    object.getSourceFile().insertText(last.getEnd(), ',')
  }
}

function applyRemove(call: CallExpression, path: Array<string>): string | undefined {
  const [argument] = call.getArguments()
  if (!argument || !Node.isObjectLiteralExpression(argument)) {
    return 'the plugin has no options to remove'
  }

  let object: ObjectLiteralExpression = argument
  for (const [index, key] of path.entries()) {
    const property = getPropertyAssignment(object, key)
    if (!property) {
      return `${path.join('.')} is not set`
    }
    const initializer = property.getInitializerOrThrow()

    if (index === path.length - 1) {
      if (!isLiteral(initializer)) {
        return `${path.join('.')} is customized in code`
      }
      const wasLast = object.getProperties().at(-1) === property
      const owner = object
      property.remove()
      // Removing the final property takes the comma of the one before it with it, which would
      // leave the object's last line inconsistent with every other line in the file.
      if (wasLast) {
        restoreTrailingComma(owner)
      }
      return undefined
    }

    if (!Node.isObjectLiteralExpression(initializer)) {
      return `${key} is not an object, so ${path.join('.')} cannot be reached`
    }
    object = initializer
  }
  return 'no option path given'
}

function applyAddPlugin(file: SourceFile, array: ArrayLiteralExpression, edit: Extract<ConfigEdit, { operation: 'add-plugin' }>): string | undefined {
  const importName = edit.importName ?? toExportName(edit.plugin)

  if (resolvePluginCalls(file, array).some((plugin) => plugin.packageName === edit.plugin)) {
    return `${edit.plugin} is already in the plugins array`
  }

  const taken = importedFrom(file).get(importName)
  if (taken && taken !== edit.plugin) {
    return `${importName} is already imported from ${taken}`
  }

  const options = edit.options ?? {}
  if (!isOptionValue(options)) {
    return 'the options are not literals that can be written to a config file'
  }

  array.addElement(`${importName}(${Object.keys(options).length ? printValue(options) : ''})`)

  if (!taken) {
    insertImport(file, importName, edit.plugin)
  }
  return undefined
}

/**
 * Writes an import after the last one already in the file.
 *
 * The text is written directly rather than through `addImportDeclaration`, which hardcodes a
 * terminating semicolon that no manipulation setting turns off. Kubb configs are written without
 * them, and printing the line here keeps the patcher from having to walk the whole file afterwards
 * undoing it.
 */
function insertImport(file: SourceFile, importName: string, moduleSpecifier: string): void {
  const imports = file.getImportDeclarations()
  const last = imports.at(-1)
  const quote = last?.getModuleSpecifier().getText().startsWith('"') ? '"' : "'"
  const semicolon = last?.getText().trimEnd().endsWith(';') ? ';' : ''
  const line = `import { ${importName} } from ${quote}${moduleSpecifier}${quote}${semicolon}`

  file.insertText(last ? last.getEnd() : 0, last ? `\n${line}` : `${line}\n`)
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
  const file = createProject(source)

  const outcomes = edits.map((edit): ConfigEditOutcome => {
    // Re-derived every edit. Of the mutations used here only `sourceFile.insertText` forgets nodes
    // taken before it, and only `restoreTrailingComma` reaches for it, but one such edit anywhere in
    // the batch would leave a captured array node stale for every edit after it.
    const plugins = getPluginsArray(file)
    if ('reason' in plugins) {
      return { edit, applied: false, reason: plugins.reason }
    }

    if (edit.operation === 'add-plugin') {
      const reason = applyAddPlugin(file, plugins.array, edit)
      return { edit, applied: !reason, reason }
    }

    const target = resolvePluginCalls(file, plugins.array).find((plugin) => plugin.packageName === edit.plugin)
    if (!target) {
      return { edit, applied: false, reason: `${edit.plugin} is not in the plugins array` }
    }

    const reason = edit.operation === 'set' ? applySet(target.call, edit.path, edit.value) : applyRemove(target.call, edit.path)
    return { edit, applied: !reason, reason }
  })

  const next = file.getFullText()
  return { source: next, outcomes, changed: next !== source }
}
