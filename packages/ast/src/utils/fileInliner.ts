import { uniqueName } from '@internals/utils'
import { nodeKinds } from '../constants.ts'
import { createConst, createText, createType } from '../nodes/code.ts'
import { createFile, createImport, createSource } from '../nodes/file.ts'
import type { FileNode, ImportNode, SourceNode } from '../nodes/file.ts'
import { getNames, getSpace } from './moduleNames.ts'
import { getNodeText, rewriteNodes } from './nodeText.ts'
import type { InlineTextKind } from './nodeText.ts'

/**
 * The language-specific half of `inlineFiles`, supplied by the parser that prints the file.
 */
export type InlineLanguage = {
  /**
   * Swaps in what `replace` returns for every name in `text` that refers to something declared outside it. `kind` says what
   * the text holds, so a fragment such as a type or a parameter list can be read as one.
   */
  replaceIdentifiers(text: string, replace: (name: string) => string | undefined, kind?: InlineTextKind): string
  /**
   * Every name `text` declares or uses, so a declaration added next to it never shadows one. Without it, the names
   * `replaceIdentifiers` finds are used.
   */
  names?(text: string, kind?: InlineTextKind): Iterable<string>
  /**
   * Makes `expression` safe to put where a name was, such as `(A | B)` in TypeScript.
   */
  wrap(expression: string): string
}

export type FileInlinerOptions = {
  file: FileNode
  lang: InlineLanguage
  // The virtual files of the run, by path.
  virtual: ReadonlyMap<string, FileNode>
  problems: Array<{ path: string; message: string }>
}

// A name imported from, or declared in, a virtual file. `key` is its module and exported name.
type Target = { key: string; name: string; path: string; file: FileNode; isType: boolean; expression: string | undefined }

// Rewrites one file that imports from virtual files.
class FileInliner {
  readonly #file: FileNode
  readonly #lang: InlineLanguage
  readonly #virtual: ReadonlyMap<string, FileNode>
  readonly #problems: FileInlinerOptions['problems']
  // Each name the file binds, to the import (module and exported name) or declaration behind it, so a carried import or a local
  // declaration never takes a name already in use. `''` marks a global, such as the fetch `Response` next to a schema `Response`.
  readonly #names = new Map<string, string>()
  readonly #carried: Array<ImportNode> = []
  readonly #uses = new Map<string, number>()
  readonly #locals = new Map<string, string>()
  readonly #writing = new Set<string>()
  readonly #declarations: Array<SourceNode> = []

  constructor({ file, lang, virtual, problems }: FileInlinerOptions) {
    this.#file = file
    this.#lang = lang
    this.#virtual = virtual
    this.#problems = problems
    for (const imp of file.imports) for (const item of getNames(imp)) this.#names.set(item.alias ?? item.name, `${imp.path}\0${item.name}`)
    for (const source of file.sources) if (source.name) this.#names.set(source.name, file.path)
  }

  inline(): FileNode {
    const file = this.#file
    // Every name is reserved and every use counted before the first local name is chosen.
    for (const source of file.sources) {
      rewriteNodes(source.nodes, (text, kind) => {
        for (const name of this.#namesIn(text, kind)) this.#reserve(name)
        this.#scan(file, text, kind)
        return text
      })
    }
    const rewritten = file.sources.map((source) => ({
      ...source,
      nodes: rewriteNodes(source.nodes, (text, kind) => this.#lang.replaceIdentifiers(text, (id) => this.#resolve(file, id), kind)),
    }))

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const carried = this.#carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))
    const imports = [...file.imports.filter((imp) => !this.#virtual.has(imp.path)), ...carried]

    return createFile({ ...file, sources: [...this.#declarations, ...rewritten], imports })
  }

  // Counts how often the file uses each name, and reserves each global an inlined body uses, such as the fetch `Response`, so
  // no local declaration shadows it. A body is read once, but a bare alias is followed at each use so its target's count stays
  // right; `following` stops a loop between two of them.
  #scan(from: FileNode, text: string, kind: InlineTextKind, following = new Set<string>()): void {
    this.#reserveGlobals(from, text, kind)
    this.#lang.replaceIdentifiers(
      text,
      (id) => {
        const target = this.#find(from, id)
        if (target?.expression === undefined) return undefined

        const seen = this.#uses.get(target.key) ?? 0
        this.#uses.set(target.key, seen + 1)
        const { expression, key } = target
        if (this.#isBareName(expression) && !following.has(key)) this.#scan(target.file, expression, kindOf(target), new Set([...following, key]))
        else if (seen === 0) this.#scan(target.file, expression, kindOf(target))
        return undefined
      },
      kind,
    )
  }

  // The names an inlined body uses that it neither imports nor gets from a virtual file are globals.
  #reserveGlobals(from: FileNode, text: string, kind: InlineTextKind): void {
    if (from === this.#file) return
    for (const name of this.#namesIn(text, kind)) {
      if (!this.#find(from, name) && !importsName(from, name)) this.#reserve(name)
    }
  }

  // What `id` in `from` becomes: a declaration's local name, or a body written in place. `undefined` keeps it as it is.
  #resolve(from: FileNode, id: string): string | undefined {
    const target = this.#find(from, id)
    const written = target && this.#write(from, target)
    return written === id ? undefined : written
  }

  // A bare name is written where it is used. Any other value becomes one local constant, so it is built once. A type becomes
  // one local declaration when it is used more than once, and is written in place otherwise.
  #write(from: FileNode, target: Target): string | undefined {
    const { expression, key, name, path } = target
    if (expression === undefined) return this.#report(from, `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.`)
    const existing = this.#locals.get(key)
    if (existing) return existing

    const declare = this.#declares(target, expression)
    // A type claims its name before its body is written, so a type that refers to itself, such as a tree node, can use it.
    // A value that refers to itself has no value yet, so it stays a cycle.
    const early = declare && target.isType ? this.#claim(target) : undefined
    if (!early && this.#writing.has(key)) return this.#report(from, `"${name}" from "${path}" is defined in terms of itself.`)

    this.#writing.add(key)
    const body = this.#writeBody(target.file, expression, kindOf(target))
    this.#writing.delete(key)
    return declare ? this.#declare(target, early ?? this.#claim(target), body) : this.#lang.wrap(body)
  }

  #declares({ key, isType }: Target, expression: string): boolean {
    return !this.#isBareName(expression) && (!isType || (this.#uses.get(key) ?? 0) > 1)
  }

  #declare({ isType }: Target, local: string, body: string): string {
    const node = isType ? createType({ name: local, nodes: [createText(body)] }) : createConst({ name: local, nodes: [createText(body)] })
    this.#declarations.push(createSource({ name: local, isTypeOnly: isType, nodes: [node] }))
    return local
  }

  #claim({ key, name }: Target): string {
    const local = this.#bind(key, name)
    this.#locals.set(key, local)
    return local
  }

  // A body with the names it uses resolved, and the imports it needs carried into the file. The carried imports are aliased
  // first, so the alias pass never renames a local name the body resolves to.
  #writeBody(from: FileNode, expression: string, kind: InlineTextKind): string {
    const used = new Set<string>()
    this.#lang.replaceIdentifiers(
      expression,
      (id) => {
        if (!this.#find(from, id)) used.add(id)
        return undefined
      },
      kind,
    )
    const aliases = this.#carry(from.imports.flatMap((imp) => (this.#virtual.has(imp.path) ? [] : pickNames(imp, used))))
    return this.#lang.replaceIdentifiers(expression, (id) => this.#resolve(from, id) ?? aliases.get(id), kind)
  }

  // What `local` in `from` names in a virtual file, or `undefined` when it names nothing virtual.
  #find(from: FileNode, local: string): Target | undefined {
    const at = this.#locate(from, local)
    const file = at && this.#virtual.get(at.path)
    if (!at || !file) return undefined
    const source = file.sources.find((item) => item.name === at.name)
    return { ...at, key: `${at.path}\0${at.name}`, file, isType: !!source && getSpace(source) === 'type', expression: bodyOf(source) }
  }

  #locate(from: FileNode, local: string): { path: string; name: string } | undefined {
    if (this.#virtual.has(from.path) && from.sources.some((source) => source.name === local)) return { path: from.path, name: local }
    for (const imp of from.imports) {
      const item = this.#virtual.has(imp.path) && getNames(imp).find((item) => (item.alias ?? item.name) === local)
      if (item) return { path: imp.path, name: item.name }
    }
    return undefined
  }

  // Every name `text` declares or uses, from the language, or else the names it references.
  #namesIn(text: string, kind: InlineTextKind): Iterable<string> {
    if (this.#lang.names) return this.#lang.names(text, kind)
    const found: Array<string> = []
    this.#lang.replaceIdentifiers(
      text,
      (name) => {
        found.push(name)
        return undefined
      },
      kind,
    )
    return found
  }

  #reserve(name: string): void {
    if (!this.#names.has(name)) this.#names.set(name, '')
  }

  // Claims a local name for `key` (module and exported name), adding a number when another binding has it, and returns it.
  #bind(key: string, name: string): string {
    const local = uniqueName(name, (candidate) => this.#names.has(candidate) && this.#names.get(candidate) !== key)
    this.#names.set(local, key)
    return local
  }

  // Carries `imports` into the file and returns the alias of each carried name that clashed, such as a schema `Options` next
  // to the client's own `Options`, which becomes `Options2`.
  #carry(imports: ReadonlyArray<ImportNode>): Map<string, string> {
    const aliases = new Map<string, string>()
    for (const imp of imports) {
      const before = aliases.size
      const names = getNames(imp).map((item) => {
        const local = item.alias ?? item.name
        const name = this.#bind(`${imp.path}\0${item.name}`, local)
        if (name === local) return item
        aliases.set(local, name)
        return { ...item, alias: name }
      })
      this.#carried.push(aliases.size > before ? createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names }) : imp)
    }
    return aliases
  }

  // A type that only names another, such as `Error` or `ListPetsStatus200Headers`, costs less to repeat than to declare. What
  // the file's language writes where a name was without wrapping it counts as a name.
  #isBareName(expression: string): boolean {
    const trimmed = expression.trim()
    return this.#lang.wrap(trimmed) === trimmed
  }

  #report(from: FileNode, message: string): undefined {
    this.#problems.push({ path: from.path, message })
    return undefined
  }
}

// Rewrites `file`, which imports from virtual files, with what it uses from them moved in.
export function inlineFile(options: FileInlinerOptions): FileNode {
  return new FileInliner(options).inline()
}

function importsName(file: FileNode, local: string): boolean {
  return file.imports.some((imp) => getNames(imp).some((item) => (item.alias ?? item.name) === local))
}

function kindOf(target: Target): InlineTextKind {
  return target.isType ? 'type' : 'value'
}

// The right-hand side of a `Const` or `Type`. A function body is not an expression, and printed text such as `Code` has none.
function bodyOf(source: SourceNode | undefined): string | undefined {
  if (source?.inline) return source.inline.expression
  const node = declarationOf(source)
  return node ? getNodeText(node.nodes) || undefined : undefined
}

// The one `Const` or `Type` node a source holds.
function declarationOf(source: SourceNode | undefined) {
  const node = source?.nodes?.length === 1 ? source.nodes[0] : undefined
  return node?.kind === nodeKinds.const || node?.kind === nodeKinds.type ? node : undefined
}

function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  const names = getNames(imp).filter((item) => used.has(item.alias ?? item.name))
  return names.length > 0 ? [createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names })] : []
}
