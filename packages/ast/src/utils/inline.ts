import type { CodeNode } from '../nodes/code.ts'
import { createFile } from '../nodes/file.ts'
import type { FileNode, ImportNode } from '../nodes/file.ts'

const IDENTIFIER = /[A-Za-z_$][\w$]*/y

/**
 * Whether every source of `file` is inline. Other files absorb such a file, so it is never written.
 */
export function isVirtualFile(file: FileNode): boolean {
  return file.sources.length > 0 && file.sources.every((source) => source.inline)
}

/**
 * The result of {@link inlineFiles}.
 */
export type InlineFilesResult = {
  /**
   * Files that imported an inline name, rewritten to hold its definition and the imports that definition needs.
   */
  files: Array<FileNode>
  /**
   * Paths of the virtual files. They are not written.
   */
  virtualPaths: Array<string>
  /**
   * One message per name that could not be inlined.
   */
  problems: Array<{ path: string; message: string }>
}

type Definition = { expression: string; imports: Array<ImportNode> }

/**
 * Replaces every name a file imports from a virtual file (see {@link isVirtualFile}) with that name's
 * `inline.expression`, until no inline names are left. The definitions' own imports move to the
 * importing file, limited to the names the definitions use.
 *
 * @example
 * ```ts
 * // models/pet/AddPet.ts (virtual): type AddPetOptions = { body: Pet }, importing Pet from models/Pet.ts
 * // clients/addPet.ts: import type { AddPetOptions } from '../models/pet/AddPet'
 * inlineFiles(files).files
 * // clients/addPet.ts: import type { Pet } from '../models/Pet', with `({ body: Pet })` where `AddPetOptions` was
 * ```
 */
export function inlineFiles(files: ReadonlyArray<FileNode>): InlineFilesResult {
  const virtualFiles = new Map(files.filter(isVirtualFile).map((file) => [file.path, file]))
  const result: InlineFilesResult = { files: [], virtualPaths: [...virtualFiles.keys()], problems: [] }
  if (virtualFiles.size === 0) return result

  // `null` marks a definition that is being resolved, so a name that reaches itself is a cycle.
  const definitions = new Map<string, Definition | null>()

  function define(path: string, name: string, from: string): Definition | undefined {
    const key = `${path}\0${name}`
    if (definitions.has(key)) {
      const definition = definitions.get(key)
      if (definition === null) result.problems.push({ path: from, message: `"${name}" from "${path}" is defined in terms of itself.` })
      return definition ?? undefined
    }
    const file = virtualFiles.get(path)!
    const inline = file.sources.find((source) => source.name === name)?.inline
    if (!inline) {
      result.problems.push({ path: from, message: `"${name}" is imported from "${path}", which never writes it and has no inline definition for it.` })
      return undefined
    }
    definitions.set(key, null)
    const { text, imports, used } = substitute(inline.expression, file)
    const own = file.imports.flatMap((imp) => (virtualFiles.has(imp.path) ? [] : pickNames(imp, used)))
    const definition = { expression: text, imports: [...imports, ...own] }
    definitions.set(key, definition)
    return definition
  }

  // Replaces the inline names `file` can see: its own inline sources and what it imports from virtual files.
  function substitute(input: string, file: FileNode) {
    const imports: Array<ImportNode> = []
    const used = new Set<string>()
    const text = replaceIdentifiers(input, (local) => {
      const target = findTarget(file, local)
      const definition = target && define(target.path, target.name, file.path)
      if (!definition) {
        used.add(local)
        return undefined
      }
      imports.push(...definition.imports)
      return /^[\w$.]+$/.test(definition.expression) ? definition.expression : `(${definition.expression})`
    })
    return { text, imports, used }
  }

  function findTarget(file: FileNode, local: string): { path: string; name: string } | undefined {
    if (virtualFiles.has(file.path) && file.sources.some((source) => source.name === local)) return { path: file.path, name: local }
    for (const imp of file.imports) {
      if (!virtualFiles.has(imp.path)) continue
      for (const item of [imp.name].flat()) {
        if (item === local) return { path: imp.path, name: local }
        if (typeof item === 'object' && (item.name ?? item.propertyName) === local) return { path: imp.path, name: item.propertyName }
      }
    }
    return undefined
  }

  for (const file of files) {
    if (virtualFiles.has(file.path) || !file.imports.some((imp) => virtualFiles.has(imp.path))) continue
    for (const exp of file.exports) {
      if (virtualFiles.has(exp.path)) result.problems.push({ path: file.path, message: `Re-exports "${exp.path}", which is never written.` })
    }

    const carried: Array<ImportNode> = []
    const rewrite = (input: string) => {
      const { text, imports } = substitute(input, file)
      carried.push(...imports)
      return text
    }
    const sources = file.sources.map((source) => ({ ...source, nodes: rewriteNodes(source.nodes, rewrite) }))

    const kept = file.imports.filter((imp) => !virtualFiles.has(imp.path))
    const owners = new Map<string, string>([
      ...file.sources.flatMap((source) => (source.name ? [[source.name, file.path] as const] : [])),
      ...kept.flatMap((imp) => importedNames(imp).map((name) => [name, imp.path] as const)),
    ])
    for (const imp of carried) {
      for (const name of importedNames(imp)) {
        const owner = owners.get(name)
        if (owner && owner !== imp.path)
          result.problems.push({ path: file.path, message: `"${name}" from "${imp.path}" clashes with "${name}" from "${owner}".` })
      }
    }

    // A carried import keeps its target; `root` moves to the importing file so the relative path is computed from there.
    const imports = [...kept, ...carried.map((imp) => (imp.root ? { ...imp, root: file.path } : imp))]
    result.files.push(createFile({ ...file, sources, imports }))
  }

  return result
}

function importedNames(imp: ImportNode): Array<string> {
  return [imp.name].flat().map((item) => (typeof item === 'string' ? item : (item.name ?? item.propertyName)))
}

// The part of `imp` whose local names are in `used`, or nothing when none are.
function pickNames(imp: ImportNode, used: ReadonlySet<string>): Array<ImportNode> {
  if (!Array.isArray(imp.name)) return used.has(imp.name) ? [imp] : []
  const name = imp.name.filter((item) => used.has(typeof item === 'string' ? item : (item.name ?? item.propertyName)))
  return name.length > 0 ? [{ ...imp, name }] : []
}

// Rewrites the string fields `extractStringsFromNodes` reads; JSDoc stays as written.
function rewriteNodes(nodes: Array<CodeNode> | undefined, rewrite: (text: string) => string): Array<CodeNode> | undefined {
  return nodes?.map((node) => {
    // Backward-compat: compiled plugins may still pass bare strings at runtime
    if (typeof node === 'string') return rewrite(node) as unknown as CodeNode
    if (node.kind === 'Break') return node
    if (node.kind === 'Text' || node.kind === 'Jsx') return { ...node, value: rewrite(node.value) }

    const next = { ...node, nodes: rewriteNodes(node.nodes, rewrite) }
    if ('params' in next && next.params) next.params = rewrite(next.params)
    if ('returnType' in next && next.returnType) next.returnType = rewrite(next.returnType)
    if ('generics' in next && next.generics) next.generics = Array.isArray(next.generics) ? next.generics.map(rewrite) : rewrite(next.generics)
    if ('type' in next && typeof next.type === 'string') next.type = rewrite(next.type)
    return next
  })
}

/**
 * Calls `replace` for every identifier that references something, and swaps in what it returns.
 * Strings, comments, member access (`x.Name`) and object keys (`{ Name: 1 }`) are left alone.
 *
 * shortcut: a regex literal is scanned as code, so a quote inside one can hide the identifiers after it; parse with TypeScript if generated code starts mixing regex literals with inline names.
 */
export function replaceIdentifiers(text: string, replace: (name: string) => string | undefined): string {
  let out = ''
  let i = 0
  // `true` for a `${` inside a template literal, `false` for a plain `{`, so each `}` knows whether the template resumes.
  const braces: Array<boolean> = []
  const copy = (end: number) => {
    out += text.slice(i, end)
    i = end
  }
  const template = () => {
    while (i < text.length) {
      if (text[i] === '\\') copy(i + 2)
      else if (text[i] === '`') return copy(i + 1)
      else if (text[i] === '$' && text[i + 1] === '{') {
        braces.push(true)
        return copy(i + 2)
      } else copy(i + 1)
    }
  }

  while (i < text.length) {
    const char = text[i]!
    const next = text[i + 1]
    if (char === '/' && next === '/') {
      const end = text.indexOf('\n', i)
      copy(end === -1 ? text.length : end)
    } else if (char === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      copy(end === -1 ? text.length : end + 2)
    } else if (char === '"' || char === "'") {
      let end = i + 1
      while (end < text.length && text[end] !== char) end += text[end] === '\\' ? 2 : 1
      copy(end + 1)
    } else if (char === '`') {
      copy(i + 1)
      template()
    } else if (char === '{') {
      braces.push(false)
      copy(i + 1)
    } else if (char === '}') {
      copy(i + 1)
      if (braces.pop()) template()
    } else if (char >= '0' && char <= '9') {
      // A number such as `1e5` or `0x1F`: its letters are not identifiers.
      let end = i + 1
      while (end < text.length && /[\w$.]/.test(text[end]!)) end++
      copy(end)
    } else {
      IDENTIFIER.lastIndex = i
      const name = IDENTIFIER.exec(text)?.[0]
      if (!name) {
        copy(i + 1)
        continue
      }
      const end = i + name.length
      out += (isReference(text, i, end) ? replace(name) : undefined) ?? name
      i = end
    }
  }
  return out
}

function isReference(text: string, start: number, end: number): boolean {
  let before = start - 1
  while (before >= 0 && (text[before] === ' ' || text[before] === '\t')) before--
  const previous = before < 0 ? '\n' : text[before]!
  // Member access `x.Name` or `x?.Name`, but not a spread `...Name`.
  if (previous === '.' && text[before - 1] !== '.') return false

  let after = end
  while (after < text.length && (text[after] === ' ' || text[after] === '\t')) after++
  const isKey = text[after] === ':' || (text[after] === '?' && text[after + 1] === ':')
  // A key or parameter name (`{ Name: x }`, `(Name: x)`); `? Name :` in a conditional type is a reference.
  return !(isKey && '{,;(\n\r'.includes(previous))
}
