import { uniqueName } from './text.ts'

/**
 * The names one candidate claims: the candidate itself by default, or several, such as an enum's value and its type.
 */
export type RenamerEmits = (candidate: string) => string | ReadonlyArray<string>

export type RenamerAssignOptions = {
  /**
   * The name to start from. A number is added when it is taken, as in `Options2`.
   */
  name: string
  /**
   * Who claims the name. The same owner may take a name it already holds. Leave it out to always take a free name.
   */
  owner?: string
  /**
   * The names a candidate claims. All of them must be free.
   */
  emits?: RenamerEmits
}

// The owner of a reserved name, such as a global, which nobody can take.
const reserved = Symbol('reserved')

/**
 * Hands out names that do not clash, adding 2, 3 and so on when a name is taken, and remembers which owner holds each.
 *
 * @example
 * ```ts
 * const renamer = createRenamer()
 * renamer.reserve('Response') // a global the file uses
 * renamer.assign({ name: 'Response' }) // 'Response2'
 * ```
 *
 * @example
 * ```ts
 * const renamer = createRenamer()
 * renamer.bind({ name: 'Options', owner: '@kubb/client' })
 * renamer.assign({ name: 'Options', owner: '@kubb/client' }) // 'Options', the same owner
 * renamer.assign({ name: 'Options', owner: './models.ts' }) // 'Options2'
 * ```
 */
export class Renamer {
  readonly #owners = new Map<string, string | symbol>()

  /**
   * Keeps `name` from being assigned, unless something already holds it.
   */
  reserve(name: string): void {
    if (!this.#owners.has(name)) this.#owners.set(name, reserved)
  }

  /**
   * Gives `name` to `owner` as it is, such as a name a file already imports.
   */
  bind({ name, owner }: { name: string; owner: string }): void {
    this.#owners.set(name, owner)
  }

  /**
   * Returns the first free name from `name`, and claims every name it emits for `owner`.
   */
  assign({ name, owner, emits = (candidate) => candidate }: RenamerAssignOptions): string {
    const holder = owner ?? Symbol(name)
    // `emits` may be costly, such as casing an enum's names, so each candidate is read once.
    const read = new Map<string, ReadonlyArray<string>>()
    const claimed = (candidate: string): ReadonlyArray<string> => {
      const known = read.get(candidate)
      if (known) return known
      const names = emits(candidate)
      const list = typeof names === 'string' ? [names] : names
      read.set(candidate, list)
      return list
    }
    const isTaken = (candidate: string) => claimed(candidate).some((emitted) => this.#owners.has(emitted) && this.#owners.get(emitted) !== holder)
    const local = uniqueName(name, isTaken)
    for (const emitted of claimed(local)) this.#owners.set(emitted, holder)
    return local
  }
}

/**
 * Creates an empty renamer.
 */
export function createRenamer(): Renamer {
  return new Renamer()
}
