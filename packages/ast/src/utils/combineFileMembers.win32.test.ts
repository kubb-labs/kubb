import { describe, expect, it, vi } from 'vitest'
import { createImport } from '../nodes/file.ts'
import { combineImports } from './combineFileMembers.ts'

// Runs the sort with Windows path semantics, so CI on Linux checks it too.
vi.mock('node:path', async () => {
  const { win32 } = await vi.importActual<typeof import('node:path')>('node:path')
  return { default: win32, ...win32 }
})

describe('combineImports on Windows', () => {
  it('sorts drive-letter paths in the same order as POSIX paths', () => {
    const root = 'D:\\project\\src\\hooks\\usePet.ts'
    const scoped = createImport({ name: ['fetch'], path: '@kubb/fetch' })
    const sibling = createImport({ name: ['helper'], path: 'D:\\project\\src\\hooks\\helper.ts', root })
    const parent = createImport({ name: ['Pet'], path: 'D:\\project\\src\\types\\Pet.ts', root })

    expect(combineImports([scoped, sibling, parent], [], 'fetch helper Pet').map((i) => i.path)).toStrictEqual([parent.path, sibling.path, scoped.path])
  })
})
