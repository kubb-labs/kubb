import { ast, type ConstNode, type FileNode, type ImportNode, type ModuleName, type SourceNode, type Space, type TypeNode } from '@kubb/ast'
import { namesIn, referencesIn, wrap, type Lang } from './inline.ts'
import type { InlineTextKind } from './nodeText.ts'

/**
 * A name a virtual file declares. `id` is its module and exported name. `problem` is set when a use of it cannot be inlined.
 */
export type Definition = {
  id: string
  name: string
  file: FileNode
  space: Space
  body: string | undefined
  // A body that is only a name or dotted path, such as `Error`, costs less to repeat than to declare.
  isPath: boolean
  constant: ConstNode | undefined
  problem: string | undefined
}

/**
 * A piece of text in a file, read once: the definition each free name in it resolves to, the imports of its file it uses,
 * and the names nothing in the run declares, such as the fetch `Response`.
 */
export type Fragment = {
  file: FileNode
  text: string
  kind: InlineTextKind
  references: Array<Definition | undefined>
  imports: Array<ImportNode>
  unresolved: Array<string>
}

export type DefinitionsOptions = {
  // The virtual files of the run, by path.
  virtual: ReadonlyMap<string, FileNode>
  lang: Lang
}

/**
 * Where a name a file binds comes from: the virtual module and the name it exports.
 */
export type Binding = { path: string; name: string }

/**
 * Every definition of the virtual files in one run, and the fragments that refer to them. Each is read on first use and
 * kept, because the same virtual bodies are read for every file that imports them.
 *
 * @example
 * ```ts
 * const definitions = createDefinitions({ virtual, lang: 'ts' })
 * definitions.resolve({ file, name: 'AddPetOptions' }) // the definition the name points at, or `undefined`
 * definitions.fragment({ file, text: 'options: AddPetOptions', kind: 'parameters' })
 * ```
 */
export class Definitions {
  readonly lang: Lang
  readonly #virtual: ReadonlyMap<string, FileNode>
  readonly #bindings = new WeakMap<FileNode, Map<string, Binding>>()
  readonly #definitions = new Map<string, Definition>()
  readonly #fragments = new Map<string, Fragment>()

  constructor({ virtual, lang }: DefinitionsOptions) {
    this.#virtual = virtual
    this.lang = lang
  }

  isVirtual(path: string): boolean {
    return this.#virtual.has(path)
  }

  /**
   * The virtual definition `name` points at in `file`, or `undefined` when it points at nothing virtual.
   */
  resolve({ file, name }: { file: FileNode; name: string }): Definition | undefined {
    const binding = this.#bindingsOf(file).get(name)
    return binding && this.#definitionOf(binding)
  }

  fragment({ file, text, kind }: { file: FileNode; text: string; kind: InlineTextKind }): Fragment {
    const id = `${file.path}\0${kind}\0${text}`
    const known = this.#fragments.get(id)
    if (known) return known

    const names = referencesIn(text, this.lang, kind)
    const references = names.map((name) => this.resolve({ file, name }))
    const external = new Set(names.filter((_, index) => !references[index]))
    const fragment: Fragment = {
      file,
      text,
      kind,
      references,
      imports: file.imports.flatMap((imp) => (this.isVirtual(imp.path) ? [] : pickNames({ imp, used: external }))),
      unresolved: namesIn(text, this.lang, kind).filter((name) => !this.resolve({ file, name }) && !importsName({ file, name })),
    }
    this.#fragments.set(id, fragment)
    return fragment
  }

  body(definition: Definition): Fragment {
    return this.fragment({ file: definition.file, text: definition.body ?? '', kind: definition.space })
  }

  // The names `file` binds to a virtual file. A virtual file's own declarations win over its imports.
  #bindingsOf(file: FileNode): Map<string, Binding> {
    const known = this.#bindings.get(file)
    if (known) return known

    const bindings = new Map<string, Binding>()
    for (const imp of file.imports) {
      if (!this.isVirtual(imp.path)) continue
      for (const item of ast.file.getNames(imp)) if (!bindings.has(localName(item))) bindings.set(localName(item), { path: imp.path, name: item.name })
    }
    if (this.isVirtual(file.path)) for (const source of file.sources) if (source.name) bindings.set(source.name, { path: file.path, name: source.name })
    this.#bindings.set(file, bindings)
    return bindings
  }

  #definitionOf(binding: Binding): Definition {
    const id = idOf(binding)
    const known = this.#definitions.get(id)
    if (known) return known

    const definition = readDefinition({ ...binding, id, file: this.#virtual.get(binding.path)! })
    this.#definitions.set(id, definition)
    return definition
  }
}

// What the virtual `file` declares under `name`.
function readDefinition({ id, name, path, file }: Binding & { id: string; file: FileNode }): Definition {
  const [source, ...others] = file.sources.filter((item) => item.name === name)
  const node = declarationOf(source)
  const body = bodyOf({ source, node })
  return {
    id,
    name,
    file,
    space: source ? ast.file.getSpace(source) : 'value',
    body,
    isPath: isPath(body),
    constant: node?.kind === ast.node.kinds.const ? node : undefined,
    problem: problemOf({ name, path, body, duplicated: others.length > 0 }),
  }
}

// The right-hand side of a source: its deprecated `inline` expression, or the text of its `Const` or `Type`. A function
// body is not an expression, and printed text such as `Code` has none.
function bodyOf({ source, node }: { source: SourceNode | undefined; node: ConstNode | TypeNode | undefined }): string | undefined {
  if (source?.inline) return source.inline.expression
  if (!node) return undefined
  return ast.node.getText(node.nodes) || undefined
}

function isPath(body: string | undefined): boolean {
  if (body === undefined) return false
  const trimmed = body.trim()
  return wrap(trimmed) === trimmed
}

/**
 * Creates the definition table for the virtual files of one run.
 */
export function createDefinitions(options: DefinitionsOptions): Definitions {
  return new Definitions(options)
}

/**
 * The id of a name in a module: the module's path and the name it exports.
 */
export function idOf({ path, name }: Binding): string {
  return `${path}\0${name}`
}

/**
 * The name an import entry binds in its file: its alias, or else its name.
 */
export function localName(item: ModuleName): string {
  return item.alias ?? item.name
}

export function withNames({ imp, names }: { imp: ImportNode; names: Array<ModuleName> }): ImportNode {
  return ast.factory.createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names })
}

// Why a use of `name` cannot be inlined: it has no body, or more than one declaration.
function problemOf({ name, path, body, duplicated }: Binding & { body: string | undefined; duplicated: boolean }): string | undefined {
  if (body === undefined) return `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.`
  if (duplicated) return `"${name}" from "${path}" has more than one declaration, so its uses cannot be told apart.`
  return undefined
}

// The one `Const` or `Type` node a source holds.
function declarationOf(source: SourceNode | undefined): ConstNode | TypeNode | undefined {
  const node = source?.nodes?.length === 1 ? source.nodes[0] : undefined
  return node?.kind === ast.node.kinds.const || node?.kind === ast.node.kinds.type ? node : undefined
}

function importsName({ file, name }: { file: FileNode; name: string }): boolean {
  return file.imports.some((imp) => ast.file.getNames(imp).some((item) => localName(item) === name))
}

function pickNames({ imp, used }: { imp: ImportNode; used: ReadonlySet<string> }): Array<ImportNode> {
  const names = ast.file.getNames(imp).filter((item) => used.has(localName(item)))
  return names.length > 0 ? [withNames({ imp, names })] : []
}
