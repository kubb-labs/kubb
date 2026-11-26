import { ast, type ConstNode, type FileNode, type ImportNode, type ModuleName, type SourceNode } from '@kubb/ast'
import { namesIn, replaceIdentifiers, wrap, type Lang } from './inline.ts'
import type { InlineTextKind } from './nodeText.ts'

/**
 * A name a virtual file declares. `problem` is set when a use of it cannot be inlined.
 */
export type Definition = {
  key: string
  name: string
  file: FileNode
  isType: boolean
  body: string | undefined
  // A body that only names another, such as `Error`, costs less to repeat than to declare.
  bare: boolean
  constant: ConstNode | undefined
  problem: string | undefined
}

/**
 * A piece of text in a file, read once: what each free name in it refers to, the imports of its file it uses, and the
 * names it uses that nothing in the run declares, such as the fetch `Response`.
 */
export type Fragment = {
  file: FileNode
  text: string
  kind: InlineTextKind
  references: Array<Definition | undefined>
  imports: Array<ImportNode>
  globals: Array<string>
}

export type Registry = ReturnType<typeof createRegistry>

/**
 * Lookups shared by every file of one run: which virtual definition a name points at, and what a piece of text refers to.
 * Everything is computed on first use and kept, because the same virtual bodies are read for every file that imports them.
 */
export function createRegistry(virtual: ReadonlyMap<string, FileNode>, lang: Lang) {
  const scopes = new WeakMap<FileNode, Map<string, { path: string; name: string }>>()
  const definitions = new Map<string, Definition>()
  const fragments = new Map<string, Fragment>()

  // The names `file` binds to a virtual file. A virtual file's own declarations win over its imports.
  function scopeOf(file: FileNode) {
    let scope = scopes.get(file)
    if (scope) return scope
    scope = new Map()
    for (const imp of file.imports) {
      if (!virtual.has(imp.path)) continue
      for (const item of ast.file.getNames(imp)) if (!scope.has(localName(item))) scope.set(localName(item), { path: imp.path, name: item.name })
    }
    if (virtual.has(file.path)) for (const source of file.sources) if (source.name) scope.set(source.name, { path: file.path, name: source.name })
    scopes.set(file, scope)
    return scope
  }

  function definitionOf(path: string, name: string): Definition {
    const key = keyOf(path, name)
    const known = definitions.get(key)
    if (known) return known

    const file = virtual.get(path)!
    const [source, ...others] = file.sources.filter((item) => item.name === name)
    const node = declarationOf(source)
    const body = source?.inline ? source.inline.expression : node ? ast.node.getText(node.nodes) || undefined : undefined
    const definition: Definition = {
      key,
      name,
      file,
      isType: !!source && ast.file.getSpace(source) === 'type',
      body,
      bare: body !== undefined && wrap(body.trim()) === body.trim(),
      constant: node?.kind === ast.node.kinds.const ? node : undefined,
      problem:
        body === undefined
          ? `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.`
          : others.length > 0
            ? `"${name}" from "${path}" has more than one declaration, so its uses cannot be told apart.`
            : undefined,
    }
    definitions.set(key, definition)
    return definition
  }

  // The virtual definition `local` names in `file`, or `undefined` when it names nothing virtual.
  function find(file: FileNode, local: string): Definition | undefined {
    const at = scopeOf(file).get(local)
    return at && definitionOf(at.path, at.name)
  }

  function fragment(file: FileNode, text: string, kind: InlineTextKind): Fragment {
    const id = `${file.path}\0${kind}\0${text}`
    const known = fragments.get(id)
    if (known) return known

    const names: Array<string> = []
    replaceIdentifiers(text, (name) => void names.push(name), lang, kind)
    const external = new Set(names.filter((name) => !find(file, name)))
    const result: Fragment = {
      file,
      text,
      kind,
      references: names.map((name) => find(file, name)),
      imports: file.imports.flatMap((imp) => (virtual.has(imp.path) ? [] : pickNames(imp, external))),
      globals: namesIn(text, lang, kind).filter((name) => !find(file, name) && !importsName(file, name)),
    }
    fragments.set(id, result)
    return result
  }

  return {
    lang,
    isVirtual: (path: string) => virtual.has(path),
    find,
    fragment,
    // The body of a definition as a fragment of its own file.
    body: (definition: Definition) => fragment(definition.file, definition.body ?? '', definition.isType ? 'type' : 'value'),
  }
}

/**
 * The key of a name in a module: the module's path and the name it exports.
 */
export function keyOf(path: string, name: string): string {
  return `${path}\0${name}`
}

/**
 * The name an import entry binds in its file: its alias, or else its name.
 */
export function localName(item: ModuleName): string {
  return item.alias ?? item.name
}

export function withNames(imp: ImportNode, names: Array<ModuleName>): ImportNode {
  return ast.factory.createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names })
}

// The one `Const` or `Type` node a source holds.
function declarationOf(source: SourceNode | undefined) {
  const node = source?.nodes?.length === 1 ? source.nodes[0] : undefined
  return node?.kind === ast.node.kinds.const || node?.kind === ast.node.kinds.type ? node : undefined
}

function importsName(file: FileNode, local: string): boolean {
  return file.imports.some((imp) => ast.file.getNames(imp).some((item) => localName(item) === local))
}

function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  const names = ast.file.getNames(imp).filter((item) => used.has(localName(item)))
  return names.length > 0 ? [withNames(imp, names)] : []
}
