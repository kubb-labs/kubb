import type { Renamer } from '@internals/utils'
import { ast, type FileNode, type ImportNode, type SourceNode } from '@kubb/ast'
import type { InlineResult } from '@kubb/core'
import { idOf, localName, withNames, type Definition, type Definitions, type Fragment } from './definitions.ts'
import { namesIn, replaceIdentifiers, wrap } from './inline.ts'
import { rewriteNodes } from './nodeText.ts'
import { createFileRenamer } from './renamer.ts'

export type FileRewriterOptions = {
  file: FileNode
  definitions: Definitions
}

// A definition used in `from`, the file whose text is being written.
type Use = { from: FileNode; definition: Definition }

/**
 * Rewrites one file that imports from virtual files, in two passes. The first counts how often each definition is used and
 * reserves every name in sight. The second writes each use: a path in place, a value as one local constant, and a type as
 * one local type when it is used more than once, or in place otherwise.
 *
 * @example
 * ```ts
 * const { file, problems } = createFileRewriter({ file: clientFile, definitions }).rewrite()
 * ```
 */
class FileRewriter {
  readonly #file: FileNode
  readonly #definitions: Definitions
  readonly #renamer: Renamer
  readonly #uses = new Map<string, number>()
  // The paths being followed while counting, so a loop between two of them stops.
  readonly #following = new Set<string>()
  // The definitions being written, so a value defined in terms of itself is reported.
  readonly #writing = new Set<string>()
  readonly #locals = new Map<string, string>()
  readonly #declarations: Array<SourceNode> = []
  readonly #carried: Array<ImportNode> = []
  readonly #problems: InlineResult['problems'] = []

  constructor({ file, definitions }: FileRewriterOptions) {
    this.#file = file
    this.#definitions = definitions
    this.#renamer = createFileRenamer(file)
  }

  rewrite(): { file: FileNode; problems: InlineResult['problems'] } {
    const file = this.#file
    const { lang } = this.#definitions
    for (const source of file.sources) {
      rewriteNodes(source.nodes, (text, kind) => {
        for (const name of namesIn(text, lang, kind)) this.#renamer.reserve({ name })
        this.#count(this.#definitions.fragment({ file, text, kind }))
        return text
      })
    }

    const sources = file.sources.map((source) => ({
      ...source,
      nodes: rewriteNodes(source.nodes, (text, kind) => replaceIdentifiers(text, (name) => this.#replacement({ from: file, name }), lang, kind)),
    }))
    // A carried import keeps its target; `root` moves to this file so the relative path is computed from here.
    const carried = this.#carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))
    const imports = [...file.imports.filter((imp) => !this.#definitions.isVirtual(imp.path)), ...carried]

    return { file: ast.factory.createFile({ ...file, sources: [...this.#declarations, ...sources], imports }), problems: this.#problems }
  }

  // Counts the uses in a fragment and reserves the names nothing declares. A body is counted once, but a path is followed
  // at each use, so the count of what it names stays right.
  #count(fragment: Fragment): void {
    for (const name of fragment.unresolved) this.#renamer.reserve({ name })
    for (const definition of fragment.references) if (definition?.body !== undefined) this.#countUse(definition)
  }

  #countUse(definition: Definition): void {
    const { id } = definition
    const seen = this.#uses.get(id) ?? 0
    this.#uses.set(id, seen + 1)
    if (definition.isPath && !this.#following.has(id)) {
      this.#following.add(id)
      this.#count(this.#definitions.body(definition))
      this.#following.delete(id)
      return
    }
    if (seen === 0) this.#count(this.#definitions.body(definition))
  }

  // What `name` in `from` is replaced with, or `undefined` to keep it as it is.
  #replacement({ from, name }: { from: FileNode; name: string }): string | undefined {
    const definition = this.#definitions.resolve({ file: from, name })
    const written = definition && this.#write({ from, definition })
    return written === name ? undefined : written
  }

  #write({ from, definition }: Use): string | undefined {
    if (definition.problem) return this.#report({ from, message: definition.problem })
    return this.#locals.get(definition.id) ?? this.#writeOnce({ from, definition })
  }

  #writeOnce({ from, definition }: Use): string | undefined {
    const declare = this.#declares(definition)
    // A type claims its name before its body is written, so a type that refers to itself can use it. A value cannot.
    const early = declare && definition.space === 'type' ? this.#claim(definition) : undefined
    if (!early && this.#writing.has(definition.id)) {
      return this.#report({ from, message: `"${definition.name}" from "${definition.file.path}" is defined in terms of itself.` })
    }

    const body = this.#writeBody(definition)
    return declare ? this.#declare({ definition, local: early ?? this.#claim(definition), body }) : wrap(body)
  }

  // A path is written in place. A value is always declared, and a type when it is used more than once.
  #declares({ id, isPath, space }: Definition): boolean {
    if (isPath) return false
    return space === 'value' || (this.#uses.get(id) ?? 0) > 1
  }

  #writeBody(definition: Definition): string {
    this.#writing.add(definition.id)
    const body = this.#rewriteFragment(this.#definitions.body(definition))
    this.#writing.delete(definition.id)
    return body
  }

  // The imports a fragment needs are carried first, so their aliases never rename a local the fragment resolves to.
  #rewriteFragment(fragment: Fragment): string {
    const aliases = this.#carry(fragment.imports)
    const { lang } = this.#definitions
    return replaceIdentifiers(fragment.text, (name) => this.#replacement({ from: fragment.file, name }) ?? aliases.get(name), lang, fragment.kind)
  }

  #declare({ definition, local, body }: { definition: Definition; local: string; body: string }): string {
    const { constant, space } = definition
    // A constant keeps its type annotation and `as const`, so its literal types do not widen.
    const type = constant?.type ? this.#rewriteFragment(this.#definitions.fragment({ file: definition.file, text: constant.type, kind: 'type' })) : undefined
    const node =
      space === 'type'
        ? ast.factory.createType({ name: local, nodes: [ast.factory.createText(body)] })
        : ast.factory.createConst({
            name: local,
            ...(type ? { type } : {}),
            ...(constant?.asConst ? { asConst: true } : {}),
            nodes: [ast.factory.createText(body)],
          })
    this.#declarations.push(ast.factory.createSource({ name: local, isTypeOnly: space === 'type', nodes: [node] }))
    return local
  }

  #claim(definition: Definition): string {
    const local = this.#renamer.assign({ name: definition.name, owner: definition.id })
    this.#locals.set(definition.id, local)
    return local
  }

  // Carries `imports` into the file and returns the alias of each name that clashed, such as `Options` becoming `Options2`.
  #carry(imports: ReadonlyArray<ImportNode>): Map<string, string> {
    const aliases = new Map<string, string>()
    for (const imp of imports) {
      const before = aliases.size
      const names = ast.file.getNames(imp).map((item) => {
        const local = localName(item)
        const name = this.#renamer.assign({ name: local, owner: idOf({ path: imp.path, name: item.name }) })
        if (name === local) return item
        aliases.set(local, name)
        return { ...item, alias: name }
      })
      this.#carried.push(aliases.size > before ? withNames({ imp, names }) : imp)
    }
    return aliases
  }

  #report({ from, message }: { from: FileNode; message: string }): undefined {
    this.#problems.push({ path: from.path, message })
    return undefined
  }
}

export type { FileRewriter }

/**
 * Creates the rewriter for one file that imports from the virtual files in `definitions`.
 */
export function createFileRewriter(options: FileRewriterOptions): FileRewriter {
  return new FileRewriter(options)
}
