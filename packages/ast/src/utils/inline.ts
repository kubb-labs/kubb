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

// A name imported from, or declared in, a virtual file. `key` is its module and exported name.
type Target = { key: string; name: string; path: string; file: FileNode; isType: boolean; expression: string | undefined }

/**
 * Moves what a file imports from a virtual file (one marked `inline`, so it is never written) into that file. A type used more
 * than once becomes one local, non-exported declaration. A type used once, a bare alias, and a value are written at each use.
 * The moved declarations' own imports move to the importing file.
 */
export function inlineFiles(files: ReadonlyArray<FileNode>, { language }: InlineFilesOptions): InlineFilesResult {
  const virtual = createVirtualFiles(files.filter(isInlineFile))
  const result: InlineFilesResult = { files: [], virtualPaths: virtual.paths, problems: virtual.problems }
  if (virtual.paths.length === 0) return result

  for (const file of files) {
    if (virtual.has(file.path) || !file.imports.some((imp) => virtual.has(imp.path))) continue

    const lang = language(file)
    if (!lang) {
      virtual.report(file.path, `No parser for "${file.extname}" files supports inline sources.`)
      continue
    }
    result.files.push(createFileInliner({ file, lang, virtual }).inline())
  }

  return result
}

// The virtual files of one run, and the values defined from them, shared by every importing file.
class VirtualFiles {
  readonly problems: InlineFilesResult['problems'] = []
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

function createVirtualFiles(files: ReadonlyArray<FileNode>): VirtualFiles {
  return new VirtualFiles(files)
}

// The names one file binds, so a carried import or a local declaration never takes a name already in use. A carried name the
// file already binds to something else, such as a schema `Options` next to the client's own `Options`, gets an alias like
// `Options2`.
class Bindings {
  readonly carried: Array<ImportNode> = []
  readonly #lang: InlineLanguage
  // Each name, to the import (module and exported name) or declaration behind it. `''` marks a global, such as the fetch
  // `Response` next to a schema `Response`.
  readonly #names = new Map<string, string>()

  constructor({ file, lang }: { file: FileNode; lang: InlineLanguage }) {
    this.#lang = lang
    for (const imp of file.imports) for (const item of getNames(imp)) this.#names.set(item.alias ?? item.name, `${imp.path}\0${item.name}`)
    for (const source of file.sources) {
      if (source.name) this.#names.set(source.name, file.path)
      rewriteNodes(source.nodes, (text) => lang.replaceIdentifiers(text, (name) => this.reserve(name)))
    }
  }

  reserve(name: string): undefined {
    if (!this.#names.has(name)) this.#names.set(name, '')
    return undefined
  }

  // Claims a local name for `key`, such as a declared type, and returns it.
  bind(key: string, name: string): string {
    const local = uniqueName(name, (candidate) => this.#names.has(candidate) && this.#names.get(candidate) !== key)
    this.#names.set(local, key)
    return local
  }

  // Carries `imports` into the file and returns the alias of each carried name that clashed.
  alias(imports: ReadonlyArray<ImportNode>): Map<string, string> {
    const aliases = new Map<string, string>()
    for (const imp of imports) {
      const before = aliases.size
      const names = getNames(imp).map((item) => {
        const local = item.alias ?? item.name
        const name = this.bind(`${imp.path}\0${item.name}`, local)
        if (name === local) return item
        aliases.set(local, name)
        return { ...item, alias: name }
      })
      this.carried.push(aliases.size > before ? createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names }) : imp)
    }
    return aliases
  }

  carry({ expression, imports }: Definition): string {
    const aliases = this.alias(imports)
    return aliases.size ? this.#lang.replaceIdentifiers(expression, (name) => aliases.get(name)) : expression
  }
}

type FileInlinerOptions = { file: FileNode; lang: InlineLanguage; virtual: VirtualFiles }

// Rewrites one file that imports from virtual files.
class FileInliner {
  readonly #file: FileNode
  readonly #lang: InlineLanguage
  readonly #virtual: VirtualFiles
  readonly #bindings: Bindings
  readonly #uses = new Map<string, number>()
  readonly #locals = new Map<string, string>()
  readonly #writing = new Set<string>()
  readonly #declarations: Array<SourceNode> = []

  constructor({ file, lang, virtual }: FileInlinerOptions) {
    this.#file = file
    this.#lang = lang
    this.#virtual = virtual
    this.#bindings = new Bindings({ file, lang })
  }

  inline(): FileNode {
    const file = this.#file
    for (const source of file.sources) {
      rewriteNodes(source.nodes, (text) => {
        this.#scan(file, text)
        return text
      })
    }
    const rewritten = file.sources.map((source) => ({
      ...source,
      nodes: rewriteNodes(source.nodes, (text) => this.#lang.replaceIdentifiers(text, (id) => this.#resolve(file, id))),
    }))

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const carried = this.#bindings.carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))
    const imports = [...file.imports.filter((imp) => !this.#virtual.has(imp.path)), ...carried]

    return createFile({ ...file, sources: [...this.#declarations, ...rewritten], imports })
  }

  // Runs before any local name is chosen. Counts how often the file uses each name, and reserves each global an inlined body
  // uses, such as the fetch `Response`, so no local declaration shadows it. A body is read once, but a bare alias is followed
  // at each use so its target's count stays right; `following` stops a loop between two of them.
  #scan(from: FileNode, text: string, following = new Set<string>()): void {
    this.#lang.replaceIdentifiers(text, (id) => {
      const target = this.#virtual.find(from, id)
      if (!target) return from === this.#file || importsName(from, id) ? undefined : this.#bindings.reserve(id)

      const seen = this.#uses.get(target.key) ?? 0
      this.#uses.set(target.key, seen + 1)
      const { expression, key } = target
      if (expression === undefined) return undefined
      if (this.#isBareName(expression) && !following.has(key)) this.#scan(target.file, expression, new Set([...following, key]))
      else if (seen === 0) this.#scan(target.file, expression)
      return undefined
    })
  }

  // What `id` in `from` becomes: a type's local name or body, or a value's body. `undefined` keeps it as it is.
  #resolve(from: FileNode, id: string): string | undefined {
    const target = this.#virtual.find(from, id)
    if (!target) return undefined
    if (target.isType) {
      const written = this.#writeType(target)
      return written === id ? undefined : written
    }
    const definition = this.#virtual.define(target, from.path, this.#lang)
    return definition ? this.#lang.wrap(this.#bindings.carry(definition)) : undefined
  }

  // A type used more than once becomes one local declaration; one used once, or a bare alias, is written where it is used.
  #writeType(target: Target): string | undefined {
    const { expression, key, name, path } = target
    if (expression === undefined) return this.#report(`"${name}" is imported from "${path}", which never writes it and has no inline definition for it.`)
    const existing = this.#locals.get(key)
    if (existing) return existing

    const local = this.#declareName(target, expression)
    if (!local && this.#writing.has(key)) return this.#report(`"${name}" from "${path}" is defined in terms of itself.`)

    this.#writing.add(key)
    const body = this.#writeBody(target.file, expression)
    this.#writing.delete(key)
    if (!local) return this.#lang.wrap(body)

    this.#declarations.push(createSource({ name: local, isTypeOnly: true, nodes: [createType({ name: local, nodes: [createText(body)] })] }))
    return local
  }

  // Claims the local name of a type used more than once, before its body is written, so a type that refers to itself, such as
  // a tree node, can use it.
  #declareName({ key, name }: Target, expression: string): string | undefined {
    if ((this.#uses.get(key) ?? 0) < 2 || this.#isBareName(expression)) return undefined
    const local = this.#bindings.bind(key, name)
    this.#locals.set(key, local)
    return local
  }

  // A type's body with the names it uses resolved, and the imports it needs carried into the file. The carried imports are
  // aliased first, so the alias pass never renames a local name the body resolves to.
  #writeBody(from: FileNode, expression: string): string {
    const used = new Set<string>()
    this.#lang.replaceIdentifiers(expression, (id) => {
      if (!this.#virtual.find(from, id)) used.add(id)
      return undefined
    })
    const aliases = this.#bindings.alias(this.#virtual.importsFor(from, used))
    return this.#lang.replaceIdentifiers(expression, (id) => this.#resolve(from, id) ?? aliases.get(id))
  }

  // A type that only names another, such as `Error` or `ListPetsStatus200Headers`, costs less to repeat than to declare. What
  // the file's language writes where a name was without wrapping it counts as a name.
  #isBareName(expression: string): boolean {
    const trimmed = expression.trim()
    return this.#lang.wrap(trimmed) === trimmed
  }

  #report(message: string): undefined {
    return this.#virtual.report(this.#file.path, message)
  }
}

function createFileInliner(options: FileInlinerOptions): FileInliner {
  return new FileInliner(options)
}

function importsName(file: FileNode, local: string): boolean {
  return file.imports.some((imp) => getNames(imp).some((item) => (item.alias ?? item.name) === local))
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
