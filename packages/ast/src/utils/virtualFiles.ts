import { nodeKinds } from '../constants.ts'
import { createImport } from '../nodes/file.ts'
import type { FileNode, ImportNode, SourceNode } from '../nodes/file.ts'
import { getNames, getSpace } from './moduleNames.ts'
import { getNodeText } from './nodeText.ts'

/**
 * The language-specific half of `inlineFiles`, supplied by the parser that prints the file.
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

export type Definition = { expression: string; imports: Array<ImportNode> }

// A name imported from, or declared in, a virtual file. `key` is its module and exported name.
export type Target = { key: string; name: string; path: string; file: FileNode; isType: boolean; expression: string | undefined }

// The virtual files of one run, and the values defined from them, shared by every importing file.
export class VirtualFiles {
  readonly problems: Array<{ path: string; message: string }> = []
  readonly #files: Map<string, FileNode>
  // `null` marks a definition that is being resolved, so a name that reaches itself is a cycle.
  readonly #definitions = new Map<string, Definition | null>()

  constructor(files: ReadonlyArray<FileNode>) {
    this.#files = new Map(files.map((file) => [file.path, file]))
  }

  get paths(): Array<string> {
    return [...this.#files.keys()]
  }

  has(path: string): boolean {
    return this.#files.has(path)
  }

  report(path: string, message: string): undefined {
    this.problems.push({ path, message })
    return undefined
  }

  // What `local` in `from` names in a virtual file, or `undefined` when it names nothing virtual.
  find(from: FileNode, local: string): Target | undefined {
    const at = this.#locate(from, local)
    const file = at && this.#files.get(at.path)
    if (!at || !file) return undefined
    const source = file.sources.find((item) => item.name === at.name)
    return { ...at, key: `${at.path}\0${at.name}`, file, isType: !!source && getSpace(source) === 'type', expression: bodyOf(source) }
  }

  #locate(from: FileNode, local: string): { path: string; name: string } | undefined {
    if (this.#files.has(from.path) && from.sources.some((source) => source.name === local)) return { path: from.path, name: local }
    for (const imp of from.imports) {
      const item = this.#files.has(imp.path) && getNames(imp).find((item) => (item.alias ?? item.name) === local)
      if (item) return { path: imp.path, name: item.name }
    }
    return undefined
  }

  // The imports from real modules that `file` needs for the names in `used`.
  importsFor(file: FileNode, used: ReadonlySet<string>): Array<ImportNode> {
    return file.imports.flatMap((imp) => (this.#files.has(imp.path) ? [] : pickNames(imp, used)))
  }

  // A value's body with every virtual name it uses replaced by its own body, and the imports that body needs.
  define(target: Target, from: string, lang: InlineLanguage): Definition | undefined {
    const { key, name, path, file, expression } = target
    if (this.#definitions.has(key)) {
      const definition = this.#definitions.get(key)
      if (definition === null) this.report(from, `"${name}" from "${path}" is defined in terms of itself.`)
      return definition ?? undefined
    }
    if (expression === undefined) return this.report(from, `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.`)

    this.#definitions.set(key, null)
    const imports: Array<ImportNode> = []
    const used = new Set<string>()
    const text = lang.replaceIdentifiers(expression, (local) => {
      const inner = this.find(file, local)
      const definition = inner && this.define(inner, file.path, lang)
      if (!definition) {
        used.add(local)
        return undefined
      }
      imports.push(...definition.imports)
      return lang.wrap(definition.expression)
    })
    imports.push(...this.importsFor(file, used))

    const definition = { expression: text, imports }
    this.#definitions.set(key, definition)
    return definition
  }
}

// The virtual files among `files`: each one marked `inline`, or holding only deprecated per-source `inline` sources.
export function createVirtualFiles(files: ReadonlyArray<FileNode>): VirtualFiles {
  return new VirtualFiles(files.filter(isInlineFile))
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
