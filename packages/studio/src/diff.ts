import { structuredPatch, type StructuredPatchHunk } from 'diff'
import type { DiffHunk, DiffStats } from './protocol.ts'

const CONTEXT_LINES = 3
// Past this, each remaining segment shows as one replace block.
const DIFF_TIMEOUT_MS = 1_000

// Lines keep their `\n`, so a last line without one differs from the same line with one.
const splitLines = (text: string) => (text === '' ? [] : text.split(/(?<=\n)/))

// Longest increasing subsequence of `values`, as indexes into it.
function longestIncreasing(values: Array<number>): Array<number> {
  const tails: Array<number> = []
  const prev: Array<number> = []
  for (const [index, value] of values.entries()) {
    let low = 0
    let high = tails.length
    while (low < high) {
      const mid = (low + high) >> 1
      if (values[tails[mid]!]! < value) low = mid + 1
      else high = mid
    }
    prev[index] = low > 0 ? tails[low - 1]! : -1
    tails[low] = index
  }
  const result: Array<number> = []
  for (let index = tails.at(-1) ?? -1; index !== -1; index = prev[index]!) result.push(index)
  return result.reverse()
}

// Where to cut both files so each segment diffs on its own: inside each unchanged stretch that keeps a full
// context on both sides, so no hunk crosses a cut. Lines that occur once in each file, in the same order, find them.
function cutPoints(before: Array<string>, after: Array<string>): Array<[number, number]> {
  const counts = new Map<string, { before: number; after: number; index: number }>()
  for (const [index, line] of before.entries()) {
    const count = counts.get(line)
    if (count) count.before++
    else counts.set(line, { before: 1, after: 0, index })
  }
  const afterIndex = new Map<string, number>()
  for (const [index, line] of after.entries()) {
    const count = counts.get(line)
    if (!count) continue
    count.after++
    afterIndex.set(line, index)
  }
  // Map order is insertion order, so these are sorted by their index in `before`.
  const unique = [...counts]
    .filter(([, count]) => count.before === 1 && count.after === 1)
    .map(([line, count]) => [count.index, afterIndex.get(line)!] as const)
  const anchors = longestIncreasing(unique.map(([, index]) => index)).map((index) => unique[index]!)

  const cuts: Array<[number, number]> = [[0, 0]]
  let run = { before: 0, after: 0, length: 0 }
  const closeRun = () => {
    if (run.length > 2 * CONTEXT_LINES) cuts.push([run.before + CONTEXT_LINES, run.after + CONTEXT_LINES])
  }
  let i = 0
  let j = 0
  for (const [anchorBefore, anchorAfter] of anchors) {
    // The lines between two anchors are unchanged when both sides hold the same lines.
    const unchanged = anchorBefore - i === anchorAfter - j && before.slice(i, anchorBefore).every((line, offset) => line === after[j + offset])
    if (unchanged && run.length && run.before + run.length === i) {
      run.length += anchorBefore - i + 1
    } else {
      closeRun()
      run = unchanged ? { before: i, after: j, length: anchorBefore - i + 1 } : { before: anchorBefore, after: anchorAfter, length: 1 }
    }
    i = anchorBefore + 1
    j = anchorAfter + 1
  }
  closeRun()
  cuts.push([before.length, after.length])
  return cuts
}

const patchLines = (prefix: string, lines: Array<string>) =>
  lines.flatMap((line) => (line.endsWith('\n') ? [`${prefix}${line.slice(0, -1)}`] : [`${prefix}${line}`, '\\ No newline at end of file']))

// A segment with no time left to diff shows as one block that replaces everything between its shared first and last lines.
function replaceHunk(before: Array<string>, after: Array<string>): Array<StructuredPatchHunk> {
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) start++
  let end = 0
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++
  if (start + end === before.length && start + end === after.length) return []

  const from = Math.max(0, start - CONTEXT_LINES)
  const to = before.length - end + Math.min(end, CONTEXT_LINES)
  const oldLines = to - from
  const newLines = oldLines + after.length - before.length
  const lines = [
    ...patchLines(' ', before.slice(from, start)),
    ...patchLines('-', before.slice(start, before.length - end)),
    ...patchLines('+', after.slice(start, after.length - end)),
    ...patchLines(' ', before.slice(before.length - end, to)),
  ]
  // Same numbering as `structuredPatch`, which starts an empty side at line 1 too.
  return [{ oldStart: from + 1, oldLines, newStart: from + 1, newLines, lines }]
}

// One Myers diff over a whole file grows with lines times changes and stalls on large specs, so each segment
// between cuts is diffed on its own.
export function diffHunks(before: string, after: string, timeout = DIFF_TIMEOUT_MS): { hunks: Array<StructuredPatchHunk>; stats: DiffStats } {
  const beforeLines = splitLines(before)
  const afterLines = splitLines(after)
  const cuts = cutPoints(beforeLines, afterLines)
  const deadline = Date.now() + timeout

  const hunks: Array<StructuredPatchHunk> = []
  let coarse = false
  for (const [index, [beforeStart, afterStart]] of cuts.slice(0, -1).entries()) {
    const [beforeEnd, afterEnd] = cuts[index + 1]!
    const segmentBefore = beforeLines.slice(beforeStart, beforeEnd)
    const segmentAfter = afterLines.slice(afterStart, afterEnd)
    const patch = structuredPatch('', '', segmentBefore.join(''), segmentAfter.join(''), undefined, undefined, {
      context: CONTEXT_LINES,
      timeout: Math.max(0, deadline - Date.now()),
    })
    if (!patch) coarse = true
    for (const hunk of patch?.hunks ?? replaceHunk(segmentBefore, segmentAfter)) {
      hunks.push({ ...hunk, oldStart: hunk.oldStart + beforeStart, newStart: hunk.newStart + afterStart })
    }
  }

  const lines = hunks.flatMap((hunk) => hunk.lines)
  const stats: DiffStats = {
    additions: lines.filter((line) => line[0] === '+').length,
    deletions: lines.filter((line) => line[0] === '-').length,
    hunks: hunks.length,
    lines: lines.length,
    coarse,
  }
  return { hunks, stats }
}

// Pages hold whole hunks, so a hunk is cut only when it alone is longer than a page. Its parts share its `index`.
export function pageHunks({ hunks, cursor, limit }: { hunks: Array<StructuredPatchHunk>; cursor: number; limit: number }): {
  hunks: Array<DiffHunk>
  nextCursor: number | null
} {
  const page: Array<DiffHunk> = []
  const total = hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0)
  let used = 0
  let position = 0
  let oldEnd = 1
  for (const [index, hunk] of hunks.entries()) {
    const collapsedBefore = Math.max(0, hunk.oldStart - oldEnd)
    oldEnd = hunk.oldStart + hunk.oldLines
    const start = position
    position += hunk.lines.length
    if (position <= cursor) continue

    const offset = Math.max(0, cursor - start)
    const remaining = hunk.lines.length - offset
    if (used > 0 && remaining > limit - used) break
    const take = Math.min(remaining, limit - used)
    page.push({
      index,
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      collapsedBefore,
      offset,
      lines: hunk.lines.slice(offset, offset + take),
    })
    used += take
    if (used === limit) break
  }
  const end = cursor + used
  return { hunks: page, nextCursor: end < total ? end : null }
}
