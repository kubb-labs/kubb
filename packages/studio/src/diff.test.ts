import { describe, expect, it } from 'vitest'
import { diffHunks, pageHunks, replaceHunk } from './diff.ts'

const lines = (count: number, change?: number) => Array.from({ length: count }, (_, i) => (i === change ? `changed ${i}` : `line ${i}`)).join('\n')

describe('diffHunks', () => {
  it('returns only the changed lines with their context', async () => {
    const hunks = await diffHunks(lines(100), lines(100, 50))
    expect(hunks).toHaveLength(1)
    expect(hunks![0]).toMatchObject({ oldStart: 48, newStart: 48 })
    expect(hunks![0]!.lines).toStrictEqual([' line 47', ' line 48', ' line 49', '-line 50', '+changed 50', ' line 51', ' line 52', ' line 53'])
  })

  it('returns no hunks for equal files', async () => {
    await expect(diffHunks('a\n', 'a\n')).resolves.toStrictEqual([])
  })
})

describe('replaceHunk', () => {
  it('replaces the lines between the shared start and end, with context', () => {
    expect(replaceHunk(lines(20), lines(20, 10))).toStrictEqual([
      {
        oldStart: 8,
        oldLines: 7,
        newStart: 8,
        newLines: 7,
        lines: [' line 7', ' line 8', ' line 9', '-line 10', '+changed 10', ' line 11', ' line 12', ' line 13'],
      },
    ])
  })

  it('handles added, deleted, and equal files', () => {
    expect(replaceHunk('', 'a\nb\n')[0]).toMatchObject({ oldLines: 0, newLines: 2, lines: ['+a', '+b'] })
    expect(replaceHunk('a\n', '')[0]).toMatchObject({ oldLines: 1, newLines: 0, lines: ['-a'] })
    expect(replaceHunk('a\n', 'a\n')).toStrictEqual([])
  })
})

describe('pageHunks', () => {
  const hunks = [
    { oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' a', '-b', '+c'] },
    { oldStart: 10, oldLines: 1, newStart: 10, newLines: 1, lines: ['-d', '+e'] },
  ]

  it('splits a hunk at the page boundary and keeps its index', () => {
    expect(pageHunks({ hunks, cursor: 0, limit: 2 })).toStrictEqual({
      hunks: [{ index: 0, oldStart: 1, newStart: 1, lines: [' a', '-b'] }],
      nextCursor: 2,
    })
    expect(pageHunks({ hunks, cursor: 2, limit: 2 })).toStrictEqual({
      hunks: [
        { index: 0, oldStart: 1, newStart: 1, lines: ['+c'] },
        { index: 1, oldStart: 10, newStart: 10, lines: ['-d'] },
      ],
      nextCursor: 4,
    })
  })

  it('ends with a null cursor on the last page', () => {
    expect(pageHunks({ hunks, cursor: 4, limit: 10 })).toStrictEqual({ hunks: [{ index: 1, oldStart: 10, newStart: 10, lines: ['+e'] }], nextCursor: null })
  })
})
