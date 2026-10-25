import { nodeKinds } from '../constants.ts'
import type { CodeNode } from '../nodes/code.ts'
import { createFile } from '../nodes/file.ts'
import type { FileNode, ImportNode } from '../nodes/file.ts'

/**
 * Whether every source of `file` is inline. Other files absorb such a file, so it is never written.
 */
export function isVirtualFile(file: FileNode): boolean {
  return file.sources.length > 0 && file.sources.every((source) => source.inline)
}

/**
 * The result of {@link inlineFiles}.
 */
type InlineFilesResult = {
  /**
   * Files that imported an inline name, rewritten to hold its definition and the imports that definition needs.
   */
  files: Array<FileNode>
  /**
   * Paths of the virtual files. They are not written.
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
 * Each language decides what counts as a reference to a name and how a definition replaces it.
 */
export type InlineLanguage = {
  /**
   * Calls `replace` for every identifier in `text` that references something, and swaps in what it returns.
   * Skips what never references a name in the language, such as strings and comments.
   */
  replaceIdentifiers(text: string, replace: (name: string) => string | undefined): string
  /**
   * Makes `expression` safe to put where a name was, such as `(A | B)` in TypeScript.
   */
  wrap(expression: string): string
}

type InlineFilesOptions = {
  /**
   * The inline support for a file's language, or `undefined` when its language has none.
   */
  language: (file: FileNode) => InlineLanguage | undefined
}

/**
 * Replaces every name a file imports from a virtual file (see {@link isVirtualFile}) with that name's
 * `inline.expression`, until no inline names are left. The definitions' own imports move to the
 * importing file, limited to the names the definitions use.
 *
 * @example
 * ```ts
 * // models/pet/AddPet.ts (virtual): type AddPetOptions = { body: Pet }, importing Pet from models/Pet.ts
 * // clients/addPet.ts: import type { AddPetOptions } from '../models/pet/AddPet'
 * inlineFiles(files).files
 * // clients/addPet.ts: import type { Pet } from '../models/Pet', with `({ body: Pet })` where `AddPetOptions` was
 * ```
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { language }: InlineFilesOptions): InlineFilesResult {
  const virtualFiles = new Map(files.filter(isVirtualFile).map((file) => [file.path, file]))
  const result: InlineFilesResult = { files: [], virtualPaths: [...virtualFiles.keys()], problems: [] }
  if (virtualFiles.size === 0) return result

  // `null` marks a definition that is being resolved, so a name that reaches itself is a cycle.
  const definitions = new Map<string, Definition | null>()

  function define(path: string, name: string, from: string): Definition | undefined {
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
    const lang = languageOf(file)
    if (!lang) return undefined
    definitions.set(key, null)
    const { text, imports, used } = substitute(inline.expression, file, lang)
    const own = file.imports.flatMap((imp) => (virtualFiles.has(imp.path) ? [] : pickNames(imp, used)))
    const definition = { expression: text, imports: [...imports, ...own] }
    definitions.set(key, definition)
    return definition
  }

  function languageOf(file: FileNode): InlineLanguage | undefined {
    const lang = language(file)
    if (!lang) result.problems.push({ path: file.path, message: `No parser for "${file.extname}" files supports inline sources.` })
    return lang
  }

  // Replaces the inline names `file` can see: its own inline sources and what it imports from virtual files.
  function substitute(input: string, file: FileNode, lang: InlineLanguage) {
    const imports: Array<ImportNode> = []
    const used = new Set<string>()
    const text = lang.replaceIdentifiers(input, (local) => {
      const target = findTarget(file, local)
      const definition = target && define(target.path, target.name, file.path)
      if (!definition) {
        used.add(local)
        return undefined
      }
      imports.push(...definition.imports)
      return lang.wrap(definition.expression)
    })
    return { text, imports, used }
  }

  function findTarget(file: FileNode, local: string): { path: string; name: string } | undefined {
    if (virtualFiles.has(file.path) && file.sources.some((source) => source.name === local)) return { path: file.path, name: local }
    for (const imp of file.imports) {
      if (!virtualFiles.has(imp.path)) continue
      for (const item of [imp.name].flat()) {
        if (item === local) return { path: imp.path, name: local }
        if (typeof item === 'object' && (item.name ?? item.propertyName) === local) return { path: imp.path, name: item.propertyName }
      }
    }
    return undefined
  }

  for (const file of files) {
    if (virtualFiles.has(file.path) || !file.imports.some((imp) => virtualFiles.has(imp.path))) continue
    const lang = languageOf(file)
    if (!lang) continue
    const carried: Array<ImportNode> = []
    const rewrite = (input: string) => {
      const { text, imports } = substitute(input, file, lang)
      carried.push(...imports)
      return text
    }
    const sources = file.sources.map((source) => ({ ...source, nodes: rewriteNodes(source.nodes, rewrite) }))

    const kept = file.imports.filter((imp) => !virtualFiles.has(imp.path))
    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const imports = [...kept, ...carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))]
    result.files.push(createFile({ ...file, sources, imports }))
  }

  return result
}

// The part of `imp` whose local names are in `used`, or nothing when none are.
function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  if (!Array.isArray(imp.name)) return used.has(imp.name) ? [imp] : []
  const name = imp.name.filter((item) => used.has(typeof item === 'string' ? item : (item.name ?? item.propertyName)))
  return name.length > 0 ? [{ ...imp, name }] : []
}

// Rewrites the string fields `extractStringsFromNodes` reads; JSDoc stays as written.
function rewriteNodes(nodes: Array<CodeNode> | undefined, rewrite: (text: string) => string): Array<CodeNode> | undefined {
  return nodes?.map((node): CodeNode => {
    // Backward-compat: compiled plugins may still pass bare strings at runtime
    if (typeof node === 'string') return rewrite(node) as unknown as CodeNode
    switch (node.kind) {
      case nodeKinds.break:
        return node
      case nodeKinds.text:
      case nodeKinds.jsx:
        return { ...node, value: rewrite(node.value) }
      case nodeKinds.function:
      case nodeKinds.arrowFunction:
        return {
          ...node,
          params: node.params && rewrite(node.params),
          generics: Array.isArray(node.generics) ? node.generics.map(rewrite) : node.generics && rewrite(node.generics),
          returnType: node.returnType && rewrite(node.returnType),
          nodes: rewriteNodes(node.nodes, rewrite),
        }
      case nodeKinds.const:
        return { ...node, type: node.type && rewrite(node.type), nodes: rewriteNodes(node.nodes, rewrite) }
      default:
        return { ...node, nodes: rewriteNodes(node.nodes, rewrite) }
    }
  })
}
