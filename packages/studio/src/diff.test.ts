import { applyPatch } from 'diff'
import { describe, expect, it, vi } from 'vitest'
import { diffHunks, pageHunks } from './diff.ts'

const lines = (count: number, change?: number) => Array.from({ length: count }, (_, i) => (i === change ? `changed ${i}` : `line ${i}`)).join('\n')

describe('diffHunks', () => {
  it('returns only the changed lines with their context', () => {
    const { hunks, stats } = diffHunks(lines(100), lines(100, 50))
    expect(stats).toStrictEqual({ additions: 1, deletions: 1, hunks: 1, lines: 8, coarse: false })
    expect(hunks).toHaveLength(1)
    expect(hunks[0]).toMatchObject({ oldStart: 48, oldLines: 7, newStart: 48, newLines: 7 })
    expect(hunks[0]!.lines).toStrictEqual([' line 47', ' line 48', ' line 49', '-line 50', '+changed 50', ' line 51', ' line 52', ' line 53'])
  })

  it('returns no hunks for equal files', () => {
    expect(diffHunks('a\n', 'a\n').hunks).toStrictEqual([])
  })

  it('marks a last line without a newline', () => {
    expect(diffHunks('a\n', 'a').hunks).toStrictEqual([
      { oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-a', '+a', '\\ No newline at end of file'] },
    ])
  })

  it('handles added and deleted files', () => {
    // A timeout of 0 takes the fallback, which must number them the same way.
    for (const timeout of [1_000, 0]) {
      expect(diffHunks('', 'a\nb\n', timeout).hunks).toStrictEqual([{ oldStart: 1, oldLines: 0, newStart: 1, newLines: 2, lines: ['+a', '+b'] }])
      expect(diffHunks('a\n', '', timeout).hunks).toStrictEqual([{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 0, lines: ['-a'] }])
    }
  })

  it('replaces a segment it has no time to diff', () => {
    // Every clock read moves 1 ms on, so the diff always runs past a 0 ms deadline.
    let now = 0
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now++)
    const { hunks, stats } = diffHunks('a\nb\nc\nd\n', 'a\nx\nc\ny\n', 0)
    expect(stats.coarse).toBe(true)
    expect(hunks).toStrictEqual([{ oldStart: 1, oldLines: 4, newStart: 1, newLines: 4, lines: [' a', '-b', '-c', '-d', '+x', '+c', '+y'] }])
    clock.mockRestore()
  })

  it('shifts the hunks of later segments to their place in the file', () => {
    const { hunks } = diffHunks(lines(100, 10), lines(100, 80))
    expect(hunks!.map(({ oldStart, newStart, lines }) => ({ oldStart, newStart, lines: lines.filter((line) => line[0] !== ' ') }))).toStrictEqual([
      { oldStart: 8, newStart: 8, lines: ['-changed 10', '+line 10'] },
      { oldStart: 78, newStart: 78, lines: ['-line 80', '+changed 80'] },
    ])
  })

  it('returns hunks that rebuild the new file', () => {
    let seed = 1
    const random = (max: number) => (seed = (seed * 48271) % 2147483647) % max
    for (let run = 0; run < 200; run++) {
      const before = Array.from({ length: random(40) }, () => `line ${random(15)}`)
      const after = before.flatMap((line) => [[], [line], [`line ${random(15)}`], [line, `line ${random(15)}`]][random(4)]!)
      const end = random(2) ? '\n' : ''
      const text = (rows: Array<string>) => rows.join('\n') + (rows.length ? end : '')
      for (const timeout of [1_000, 0]) {
        expect(
          applyPatch(text(before), {
            oldFileName: '',
            newFileName: '',
            oldHeader: undefined,
            newHeader: undefined,
            hunks: diffHunks(text(before), text(after), timeout).hunks,
          }),
        ).toBe(text(after))
      }
    }
  })
})

describe('pageHunks', () => {
  const hunks = [
    { oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' a', '-b', '+c'] },
    { oldStart: 10, oldLines: 1, newStart: 10, newLines: 1, lines: ['-d', '+e'] },
  ]
  const first = { index: 0, oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, collapsedBefore: 0 }
  const second = { index: 1, oldStart: 10, oldLines: 1, newStart: 10, newLines: 1, collapsedBefore: 7 }

  it('ends a page before a hunk that does not fit', () => {
    expect(pageHunks({ hunks, cursor: 0, limit: 4 })).toStrictEqual({ hunks: [{ ...first, offset: 0, lines: [' a', '-b', '+c'] }], nextCursor: 3 })
    expect(pageHunks({ hunks, cursor: 3, limit: 4 })).toStrictEqual({ hunks: [{ ...second, offset: 0, lines: ['-d', '+e'] }], nextCursor: null })
  })

  it('splits only a hunk longer than a page, with its header on each part', () => {
    expect(pageHunks({ hunks, cursor: 0, limit: 2 })).toStrictEqual({ hunks: [{ ...first, offset: 0, lines: [' a', '-b'] }], nextCursor: 2 })
    expect(pageHunks({ hunks, cursor: 2, limit: 2 })).toStrictEqual({ hunks: [{ ...first, offset: 2, lines: ['+c'] }], nextCursor: 3 })
  })

  it('returns every hunk that fits, and a null cursor on the last page', () => {
    expect(pageHunks({ hunks, cursor: 0, limit: 10 })).toStrictEqual({
      hunks: [
        { ...first, offset: 0, lines: [' a', '-b', '+c'] },
        { ...second, offset: 0, lines: ['-d', '+e'] },
      ],
      nextCursor: null,
    })
    expect(pageHunks({ hunks, cursor: 5, limit: 10 })).toStrictEqual({ hunks: [], nextCursor: null })
  })
})
