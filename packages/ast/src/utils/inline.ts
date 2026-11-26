import { nodeKinds } from '../constants.ts'
import { createText, createType } from '../nodes/code.ts'
import type { CodeNode } from '../nodes/code.ts'
import { createFile, createImport, createSource } from '../nodes/file.ts'
import type { FileNode, ImportNode, SourceNode } from '../nodes/file.ts'
import { uniqueName } from '@internals/utils'
import { getNames, getSpace } from './moduleNames.ts'
import { CODE_NODE_TEXT_FIELDS, getNodeText } from './nodeText.ts'

export type InlineFilesResult = {
  /**
   * Files that imported an inline name, rewritten to hold its definition.
   */
  files: Array<FileNode>
  /**
   * Paths of the virtual files, which are not written.
   */
  virtualPaths: Array<string>
  /**
   * One message per name that could not be inlined.
   */
  problems: Array<{ path: string; message: string }>
}

type Definition = { expression: string; imports: Array<ImportNode> }

/**
 * The language-specific half of {@link inlineFiles}, supplied by the parser that prints the file.
 */
export type InlineLanguage = {
  /**
   * Swaps in what `replace` returns for every identifier in `text` that references a name, skipping strings and comments.
   */
  replaceIdentifiers(text: string, replace: (name: string) => string | undefined): string
  /**
   * Makes `expression` safe to put where a name was, such as `(A | B)` in TypeScript.
   */
  wrap(expression: string): string
}

export type InlineFilesOptions = {
  /**
   * The inline support for a file's language, or `undefined` when it has none.
   */
  language: (file: FileNode) => InlineLanguage | undefined
}

/**
 * Moves what a file imports from a virtual file (one marked `inline`, so it is never written) into that file. A type used more
 * than once becomes one local, non-exported declaration. A type used once, a bare alias, and a value are written at each use.
 * The moved declarations' own imports move to the importing file.
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { language }: InlineFilesOptions): InlineFilesResult {
  const virtualFiles = new Map(files.filter(isInlineFile).map((file) => [file.path, file]))
  const result: InlineFilesResult = { files: [], virtualPaths: [...virtualFiles.keys()], problems: [] }
  if (virtualFiles.size === 0) return result

  // `null` marks a definition that is being resolved, so a name that reaches itself is a cycle.
  const definitions = new Map<string, Definition | null>()

  function define(path: string, name: string, from: string, lang: InlineLanguage): Definition | undefined {
    const key = `${path}\0${name}`
    if (definitions.has(key)) {
      const definition = definitions.get(key)
      if (definition === null) result.problems.push({ path: from, message: `"${name}" from "${path}" is defined in terms of itself.` })
      return definition ?? undefined
    }

    const file = virtualFiles.get(path)!
    const expression = bodyOf(file.sources.find((source) => source.name === name))
    if (expression === undefined) {
      result.problems.push({ path: from, message: `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.` })
      return undefined
    }

    definitions.set(key, null)
    const imports: Array<ImportNode> = []
    const { text, used } = replaceNames(expression, file, lang, (inner) => {
      imports.push(...inner.imports)
      return inner.expression
    })
    imports.push(...file.imports.flatMap((imp) => (virtualFiles.has(imp.path) ? [] : pickNames(imp, used))))

    const definition = { expression: text, imports }
    definitions.set(key, definition)
    return definition
  }

  // `use` takes each replaced definition's imports and returns its text; `used` holds the names left as they are.
  function replaceNames(input: string, file: FileNode, lang: InlineLanguage, use: (definition: Definition) => string) {
    const used = new Set<string>()
    const text = lang.replaceIdentifiers(input, (local) => {
      const target = findTarget(file, local)
      const definition = target && define(target.path, target.name, file.path, lang)
      if (!definition) {
        used.add(local)
        return undefined
      }

      return lang.wrap(use(definition))
    })

    return { text, used }
  }

  function findTarget(file: FileNode, local: string): { path: string; name: string } | undefined {
    if (virtualFiles.has(file.path) && file.sources.some((source) => source.name === local)) return { path: file.path, name: local }

    for (const imp of file.imports) {
      const item = virtualFiles.has(imp.path) && getNames(imp).find((item) => (item.alias ?? item.name) === local)
      if (item) return { path: imp.path, name: item.name }
    }

    return undefined
  }

  for (const file of files) {
    if (virtualFiles.has(file.path) || !file.imports.some((imp) => virtualFiles.has(imp.path))) continue

    const fileLanguage = language(file)
    if (!fileLanguage) {
      result.problems.push({ path: file.path, message: `No parser for "${file.extname}" files supports inline sources.` })
      continue
    }
    const lang = fileLanguage

    const carried: Array<ImportNode> = []
    const { alias, carry, bind, reserve } = carryImports(file, lang, carried)
    const declarations: Array<SourceNode> = []
    const locals = new Map<string, string>()
    const uses = new Map<string, number>()
    const writing = new Set<string>()

    // Counts how often the file references each type. A declared type's body is read once; a bare alias is written at each use.
    function count(from: FileNode, text: string, aliases = new Set<string>()): void {
      lang.replaceIdentifiers(text, (id) => {
        const target = findTypeTarget(from, id)
        if (!target) return undefined
        const seen = uses.get(target.key) ?? 0
        uses.set(target.key, seen + 1)
        if (target.expression === undefined) return undefined
        // A bare alias is followed at each use, so the aliases already being followed stop a loop between two of them.
        if (isBareName(target.expression) && !aliases.has(target.key)) count(target.file, target.expression, new Set([...aliases, target.key]))
        else if (seen === 0) count(target.file, target.expression)
        return undefined
      })
    }

    // Keeps each global in a body the file inlines, type or value, such as the fetch `Response`, free so no local declaration
    // shadows it. Runs before any local name is chosen.
    const visited = new Set<string>()
    function reserveGlobals(from: FileNode, text: string): void {
      lang.replaceIdentifiers(text, (id) => {
        const target = findTarget(from, id)
        if (!target) {
          if (from !== file && !importsName(from, id)) reserve(id)
          return undefined
        }
        const key = `${target.path}\0${target.name}`
        if (visited.has(key)) return undefined
        visited.add(key)
        const virtualFile = virtualFiles.get(target.path)!
        const body = bodyOf(virtualFile.sources.find((item) => item.name === target.name))
        if (body !== undefined) reserveGlobals(virtualFile, body)
        return undefined
      })
    }

    function findTypeTarget(from: FileNode, id: string) {
      const target = findTarget(from, id)
      if (!target) return undefined
      const virtualFile = virtualFiles.get(target.path)!
      const source = virtualFile.sources.find((item) => item.name === target.name)
      if (!source || getSpace(source) !== 'type') return undefined
      return { ...target, key: `${target.path}\0${target.name}`, file: virtualFile, expression: bodyOf(source) }
    }

    // A type used more than once becomes one local declaration; one used once, or a bare alias, is written where it is used.
    function writeType(target: NonNullable<ReturnType<typeof findTypeTarget>>): string | undefined {
      const { expression, key } = target
      if (expression === undefined)
        return report(`"${target.name}" is imported from "${target.path}", which never writes it and has no inline definition for it.`)
      const existing = locals.get(key)
      if (existing) return existing

      const local = declareName(target, expression)
      if (!local && writing.has(key)) return report(`"${target.name}" from "${target.path}" is defined in terms of itself.`)

      writing.add(key)
      const body = writeBody(target.file, expression)
      writing.delete(key)
      if (!local) return lang.wrap(body)

      declarations.push(createSource({ name: local, isTypeOnly: true, nodes: [createType({ name: local, nodes: [createText(body)] })] }))
      return local
    }

    // Reserves the local name of a type used more than once, before its body is written, so a type that refers to itself, such
    // as a tree node, can use it. A type used once, or a bare alias, gets none and is written where it is used.
    function declareName(target: { key: string; name: string }, expression: string): string | undefined {
      if ((uses.get(target.key) ?? 0) < 2 || isBareName(expression)) return undefined
      const local = bind(target.key, target.name)
      locals.set(target.key, local)
      return local
    }

    function report(message: string): undefined {
      result.problems.push({ path: file.path, message })
      return undefined
    }

    // A type's body with the names it uses resolved, and the imports it needs carried into the file.
    // The carried imports are aliased first, so the alias pass never renames a local name the body resolves to.
    function writeBody(from: FileNode, expression: string): string {
      const used = new Set<string>()
      lang.replaceIdentifiers(expression, (id) => {
        if (!findTarget(from, id)) used.add(id)
        return undefined
      })
      const aliases = alias(from.imports.flatMap((imp) => (virtualFiles.has(imp.path) ? [] : pickNames(imp, used))))
      return lang.replaceIdentifiers(expression, (id) => resolve(from, id) ?? aliases.get(id))
    }

    // What `id` in `from` becomes: a type's local name or body, or a value's body. `undefined` keeps it as it is.
    function resolve(from: FileNode, id: string): string | undefined {
      const typeTarget = findTypeTarget(from, id)
      if (typeTarget) {
        const written = writeType(typeTarget)
        return written === id ? undefined : written
      }
      const target = findTarget(from, id)
      const definition = target && define(target.path, target.name, from.path, lang)
      return definition ? lang.wrap(carry(definition)) : undefined
    }

    for (const source of file.sources) {
      rewriteNodes(source.nodes, (text) => {
        reserveGlobals(file, text)
        count(file, text)
        return text
      })
    }
    const rewritten = file.sources.map((source) => ({
      ...source,
      nodes: rewriteNodes(source.nodes, (text) => lang.replaceIdentifiers(text, (id) => resolve(file, id))),
    }))
    const sources = [...declarations, ...rewritten]

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const imports = [...file.imports.filter((imp) => !virtualFiles.has(imp.path)), ...carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))]

    result.files.push(createFile({ ...file, sources, imports }))
  }

  return result
}

// Moves each definition's imports into `carried` and returns the definition's text. A carried name the file already binds to
// something else, such as a schema `Options` next to the client's own `Options`, gets an alias like `Options2`.
function carryImports(file: FileNode, lang: InlineLanguage, carried: Array<ImportNode>) {
  // Each name the file uses, to the import (module and exported name) or declaration behind it. `''` marks a global, such as
  // the fetch `Response` next to a schema `Response`.
  const bindings = new Map<string, string>()
  const reserve = (name: string): void => {
    if (!bindings.has(name)) bindings.set(name, '')
  }
  for (const imp of file.imports) for (const item of getNames(imp)) bindings.set(item.alias ?? item.name, `${imp.path}\0${item.name}`)
  for (const source of file.sources) {
    if (source.name) bindings.set(source.name, file.path)
    rewriteNodes(source.nodes, (text) =>
      lang.replaceIdentifiers(text, (name) => {
        reserve(name)
        return undefined
      }),
    )
  }

  // Reserves a local name for `key` (module and exported name), such as a hoisted type, and returns it.
  const bind = (key: string, name: string): string => {
    const local = uniqueName(name, (candidate) => bindings.has(candidate) && bindings.get(candidate) !== key)
    bindings.set(local, key)
    return local
  }

  // Carries `imports` into the file and returns the alias of each carried name that clashed.
  const alias = (imports: Array<ImportNode>): Map<string, string> => {
    const aliases = new Map<string, string>()
    for (const imp of imports) {
      const before = aliases.size
      const names = getNames(imp).map((item) => {
        const local = item.alias ?? item.name
        const binding = `${imp.path}\0${item.name}`
        const name = uniqueName(local, (candidate) => bindings.has(candidate) && bindings.get(candidate) !== binding)
        bindings.set(name, binding)
        if (name === local) return item
        aliases.set(local, name)
        return { ...item, alias: name }
      })
      carried.push(aliases.size > before ? createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names }) : imp)
    }
    return aliases
  }

  const carry = (definition: Definition): string => {
    const aliases = alias(definition.imports)
    return aliases.size ? lang.replaceIdentifiers(definition.expression, (name) => aliases.get(name)) : definition.expression
  }

  return { alias, carry, bind, reserve }
}

function importsName(file: FileNode, local: string): boolean {
  return file.imports.some((imp) => getNames(imp).some((item) => (item.alias ?? item.name) === local))
}

// A type that only names another, such as `Error` or `ListPetsStatus200Headers`, costs less to repeat than to declare.
function isBareName(expression: string): boolean {
  return /^[\w$.]+$/.test(expression.trim())
}

// A file of only deprecated per-source `inline` counts as inline too.
function isInlineFile(file: FileNode): boolean {
  return !!file.inline || (file.sources.length > 0 && file.sources.every((source) => source.inline))
}

// The right-hand side of a `Const` or `Type`. A function body is not an expression, and printed text such as `Code` has none.
function bodyOf(source: SourceNode | undefined): string | undefined {
  if (source?.inline) return source.inline.expression
  const node = source?.nodes?.length === 1 ? source.nodes[0] : undefined
  if (node?.kind !== nodeKinds.const && node?.kind !== nodeKinds.type) return undefined
  return getNodeText(node.nodes) || undefined
}

function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  const names = getNames(imp).filter((item) => used.has(item.alias ?? item.name))
  return names.length > 0 ? [createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names })] : []
}

// Rewrites the string fields `getNodeText` reads; JSDoc stays as written.
function rewriteNodes(nodes: Array<CodeNode> | undefined, rewrite: (text: string) => string): Array<CodeNode> | undefined {
  return nodes?.map((node): CodeNode => {
    // Backward-compat: compiled plugins may still pass bare strings at runtime
    if (typeof node === 'string') return rewrite(node) as unknown as CodeNode
    if (node.kind === nodeKinds.break) return node

    const next = { ...node } as unknown as Record<string, unknown>
    for (const field of CODE_NODE_TEXT_FIELDS[node.kind] ?? []) {
      const value = next[field]
      if (Array.isArray(value)) next[field] = value.map(rewrite)
      if (typeof value === 'string' && value) next[field] = rewrite(value)
    }
    if ('nodes' in node && node.nodes) next.nodes = rewriteNodes(node.nodes, rewrite)
    return next as unknown as CodeNode
  })
}
