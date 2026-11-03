import { nodeKinds } from '../constants.ts'
import type { CodeNode } from '../nodes/code.ts'
import { createFile } from '../nodes/file.ts'
import type { FileNode, ImportNode } from '../nodes/file.ts'
import { importLocalName } from './combineFileMembers.ts'
import { CODE_NODE_TEXT_FIELDS } from './extractStringsFromNodes.ts'

type InlineFilesResult = {
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

type InlineFilesOptions = {
  /**
   * The inline support for a file's language, or `undefined` when it has none.
   */
  language: (file: FileNode) => InlineLanguage | undefined
}

/**
 * Replaces every name a file imports from a virtual file (one whose sources are all inline, so it is never written) with that name's
 * `inline.expression`, until no inline names are left. The definitions' own imports move to the importing file.
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { language }: InlineFilesOptions): InlineFilesResult {
  const virtualFiles = new Map(
    files.filter((file) => file.sources.length > 0 && file.sources.every((source) => source.inline)).map((file) => [file.path, file]),
  )
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
    const inline = file.sources.find((source) => source.name === name)?.inline
    if (!inline) {
      result.problems.push({ path: from, message: `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.` })
      return undefined
    }

    definitions.set(key, null)
    const imports: Array<ImportNode> = []
    const { text, used } = replaceNames(inline.expression, file, lang, imports)
    imports.push(...file.imports.flatMap((imp) => (virtualFiles.has(imp.path) ? [] : pickNames(imp, used))))

    const definition = { expression: text, imports }
    definitions.set(key, definition)
    return definition
  }

  // Pushes the imports the replaced definitions need onto `imports`; `used` holds the names left as they are.
  function replaceNames(input: string, file: FileNode, lang: InlineLanguage, imports: Array<ImportNode>) {
    const used = new Set<string>()
    const text = lang.replaceIdentifiers(input, (local) => {
      const target = findTarget(file, local)
      const definition = target && define(target.path, target.name, file.path, lang)
      if (!definition) {
        used.add(local)
        return undefined
      }

      imports.push(...definition.imports)
      return lang.wrap(definition.expression)
    })

    return { text, used }
  }

  function findTarget(file: FileNode, local: string): { path: string; name: string } | undefined {
    if (virtualFiles.has(file.path) && file.sources.some((source) => source.name === local)) return { path: file.path, name: local }

    for (const imp of file.imports) {
      const item = virtualFiles.has(imp.path) && [imp.name].flat().find((item) => importLocalName(item) === local)
      if (item) return { path: imp.path, name: typeof item === 'string' ? item : item.propertyName }
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

    const carried: Array<ImportNode> = []
    const sources = file.sources.map((source) => ({ ...source, nodes: rewriteNodes(source.nodes, (text) => replaceNames(text, file, lang, carried).text) }))

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const imports = [...file.imports.filter((imp) => !virtualFiles.has(imp.path)), ...carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))]

    result.files.push(createFile({ ...file, sources, imports }))
  }

  return result
}

function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  if (!Array.isArray(imp.name)) return used.has(imp.name) ? [imp] : []
  const name = imp.name.filter((item) => used.has(importLocalName(item)))
  return name.length > 0 ? [{ ...imp, name }] : []
}

// Rewrites the string fields `extractStringsFromNodes` reads; JSDoc stays as written.
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
