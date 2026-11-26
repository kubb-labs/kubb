import { nodeKinds } from '../constants.ts'
import type { CodeNode } from '../nodes/code.ts'
import { createFile, createImport } from '../nodes/file.ts'
import type { FileNode, ImportNode, SourceNode } from '../nodes/file.ts'
import { getNames } from './moduleNames.ts'
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
 * Replaces every name a file imports from a virtual file (one marked `inline`, so it is never written) with the body of that name's
 * declaration, until no inline names are left. The definitions' own imports move to the importing file.
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
    const { text, used } = replaceNames(expression, file, lang, imports)
    imports.push(...file.imports.flatMap((imp) => (virtualFiles.has(imp.path) ? [] : pickNames(imp, used))))

    const definition = { expression: text, imports }
    definitions.set(key, definition)
    return definition
  }

  // Pushes the imports the replaced definitions need onto `imports`; `used` holds the names left as they are.
  // `renames` maps a carried import's name to the alias it takes in the importing file.
  function replaceNames(input: string, file: FileNode, lang: InlineLanguage, imports: Array<ImportNode>, renames?: ReadonlyMap<string, string>) {
    const used = new Set<string>()
    const text = lang.replaceIdentifiers(input, (local) => {
      const target = findTarget(file, local)
      const definition = target && define(target.path, target.name, file.path, lang)
      if (!definition) {
        used.add(local)
        return undefined
      }

      imports.push(...definition.imports)
      const expression = renames?.size ? lang.replaceIdentifiers(definition.expression, (name) => renames.get(name)) : definition.expression
      return lang.wrap(expression)
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

    const lang = language(file)
    if (!lang) {
      result.problems.push({ path: file.path, message: `No parser for "${file.extname}" files supports inline sources.` })
      continue
    }

    const inline = (renames?: ReadonlyMap<string, string>) => {
      const carried: Array<ImportNode> = []
      const sources = file.sources.map((source) => ({
        ...source,
        nodes: rewriteNodes(source.nodes, (text) => replaceNames(text, file, lang, carried, renames).text),
      }))
      return { sources, carried }
    }
    const firstPass = inline()
    // A carried name the file already uses for something else, such as a schema `Options` next to the client's own `Options`, gets an alias.
    const renames = findClashes(file, firstPass.carried, virtualFiles)
    const { sources, carried } = renames.size ? inline(renames) : firstPass

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const imports = [
      ...file.imports.filter((imp) => !virtualFiles.has(imp.path)),
      ...carried.map((imp) => aliasImport(imp.root ? { ...imp, root: file.path } : imp, renames)),
    ]

    result.files.push(createFile({ ...file, sources, imports }))
  }

  return result
}

// The local names a file declares or imports from a written file, each with the path it comes from.
function takenNames(file: FileNode, virtualFiles: ReadonlyMap<string, FileNode>): Map<string, string> {
  const taken = new Map<string, string>()
  for (const source of file.sources) if (source.name) taken.set(source.name, file.path)
  for (const imp of file.imports) {
    if (virtualFiles.has(imp.path)) continue
    for (const item of getNames(imp)) taken.set(item.alias ?? item.name, imp.path)
  }
  return taken
}

// Picks an alias, such as `Options2`, for each carried name that the file already takes from another module.
function findClashes(file: FileNode, carried: ReadonlyArray<ImportNode>, virtualFiles: ReadonlyMap<string, FileNode>): Map<string, string> {
  const taken = takenNames(file, virtualFiles)
  const renames = new Map<string, string>()
  for (const imp of carried) {
    for (const item of getNames(imp)) {
      const local = item.alias ?? item.name
      const owner = taken.get(local)
      if (owner === undefined || owner === imp.path || renames.has(local)) continue

      let index = 2
      while (taken.has(`${local}${index}`)) index++
      const alias = `${local}${index}`
      renames.set(local, alias)
      taken.set(alias, imp.path)
    }
  }
  return renames
}

function aliasImport(imp: ImportNode, renames: ReadonlyMap<string, string>): ImportNode {
  const names = getNames(imp)
  if (!names.some((item) => renames.has(item.alias ?? item.name))) return imp
  return createImport({
    path: imp.path,
    ...(imp.root != null ? { root: imp.root } : {}),
    names: names.map((item) => {
      const alias = renames.get(item.alias ?? item.name)
      return alias ? { ...item, alias } : item
    }),
  })
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
