import { uniqueName } from '@internals/utils'
import { createImport } from '../nodes/file.ts'
import type { FileNode, ImportNode } from '../nodes/file.ts'
import { getNames } from './moduleNames.ts'
import { rewriteNodes } from './nodeText.ts'
import type { Definition, InlineLanguage } from './virtualFiles.ts'

// The names one file binds, so a carried import or a local declaration never takes a name already in use. A carried name the
// file already binds to something else, such as a schema `Options` next to the client's own `Options`, gets an alias like
// `Options2`.
export type BindingsOptions = { file: FileNode; lang: InlineLanguage }

export class Bindings {
  readonly carried: Array<ImportNode> = []
  readonly #lang: InlineLanguage
  // Each name, to the import (module and exported name) or declaration behind it. `''` marks a global, such as the fetch
  // `Response` next to a schema `Response`.
  readonly #names = new Map<string, string>()

  constructor({ file, lang }: BindingsOptions) {
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

export function createBindings(options: BindingsOptions): Bindings {
  return new Bindings(options)
}
