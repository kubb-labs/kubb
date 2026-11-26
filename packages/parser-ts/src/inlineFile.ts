import { uniqueName } from '@internals/utils'
import { ast, type FileNode, type ImportNode, type SourceNode } from '@kubb/ast'
import type { InlineResult } from '@kubb/core'
import { namesIn, replaceIdentifiers, wrap } from './inline.ts'
import { rewriteNodes } from './nodeText.ts'
import { keyOf, localName, withNames, type Definition, type Fragment, type Registry } from './registry.ts'

/**
 * Rewrites one file that imports from virtual files, in two passes. The first counts how often each definition is used and
 * reserves every name in sight. The second writes each use: a bare name in place, a value as one local constant, and a type
 * as one local type when it is used more than once, or in place otherwise.
 */
export function inlineFile(file: FileNode, registry: Registry): { file: FileNode; problems: InlineResult['problems'] } {
  const { lang } = registry
  const namer = createNamer(file)
  const uses = countUses(file, registry, namer.reserve)

  const problems: InlineResult['problems'] = []
  const declarations: Array<SourceNode> = []
  const carried: Array<ImportNode> = []
  const locals = new Map<string, string>()
  const writing = new Set<string>()

  const report = (from: FileNode, message: string): undefined => void problems.push({ path: from.path, message })

  // What `id` in `from` becomes, or `undefined` to keep it as it is.
  function resolve(from: FileNode, id: string): string | undefined {
    const definition = registry.find(from, id)
    const written = definition && write(from, definition)
    return written === id ? undefined : written
  }

  function write(from: FileNode, definition: Definition): string | undefined {
    if (definition.problem) return report(from, definition.problem)
    return locals.get(definition.key) ?? writeOnce(from, definition)
  }

  function writeOnce(from: FileNode, definition: Definition): string | undefined {
    const { key, isType } = definition
    const declare = !definition.bare && (!isType || (uses.get(key) ?? 0) > 1)
    // A type claims its name before its body is written, so a type that refers to itself can use it. A value cannot.
    const early = declare && isType ? claim(definition) : undefined
    if (!early && writing.has(key)) return report(from, `"${definition.name}" from "${definition.file.path}" is defined in terms of itself.`)

    writing.add(key)
    const body = writeFragment(registry.body(definition))
    writing.delete(key)
    return declare ? declareLocal(definition, early ?? claim(definition), body) : wrap(body)
  }

  // The imports a fragment needs are carried first, so their aliases never rename a local the fragment resolves to.
  function writeFragment(fragment: Fragment): string {
    const aliases = carry(fragment.imports)
    return replaceIdentifiers(fragment.text, (id) => resolve(fragment.file, id) ?? aliases.get(id), lang, fragment.kind)
  }

  function declareLocal(definition: Definition, local: string, body: string): string {
    const { constant, isType } = definition
    // A constant keeps its type annotation and `as const`, so its literal types do not widen.
    const type = constant?.type ? writeFragment(registry.fragment(definition.file, constant.type, 'type')) : undefined
    const node = isType
      ? ast.factory.createType({ name: local, nodes: [ast.factory.createText(body)] })
      : ast.factory.createConst({
          name: local,
          ...(type ? { type } : {}),
          ...(constant?.asConst ? { asConst: true } : {}),
          nodes: [ast.factory.createText(body)],
        })
    declarations.push(ast.factory.createSource({ name: local, isTypeOnly: isType, nodes: [node] }))
    return local
  }

  function claim(definition: Definition): string {
    const local = namer.bind(definition.key, definition.name)
    locals.set(definition.key, local)
    return local
  }

  // Carries `imports` into the file and returns the alias of each name that clashed, such as `Options` becoming `Options2`.
  function carry(imports: ReadonlyArray<ImportNode>): Map<string, string> {
    const aliases = new Map<string, string>()
    for (const imp of imports) {
      const before = aliases.size
      const names = ast.file.getNames(imp).map((item) => {
        const local = localName(item)
        const name = namer.bind(keyOf(imp.path, item.name), local)
        if (name === local) return item
        aliases.set(local, name)
        return { ...item, alias: name }
      })
      carried.push(aliases.size > before ? withNames(imp, names) : imp)
    }
    return aliases
  }

  const sources = file.sources.map((source) => ({
    ...source,
    nodes: rewriteNodes(source.nodes, (text, kind) => replaceIdentifiers(text, (id) => resolve(file, id), lang, kind)),
  }))
  // A carried import keeps its target; `root` moves to this file so the relative path is computed from here.
  const imports = [...file.imports.filter((imp) => !registry.isVirtual(imp.path)), ...carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))]

  return { file: ast.factory.createFile({ ...file, sources: [...declarations, ...sources], imports }), problems }
}

// How often the file uses each definition, following bodies. A body is read once, but a bare alias is followed at each use,
// so the count of what it names stays right. Every name the file uses, and every global a body uses, is reserved.
function countUses(file: FileNode, registry: Registry, reserve: (name: string) => void): Map<string, number> {
  const uses = new Map<string, number>()
  const following = new Set<string>()

  function scan(fragment: Fragment): void {
    for (const name of fragment.globals) reserve(name)
    for (const definition of fragment.references) if (definition?.body !== undefined) visit(definition)
  }

  function visit(definition: Definition): void {
    const seen = uses.get(definition.key) ?? 0
    uses.set(definition.key, seen + 1)
    if (definition.bare && !following.has(definition.key)) {
      following.add(definition.key)
      scan(registry.body(definition))
      following.delete(definition.key)
    } else if (seen === 0) scan(registry.body(definition))
  }

  for (const source of file.sources) {
    rewriteNodes(source.nodes, (text, kind) => {
      for (const name of namesIn(text, registry.lang, kind)) reserve(name)
      scan(registry.fragment(file, text, kind))
      return text
    })
  }
  return uses
}

// Which binding owns each name in the file, so a carried import or a local declaration never takes one already in use.
// `''` marks a reserved name, such as a global.
function createNamer(file: FileNode) {
  const owners = new Map<string, string>()
  for (const imp of file.imports) for (const item of ast.file.getNames(imp)) owners.set(localName(item), keyOf(imp.path, item.name))
  for (const source of file.sources) if (source.name) owners.set(source.name, file.path)

  return {
    reserve(name: string): void {
      if (!owners.has(name)) owners.set(name, '')
    },
    // Claims a local name for `key`, adding a number when another binding has it.
    bind(key: string, name: string): string {
      const local = uniqueName(name, (candidate) => owners.has(candidate) && owners.get(candidate) !== key)
      owners.set(local, key)
      return local
    },
  }
}
