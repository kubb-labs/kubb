import { createText, createType } from '../nodes/code.ts'
import { createFile, createSource } from '../nodes/file.ts'
import type { FileNode, SourceNode } from '../nodes/file.ts'
import { createBindings } from './bindings.ts'
import type { Bindings } from './bindings.ts'
import { getNames } from './moduleNames.ts'
import { rewriteNodes } from './nodeText.ts'
import type { InlineLanguage, Target, VirtualFiles } from './virtualFiles.ts'

export type FileInlinerOptions = { file: FileNode; lang: InlineLanguage; virtual: VirtualFiles }

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
    this.#bindings = createBindings({ file, lang })
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

// Rewrites `file`, which imports from virtual files, with what it uses from them moved in.
export function inlineFile(options: FileInlinerOptions): FileNode {
  return new FileInliner(options).inline()
}

function importsName(file: FileNode, local: string): boolean {
  return file.imports.some((imp) => getNames(imp).some((item) => (item.alias ?? item.name) === local))
}
