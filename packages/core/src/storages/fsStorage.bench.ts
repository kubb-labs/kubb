import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { readdir } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { bench, describe } from 'vitest'

// ---------------------------------------------------------------------------
// Build a temporary directory tree that resembles a kubb output directory
// ---------------------------------------------------------------------------

const root = path.join(tmpdir(), `kubb-fsbench-${process.pid}`)

async function buildTree(dir: string, depth: number, breadth: number): Promise<void> {
  await mkdir(dir, { recursive: true })
  for (let i = 0; i < breadth; i++) {
    await writeFile(path.join(dir, `file${i}.ts`), '')
  }
  if (depth > 0) {
    for (let i = 0; i < Math.ceil(breadth / 2); i++) {
      await buildTree(path.join(dir, `sub${i}`), depth - 1, breadth)
    }
  }
}

// Setup: ~breadth^(depth+1) files. depth=3, breadth=5 → ~155 files.
await buildTree(root, 3, 5)

// Cleanup after all benchmarks finish
globalThis.__benchCleanup = async () => rm(root, { recursive: true, force: true })

// ---------------------------------------------------------------------------
// Old: closure-mutating walk
// ---------------------------------------------------------------------------

async function walkOld(dir: string, prefix: string, keys: Array<string>): Promise<void> {
  let entries: Array<Dirent>
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Array<Dirent>
  } catch {
    return
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      await walkOld(path.join(dir, entry.name), rel, keys)
    } else {
      keys.push(rel)
    }
  }
}

async function getKeysOld(base: string): Promise<Array<string>> {
  const keys: Array<string> = []
  await walkOld(base, '', keys)
  return keys
}

// ---------------------------------------------------------------------------
// New: async generator walk
// ---------------------------------------------------------------------------

async function* walkNew(dir: string, prefix: string): AsyncGenerator<string, void, undefined> {
  let entries: Array<Dirent>
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Array<Dirent>
  } catch {
    return
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      yield* walkNew(path.join(dir, entry.name), rel)
    } else {
      yield rel
    }
  }
}

async function getKeysNew(base: string): Promise<Array<string>> {
  const keys: Array<string> = []
  for await (const key of walkNew(base, '')) {
    keys.push(key)
  }
  return keys
}

// ---------------------------------------------------------------------------

describe('fsStorage.getKeys() walk — closure-mutation (old) vs async generator (new)', () => {
  bench(
    'closure-mutation / old',
    async () => {
      await getKeysOld(root)
    },
    { iterations: 50, warmupIterations: 5 },
  )

  bench(
    'async generator / new',
    async () => {
      await getKeysNew(root)
    },
    { iterations: 50, warmupIterations: 5 },
  )
})
