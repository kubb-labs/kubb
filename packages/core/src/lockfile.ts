import { hash } from 'node:crypto'
import { relative, resolve } from 'node:path'
import { inParallel, readIfExists, toPosixPath } from '@internals/utils'
import { parse, stringify } from 'yaml'
import type { Storage } from './createStorage.ts'
import { FILE_CONCURRENCY } from './FileManager.ts'
import type { LockfileInputs } from './lockfileInputs.ts'

/** Bumped when the stored shape changes, so an older lockfile is discarded instead of misread. */
const LOCKFILE_VERSION = 1

/** Name of the lockfile, written to the project root and meant to be committed. */
export const LOCKFILE_NAME = 'kubb-lock.yaml'

/** How one generated file looked on either side of the output passes. */
export type LockfileEntry = {
  /** Hash of the content Kubb handed to the storage. */
  source: string
  /** Hash of what the storage held once the output passes were done with it. */
  output: string
}

/** What `kubb-lock.yaml` holds. */
export type LockfileObject = {
  lockfileVersion: number
  /** What each config last generated from, keyed by the config's name. */
  inputs?: Record<string, LockfileInputs>
  files: Record<string, LockfileEntry>
}

/** Line endings are normalized, so a checkout that converts them still matches the lockfile. */
const digest = (text: string): string => hash('sha256', text.replaceAll('\r\n', '\n'))

const isEntry = (value: unknown): value is LockfileEntry =>
  typeof value === 'object' && value !== null && typeof (value as LockfileEntry).source === 'string' && typeof (value as LockfileEntry).output === 'string'

const isInputs = (value: unknown): value is LockfileInputs =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as LockfileInputs).hash === 'string' &&
  Array.isArray((value as LockfileInputs).sources) &&
  (value as LockfileInputs).sources.every((source) => typeof source === 'string')

async function readLockfile(lockfilePath: string): Promise<Pick<LockfileObject, 'files' | 'inputs'> | null> {
  try {
    const stored = await readIfExists(lockfilePath)
    if (stored === null) return null

    const data = parse(stored) as LockfileObject | null
    if (typeof data !== 'object' || data === null) return null
    if (data.lockfileVersion !== LOCKFILE_VERSION) return null
    if (typeof data.files !== 'object' || data.files === null || Array.isArray(data.files)) return null

    const inputs = Object.entries(typeof data.inputs === 'object' && data.inputs !== null ? data.inputs : {}).filter(([, value]) => isInputs(value))

    return { files: Object.fromEntries(Object.entries(data.files).filter(([, entry]) => isEntry(entry))), inputs: Object.fromEntries(inputs) }
  } catch {
    return null
  }
}

/**
 * Remembers what the output passes did to each generated file, so a later run can tell "the
 * formatter already turned this exact source into what is stored" apart from a real change.
 * The record lives in `kubb-lock.yaml`, so a fresh checkout can tell without running the formatter.
 *
 * @example
 * ```ts
 * const lockfile = await createLockfile({ storage: config.storage, root: config.root })
 * if (!lockfile.matches({ key, source, disk })) await storage.writeItem(key, source)
 * ```
 */
export class Lockfile {
  /** `false` when no `kubb-lock.yaml` could be read, so nothing a formatter changed can be recognized. */
  readonly exists: boolean
  readonly #storage: Storage
  readonly #root: string
  readonly #entries: Record<string, LockfileEntry>
  readonly #inputs: Record<string, LockfileInputs>
  readonly #added = new Map<string, string>()
  readonly #matched = new Set<string>()

  /** `object` is what `kubb-lock.yaml` held, or `null` when it could not be read. `storage` holds the generated files. */
  constructor({ storage, root, object }: { storage: Storage; root: string; object: Pick<LockfileObject, 'files' | 'inputs'> | null }) {
    this.exists = object !== null
    this.#storage = storage
    this.#root = root
    this.#entries = object?.files ?? {}
    this.#inputs = object?.inputs ?? {}
  }

  /** The key of a generated file in the lockfile: its path from the root. */
  #toKey(key: string): string {
    return toPosixPath(relative(this.#root, resolve(this.#root, key)))
  }

  /** `true` when every added file matched, so the output passes have nothing new to run over. */
  get unchanged(): boolean {
    return [...this.#added.keys()].every((key) => this.#matched.has(key))
  }

  /** `true` when `source` is known to come out of the output passes as exactly `disk`, so the write can be skipped. */
  matches({ key, source, disk }: { key: string; source: string; disk: string }): boolean {
    const entry = this.#entries[this.#toKey(key)]
    if (!entry || entry.source !== digest(source) || entry.output !== digest(disk)) return false
    this.#matched.add(key)

    return true
  }

  /** Records the source Kubb generated for `key`, so `write` adds the file to the lockfile. */
  add({ key, source }: { key: string; source: string }): void {
    this.#added.set(key, digest(source))
  }

  /** What the config called `name` last generated from, when the lockfile recorded it. */
  inputs(name: string): LockfileInputs | undefined {
    return this.#inputs[name]
  }

  /** Whether every listed file still holds its recorded output, and `cleanDir` holds no file that is not listed. */
  async verify({ cleanDir }: { cleanDir?: string } = {}): Promise<boolean> {
    const stale = new Set<string>()
    await inParallel({
      items: Object.entries(this.#entries),
      limit: FILE_CONCURRENCY,
      run: async ([key, entry]) => {
        const stored = await this.#storage.readItem(resolve(this.#root, key))
        if (stored === null || digest(stored) !== entry.output) stale.add(key)
      },
    })
    if (stale.size) return false
    if (!cleanDir) return true

    return (await this.#storage.readKeys(cleanDir)).every((name) => Object.hasOwn(this.#entries, this.#toKey(resolve(cleanDir, name))))
  }

  /**
   * Writes `kubb-lock.yaml` with one entry for each file generated this run. An entry from an earlier run
   * stays while its file still holds the recorded output. `inputs` records what the config called
   * `name` generated from, and drops that record when it is `null`.
   */
  async write(options?: { name: string; inputs: LockfileInputs | null }): Promise<void> {
    const storage = this.#storage
    const root = this.#root
    try {
      const next: Record<string, LockfileEntry> = {}
      const written = new Set([...this.#added.keys()].map((key) => this.#toKey(key)))
      let droppedEntry = false

      await inParallel({
        items: Object.entries(this.#entries).filter(([key]) => !written.has(key)),
        limit: FILE_CONCURRENCY,
        run: async ([key, entry]) => {
          const stored = await storage.readItem(resolve(root, key))
          if (stored !== null && digest(stored) === entry.output) next[key] = entry
          else droppedEntry = true
        },
      })
      // Reads the tree back through the same pool that wrote it, rather than one file at a time.
      await inParallel({
        items: [...this.#added],
        limit: FILE_CONCURRENCY,
        run: async ([key, source]) => {
          const stored = await storage.readItem(key)
          if (stored !== null) next[this.#toKey(key)] = { source, output: digest(stored) }
        },
      })

      // Sorted by path, so the file reads the same whatever order the files were written in.
      const files = Object.fromEntries(
        Object.keys(next)
          .sort()
          .map((key) => [key, next[key]!]),
      )
      // A dropped entry belonged to another config, whose output is then no longer what it recorded.
      const inputs = droppedEntry ? {} : { ...this.#inputs }
      if (options?.inputs) inputs[options.name] = options.inputs
      else if (options) delete inputs[options.name]
      const object: LockfileObject = { lockfileVersion: LOCKFILE_VERSION, ...(Object.keys(inputs).length > 0 && { inputs }), files }
      // Through the storage, so a run that stages its files stages the lockfile with them.
      // `lineWidth: 0` keeps each value on one line, whatever the length of a path.
      await storage.writeItem(resolve(root, LOCKFILE_NAME), stringify(object, { lineWidth: 0 }))
    } catch {
      /* the record is an optimization, so a storage failure here must not fail a finished build */
    }
  }
}

/**
 * Reads `kubb-lock.yaml` from `root` into a {@link Lockfile}, which starts empty when the file is
 * missing, unreadable, or from another version. `storage` holds the generated files.
 *
 * @example
 * ```ts
 * const lockfile = await createLockfile({ storage: config.storage, root: config.root })
 * ```
 */
export async function createLockfile({ storage, root }: { storage: Storage; root: string }): Promise<Lockfile> {
  return new Lockfile({ storage, root, object: await readLockfile(resolve(root, LOCKFILE_NAME)) })
}
