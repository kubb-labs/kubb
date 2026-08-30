import ts from 'typescript'

export type OptionValue = string | number | boolean | null | Array<OptionValue> | { [key: string]: OptionValue }

/** A plugin call Studio found in the `plugins` array of a `defineConfig(...)`. */
export type ManagedPlugin = {
  /** Local identifier of the factory, e.g. `pluginTs`. */
  importName: string
  /** Module the factory is imported from, e.g. `@kubb/plugin-ts`. */
  packageName: string
  /** Top-level option keys, each flagged as literal (editable) or not (read-only in the UI). */
  options: Record<string, { literal: boolean }>
}

export type ConfigView = { managed: true; plugins: Array<ManagedPlugin> } | { managed: false; reason: string }

function unwrap(node: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(node)) {
    return unwrap(node.expression)
  }
  if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) {
    return unwrap(node.body)
  }
  return node
}

function parse(source: string): ts.SourceFile {
  return ts.createSourceFile('kubb.config.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

/** Finds the config object literal inside `export default defineConfig(...)`, or the reason it is unmanaged. */
function findConfigObject(file: ts.SourceFile): { object: ts.ObjectLiteralExpression } | { reason: string } {
  const exported = file.statements.find(ts.isExportAssignment)
  if (!exported) {
    return { reason: 'no default export found' }
  }

  const call = unwrap(exported.expression)
  if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== 'defineConfig') {
    return { reason: 'default export is not a defineConfig(...) call' }
  }

  const argument = call.arguments[0]
  if (!argument) {
    return { reason: 'defineConfig(...) was called without a config' }
  }

  const config = unwrap(argument)
  if (!ts.isObjectLiteralExpression(config)) {
    return { reason: 'config is not a single object literal (array configs are not supported)' }
  }
  return { object: config }
}

function getProperty(object: ts.ObjectLiteralExpression, key: string): ts.PropertyAssignment | undefined {
  return object.properties.find((property): property is ts.PropertyAssignment => {
    return ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && property.name.text === key
  })
}

/** A value Studio can round-trip: a primitive, or an object/array built only from those. */
function isLiteral(node: ts.Expression): boolean {
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return true
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) {
    return true
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    return isLiteral(node.operand)
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every(isLiteral)
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every((property) => ts.isPropertyAssignment(property) && isLiteral(property.initializer))
  }
  return false
}

/** Maps a factory identifier back to the module it was imported from. */
function resolveImports(file: ts.SourceFile): Map<string, string> {
  const byName = new Map<string, string>()
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue
    }
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) {
      continue
    }
    for (const element of bindings.elements) {
      byName.set(element.name.text, statement.moduleSpecifier.text)
    }
  }
  return byName
}

function findPluginCall(file: ts.SourceFile, importName: string): ts.CallExpression | undefined {
  const config = findConfigObject(file)
  if ('reason' in config) {
    return undefined
  }
  const plugins = getProperty(config.object, 'plugins')
  if (!plugins || !ts.isArrayLiteralExpression(plugins.initializer)) {
    return undefined
  }
  return plugins.initializer.elements.find((element): element is ts.CallExpression => {
    return ts.isCallExpression(element) && ts.isIdentifier(element.expression) && element.expression.text === importName
  })
}

/** Reads which plugins are present and which of their options Studio may edit. */
export function readConfig(source: string): ConfigView {
  const file = parse(source)
  const config = findConfigObject(file)
  if ('reason' in config) {
    return { managed: false, reason: config.reason }
  }

  const plugins = getProperty(config.object, 'plugins')
  if (!plugins || !ts.isArrayLiteralExpression(plugins.initializer)) {
    return { managed: false, reason: 'plugins is not an array literal' }
  }

  const imports = resolveImports(file)
  const found: Array<ManagedPlugin> = []

  for (const element of plugins.initializer.elements) {
    if (!ts.isCallExpression(element) || !ts.isIdentifier(element.expression)) {
      continue
    }
    const importName = element.expression.text
    const packageName = imports.get(importName)
    if (!packageName) {
      continue
    }

    const options: ManagedPlugin['options'] = {}
    const argument = element.arguments[0]
    if (argument && ts.isObjectLiteralExpression(argument)) {
      for (const property of argument.properties) {
        if (!ts.isPropertyAssignment(property) || (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))) {
          continue
        }
        options[property.name.text] = { literal: isLiteral(property.initializer) }
      }
    }
    found.push({ importName, packageName, options })
  }

  return { managed: true, plugins: found }
}

/** Prints a value the way the repo writes config literals: single quotes, no trailing commas. */
function print(value: OptionValue): string {
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  }
  if (Array.isArray(value)) {
    return `[${value.map(print).join(', ')}]`
  }
  if (value !== null && typeof value === 'object') {
    return `{ ${Object.entries(value)
      .map(([key, entry]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`}: ${print(entry)}`)
      .join(', ')} }`
  }
  return String(value)
}

export type PatchResult = { patched: true; source: string } | { patched: false; reason: string }

/**
 * Replaces one literal option value in place, leaving every other byte of the file untouched.
 *
 * `path` walks nested object literals, so `['enum', 'type']` targets `pluginTs({ enum: { type } })`.
 */
export function patchOption(source: string, { importName, path, value }: { importName: string; path: Array<string>; value: OptionValue }): PatchResult {
  const file = parse(source)
  const call = findPluginCall(file, importName)
  if (!call) {
    return { patched: false, reason: `no ${importName}(...) call in the plugins array` }
  }

  const argument = call.arguments[0]
  if (argument && !ts.isObjectLiteralExpression(argument)) {
    return { patched: false, reason: `${importName}(...) was not called with an object literal` }
  }

  // No options object yet: `pluginTs()` becomes `pluginTs({ key: value })`.
  if (!argument) {
    if (path.length !== 1) {
      return { patched: false, reason: `cannot create a nested option on an empty ${importName}()` }
    }
    const insertAt = call.end - 1
    return { patched: true, source: `${source.slice(0, insertAt)}{ ${path[0]}: ${print(value)} }${source.slice(insertAt)}` }
  }

  let object = argument
  for (const [index, key] of path.entries()) {
    const property = getProperty(object, key)
    const last = index === path.length - 1

    if (!property) {
      if (!last) {
        return { patched: false, reason: `cannot create the nested path ${path.join('.')}` }
      }
      return { patched: true, source: insertProperty(source, object, key, print(value)) }
    }

    if (last) {
      if (!isLiteral(property.initializer)) {
        return { patched: false, reason: `${path.join('.')} is customized in code` }
      }
      return { patched: true, source: source.slice(0, property.initializer.getStart(file)) + print(value) + source.slice(property.initializer.end) }
    }

    if (!ts.isObjectLiteralExpression(property.initializer)) {
      return { patched: false, reason: `${key} is not an object, cannot reach ${path.join('.')}` }
    }
    object = property.initializer
  }

  return { patched: false, reason: 'empty path' }
}

/** Indentation of the line the node starts on. */
function indentOf(source: string, offset: number): string {
  const lineStart = source.lastIndexOf('\n', offset - 1) + 1
  return source.slice(lineStart, offset).match(/^\s*/)?.[0] ?? ''
}

function insertProperty(source: string, object: ts.ObjectLiteralExpression, key: string, printed: string): string {
  const last = object.properties[object.properties.length - 1]
  if (!last) {
    const insertAt = object.end - 1
    return `${source.slice(0, insertAt)} ${key}: ${printed} ${source.slice(insertAt)}`
  }
  // Multi-line objects get their own line; single-line ones stay on one line.
  if (source.slice(last.end, object.end).includes('\n')) {
    return `${source.slice(0, last.end)},\n${indentOf(source, last.getStart(object.getSourceFile()))}${key}: ${printed}${source.slice(last.end)}`
  }
  return `${source.slice(0, last.end)}, ${key}: ${printed}${source.slice(last.end)}`
}

/**
 * Adds a plugin factory call to the `plugins` array and its import, when neither is there yet.
 * Existing array elements and imports are not reprinted.
 */
export function insertPlugin(
  source: string,
  { importName, packageName, options = {} }: { importName: string; packageName: string; options?: Record<string, OptionValue> },
): PatchResult {
  const file = parse(source)
  if (findPluginCall(file, importName)) {
    return { patched: false, reason: `${importName}(...) is already in the plugins array` }
  }

  const config = findConfigObject(file)
  if ('reason' in config) {
    return { patched: false, reason: config.reason }
  }
  const plugins = getProperty(config.object, 'plugins')
  if (!plugins || !ts.isArrayLiteralExpression(plugins.initializer)) {
    return { patched: false, reason: 'plugins is not an array literal' }
  }

  const printed = Object.keys(options).length ? print(options as OptionValue) : ''
  const array = plugins.initializer
  const lastElement = array.elements[array.elements.length - 1]
  const indent = lastElement ? indentOf(source, lastElement.getStart(file)) : `${indentOf(source, plugins.getStart(file))}  `

  // Insert after the last element (and past its trailing comma, if it has one) so nothing existing
  // is rewritten. An empty array gets its first entry right after the opening bracket.
  let insertAt = lastElement ? lastElement.end : array.getStart(file) + 1
  let separator = ''
  if (lastElement) {
    const comma = source.slice(insertAt, array.end - 1).match(/^\s*,/)
    if (comma) {
      insertAt += comma[0].length
    } else {
      separator = ','
    }
  }
  const closing = lastElement ? '' : `\n${indentOf(source, plugins.getStart(file))}`
  let next = `${source.slice(0, insertAt)}${separator}\n${indent}${importName}(${printed}),${closing}${source.slice(insertAt)}`

  // The array insert shifted every later offset, so the import goes in against a fresh parse.
  if (!resolveImports(parse(next)).has(importName)) {
    const imports = parse(next).statements.filter(ts.isImportDeclaration)
    const anchor = imports[imports.length - 1]
    const at = anchor ? anchor.end : 0
    next = `${next.slice(0, at)}${anchor ? '\n' : ''}import { ${importName} } from '${packageName}'${anchor ? '' : '\n'}${next.slice(at)}`
  }

  return { patched: true, source: next }
}
