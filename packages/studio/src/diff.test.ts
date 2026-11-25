import { describe, expect, it } from 'vitest'
import { pageHunks } from './diff.ts'

describe('pageHunks', () => {
  const hunks = [
    { oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' a', '-b', '+c'] },
    { oldStart: 10, oldLines: 1, newStart: 10, newLines: 1, lines: ['-d', '+e'] },
  ]
  const first = { index: 0, oldStart: 1, oldLines: 2, newStart: 1, newLines: 2 }
  const second = { index: 1, oldStart: 10, oldLines: 1, newStart: 10, newLines: 1 }

  it('splits only a hunk longer than a page, with its header on each part', () => {
    expect(pageHunks({ hunks, cursor: 0, limit: 2 })).toStrictEqual({ hunks: [{ ...first, lines: [' a', '-b'] }], nextCursor: 2 })
    expect(pageHunks({ hunks, cursor: 2, limit: 2 })).toStrictEqual({ hunks: [{ ...first, lines: ['+c'] }], nextCursor: 3 })
  })

  it('keeps a no-newline marker on the page of its line', () => {
    const end = [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-a', '\\ No newline at end of file', '+b'] }]
    expect(pageHunks({ hunks: end, cursor: 0, limit: 1 })).toMatchObject({ hunks: [{ lines: ['-a', '\\ No newline at end of file'] }], nextCursor: 2 })
  })

  it('returns every hunk that fits, and a null cursor on the last page', () => {
    expect(pageHunks({ hunks, cursor: 0, limit: 10 })).toStrictEqual({
      hunks: [
        { ...first, lines: [' a', '-b', '+c'] },
        { ...second, lines: ['-d', '+e'] },
      ],
      nextCursor: null,
    })
    expect(pageHunks({ hunks, cursor: 5, limit: 10 })).toStrictEqual({ hunks: [], nextCursor: null })
  })
})
