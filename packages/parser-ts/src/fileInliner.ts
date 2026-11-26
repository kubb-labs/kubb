import { uniqueName } from '@internals/utils'
import { ast, type FileNode, type ImportNode, type ModuleName, type SourceNode } from '@kubb/ast'
import { namesIn, replaceIdentifiers, wrap, type Lang } from './inline.ts'
import { rewriteNodes, type InlineTextKind } from './nodeText.ts'
import type { InlineFilesResult } from './inlineFiles.ts'

export type FileInlinerOptions = {
  file: FileNode
  lang: Lang
  // The virtual files of the run, by path.
  virtual: ReadonlyMap<string, FileNode>
}

// A name imported from, or declared in, a virtual file. `key` is its module and exported name.
// `ambiguous` marks a name the virtual file declares more than once, such as a type and a value.
type Target = {
  key: string
  name: string
  path: string
  file: FileNode
  isType: boolean
  ambiguous: boolean
  expression: string | undefined
  declaration: ReturnType<typeof declarationOf>
}

// Rewrites one file that imports from virtual files.
class FileInliner {
  readonly #file: FileNode
  readonly #lang: Lang
  readonly #virtual: ReadonlyMap<string, FileNode>
  readonly #problems: InlineFilesResult['problems'] = []
  // Each name the file binds, to the import (module and exported name) or declaration behind it, so a carried import or a local
  // declaration never takes a name already in use. `''` marks a global, such as the fetch `Response` next to a schema `Response`.
  readonly #names = new Map<string, string>()
  readonly #carried: Array<ImportNode> = []
  readonly #uses = new Map<string, number>()
  readonly #locals = new Map<string, string>()
  readonly #writing = new Set<string>()
  // The bare aliases being followed, so a loop between two of them stops.
  readonly #following = new Set<string>()
  readonly #declarations: Array<SourceNode> = []

  constructor({ file, lang, virtual }: FileInlinerOptions) {
    this.#file = file
    this.#lang = lang
    this.#virtual = virtual
    for (const imp of file.imports) {
      for (const item of ast.file.getNames(imp)) this.#names.set(localName(item), keyOf(imp.path, item.name))
    }
    for (const source of file.sources) {
      if (source.name) this.#names.set(source.name, file.path)
    }
  }

  // The file with what it uses from virtual files moved in, and the names that could not be inlined.
  inline(): { file: FileNode; problems: InlineFilesResult['problems'] } {
    const file = this.#file
    // Every name is reserved and every use counted before the first local name is chosen.
    for (const source of file.sources) {
      rewriteNodes(source.nodes, (text, kind) => {
        for (const name of namesIn(text, this.#lang, kind)) this.#reserve(name)
        this.#scan(file, text, kind)
        return text
      })
    }
    const rewritten = file.sources.map((source) => ({
      ...source,
      nodes: rewriteNodes(source.nodes, (text, kind) => replaceIdentifiers(text, (id) => this.#resolve(file, id), this.#lang, kind)),
    }))

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const carried = this.#carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))
    const imports = [...file.imports.filter((imp) => !this.#virtual.has(imp.path)), ...carried]

    return { file: ast.factory.createFile({ ...file, sources: [...this.#declarations, ...rewritten], imports }), problems: this.#problems }
  }

  // Counts how often the file uses each name, and reserves each global an inlined body uses, such as the fetch `Response`, so
  // no local declaration shadows it. A body is read once, but a bare alias is followed at each use so its target's count stays
  // right.
  #scan(from: FileNode, text: string, kind: InlineTextKind): void {
    this.#reserveGlobals(from, text, kind)
    replaceIdentifiers(
      text,
      (id) => {
        const target = this.#find(from, id)
        if (target?.expression === undefined) return undefined

        const seen = this.#uses.get(target.key) ?? 0
        this.#uses.set(target.key, seen + 1)
        const { expression, key } = target
        if (isBareName(expression) && !this.#following.has(key)) this.#follow(target, expression)
        else if (seen === 0) this.#scan(target.file, expression, kindOf(target))
        return undefined
      },
      this.#lang,
      kind,
    )
  }

  #follow(target: Target, expression: string): void {
    this.#following.add(target.key)
    this.#scan(target.file, expression, kindOf(target))
    this.#following.delete(target.key)
  }

  // The names an inlined body uses that it neither imports nor gets from a virtual file are globals.
  #reserveGlobals(from: FileNode, text: string, kind: InlineTextKind): void {
    if (from === this.#file) return
    for (const name of namesIn(text, this.#lang, kind)) {
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
    if (target.expression === undefined || target.ambiguous) return this.#report(from, problemOf(target))
    return this.#locals.get(target.key) ?? this.#writeOnce(from, target, target.expression)
  }

  #writeOnce(from: FileNode, target: Target, expression: string): string | undefined {
    const { key, name, path } = target
    const declare = this.#declares(target, expression)
    // A type claims its name before its body is written, so a type that refers to itself, such as a tree node, can use it.
    // A value that refers to itself has no value yet, so it stays a cycle.
    const early = declare && target.isType ? this.#claim(target) : undefined
    if (!early && this.#writing.has(key)) return this.#report(from, `"${name}" from "${path}" is defined in terms of itself.`)

    this.#writing.add(key)
    const body = this.#writeBody(target.file, expression, kindOf(target))
    this.#writing.delete(key)
    return declare ? this.#declare(target, early ?? this.#claim(target), body) : wrap(body)
  }

  #declares({ key, isType }: Target, expression: string): boolean {
    return !isBareName(expression) && (!isType || (this.#uses.get(key) ?? 0) > 1)
  }

  #declare(target: Target, local: string, body: string): string {
    const { isType, declaration } = target
    // A constant keeps its type annotation and `as const`, so its literal types do not widen.
    const constant = declaration?.kind === ast.node.kinds.const ? declaration : undefined
    const type = constant?.type ? this.#writeBody(target.file, constant.type, 'type') : undefined
    const node = isType
      ? ast.factory.createType({ name: local, nodes: [ast.factory.createText(body)] })
      : ast.factory.createConst({
          name: local,
          ...(type ? { type } : {}),
          ...(constant?.asConst ? { asConst: true } : {}),
          nodes: [ast.factory.createText(body)],
        })
    this.#declarations.push(ast.factory.createSource({ name: local, isTypeOnly: isType, nodes: [node] }))
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
    replaceIdentifiers(
      expression,
      (id) => {
        if (!this.#find(from, id)) used.add(id)
        return undefined
      },
      this.#lang,
      kind,
    )
    const aliases = this.#carry(from.imports.flatMap((imp) => (this.#virtual.has(imp.path) ? [] : pickNames(imp, used))))
    return replaceIdentifiers(expression, (id) => this.#resolve(from, id) ?? aliases.get(id), this.#lang, kind)
  }

  // What `local` in `from` names in a virtual file, or `undefined` when it names nothing virtual.
  #find(from: FileNode, local: string): Target | undefined {
    const at = this.#locate(from, local)
    const file = at && this.#virtual.get(at.path)
    if (!at || !file) return undefined
    const [source, ...others] = file.sources.filter((item) => item.name === at.name)
    const declaration = declarationOf(source)
    const isType = !!source && ast.file.getSpace(source) === 'type'
    return { ...at, key: keyOf(at.path, at.name), file, isType, ambiguous: others.length > 0, expression: bodyOf(source), declaration }
  }

  #locate(from: FileNode, local: string): { path: string; name: string } | undefined {
    if (this.#virtual.has(from.path) && from.sources.some((source) => source.name === local)) return { path: from.path, name: local }
    for (const imp of from.imports) {
      const item = this.#virtual.has(imp.path) && ast.file.getNames(imp).find((item) => localName(item) === local)
      if (item) return { path: imp.path, name: item.name }
    }
    return undefined
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
      const names = ast.file.getNames(imp).map((item) => {
        const local = localName(item)
        const name = this.#bind(keyOf(imp.path, item.name), local)
        if (name === local) return item
        aliases.set(local, name)
        return { ...item, alias: name }
      })
      this.#carried.push(aliases.size > before ? withNames(imp, names) : imp)
    }
    return aliases
  }

  #report(from: FileNode, message: string): undefined {
    this.#problems.push({ path: from.path, message })
    return undefined
  }
}

export type { FileInliner }

export function createFileInliner(options: FileInlinerOptions): FileInliner {
  return new FileInliner(options)
}

// A type that only names another, such as `Error` or `ListPetsStatus200Headers`, costs less to repeat than to declare.
function isBareName(expression: string): boolean {
  const trimmed = expression.trim()
  return wrap(trimmed) === trimmed
}

// The name an import entry binds in its file: its alias, or else its name.
function localName(item: ModuleName): string {
  return item.alias ?? item.name
}

// The key of a name in a module: the module's path and the name it exports.
function keyOf(path: string, name: string): string {
  return `${path}\0${name}`
}

function importsName(file: FileNode, local: string): boolean {
  return file.imports.some((imp) => ast.file.getNames(imp).some((item) => localName(item) === local))
}

// Why `target`, which has no body or more than one declaration, cannot be inlined.
function problemOf({ expression, name, path }: Target): string {
  if (expression === undefined) return `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.`
  return `"${name}" from "${path}" has more than one declaration, so its uses cannot be told apart.`
}

function kindOf(target: Target): InlineTextKind {
  return target.isType ? 'type' : 'value'
}

// The right-hand side of a `Const` or `Type`. A function body is not an expression, and printed text such as `Code` has none.
function bodyOf(source: SourceNode | undefined): string | undefined {
  if (source?.inline) return source.inline.expression
  const node = declarationOf(source)
  return node ? ast.node.getText(node.nodes) || undefined : undefined
}

// The one `Const` or `Type` node a source holds.
function declarationOf(source: SourceNode | undefined) {
  const node = source?.nodes?.length === 1 ? source.nodes[0] : undefined
  return node?.kind === ast.node.kinds.const || node?.kind === ast.node.kinds.type ? node : undefined
}

function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  const names = ast.file.getNames(imp).filter((item) => used.has(localName(item)))
  return names.length > 0 ? [withNames(imp, names)] : []
}

function withNames(imp: ImportNode, names: Array<ModuleName>): ImportNode {
  return ast.factory.createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names })
}
