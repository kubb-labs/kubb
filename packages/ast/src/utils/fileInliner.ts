import { uniqueName } from '@internals/utils'
import { createConst, createText, createType } from '../nodes/code.ts'
import { createFile, createImport, createSource } from '../nodes/file.ts'
import type { FileNode, ImportNode, SourceNode } from '../nodes/file.ts'
import { getNames } from './moduleNames.ts'
import { rewriteNodes } from './nodeText.ts'
import type { InlineLanguage, InlineTextKind, InlineUse, Target, VirtualFiles } from './virtualFiles.ts'

export type FileInlinerOptions = { file: FileNode; lang: InlineLanguage; virtual: VirtualFiles }

// Rewrites one file that imports from virtual files.
class FileInliner {
  readonly #file: FileNode
  readonly #lang: InlineLanguage
  readonly #virtual: VirtualFiles
  // Each name the file binds, to the import (module and exported name) or declaration behind it, so a carried import or a local
  // declaration never takes a name already in use. `''` marks a global, such as the fetch `Response` next to a schema `Response`.
  readonly #names = new Map<string, string>()
  readonly #carried: Array<ImportNode> = []
  readonly #uses = new Map<string, number>()
  // Definitions a use needs by name, such as `x` in TypeScript's `typeof x`.
  readonly #asName = new Set<string>()
  readonly #locals = new Map<string, string>()
  readonly #writing = new Set<string>()
  readonly #declarations: Array<SourceNode> = []

  constructor({ file, lang, virtual }: FileInlinerOptions) {
    this.#file = file
    this.#lang = lang
    this.#virtual = virtual
    for (const imp of file.imports) for (const item of getNames(imp)) this.#names.set(item.alias ?? item.name, `${imp.path}\0${item.name}`)
    for (const source of file.sources) {
      if (source.name) this.#names.set(source.name, file.path)
      rewriteNodes(source.nodes, (text, kind) => {
        for (const name of this.#namesIn(text, kind)) this.#reserve(name)
        return text
      })
    }
  }

  inline(): FileNode {
    const file = this.#file
    for (const source of file.sources) {
      rewriteNodes(source.nodes, (text, kind) => {
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

  // Runs before any local name is chosen. Counts how often the file uses each name, and reserves each global an inlined body
  // uses, such as the fetch `Response`, so no local declaration shadows it. A body is read once, but a bare alias is followed
  // at each use so its target's count stays right; `following` stops a loop between two of them.
  #scan(from: FileNode, text: string, kind: InlineTextKind, following = new Set<string>()): void {
    if (from !== this.#file) for (const name of this.#namesIn(text, kind)) if (!this.#virtual.find(from, name) && !importsName(from, name)) this.#reserve(name)
    this.#lang.replaceIdentifiers(
      text,
      (id, use?: InlineUse) => {
        const target = this.#virtual.find(from, id)
        if (!target) return undefined

        const seen = this.#uses.get(target.key) ?? 0
        this.#uses.set(target.key, seen + 1)
        if (use?.asName) this.#asName.add(target.key)
        const { expression, key } = target
        if (expression === undefined) return undefined
        const bodyKind = kindOf(target)
        if (this.#isBareName(expression) && !following.has(key)) this.#scan(target.file, expression, bodyKind, new Set([...following, key]))
        else if (seen === 0) this.#scan(target.file, expression, bodyKind)
        return undefined
      },
      kind,
    )
  }

  // What `id` in `from` becomes: a type's local name, or the body of a type or value. `undefined` keeps it as it is.
  #resolve(from: FileNode, id: string): string | undefined {
    const target = this.#virtual.find(from, id)
    const written = target && this.#write(from, target)
    return written === id ? undefined : written
  }

  // A bare name is written where it is used. Any other value becomes one local constant, so it is built once. A type becomes
  // one local declaration when it is used more than once or a use needs its name, and is written in place otherwise.
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
    if (this.#isBareName(expression)) return false
    return !isType || this.#asName.has(key) || (this.#uses.get(key) ?? 0) > 1
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
        if (!this.#virtual.find(from, id)) used.add(id)
        return undefined
      },
      kind,
    )
    const aliases = this.#carry(this.#virtual.importsFor(from, used))
    return this.#lang.replaceIdentifiers(expression, (id) => this.#resolve(from, id) ?? aliases.get(id), kind)
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

  #reserve(name: string): undefined {
    if (!this.#names.has(name)) this.#names.set(name, '')
    return undefined
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
    return this.#virtual.report(from.path, message)
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
