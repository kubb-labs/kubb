import { diffArrays, type StructuredPatchHunk } from 'diff'
import type { DiffHunk } from './protocol.ts'

const CONTEXT_LINES = 3
// Past this, each remaining region shows as one replace block.
const DIFF_TIMEOUT_MS = 1_000

type Op = { type: ' ' | '-' | '+'; line: string }

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

// Patience-style anchoring: lines that occur once in each file, in the same order, split the diff into small
// regions that Myers handles fast. One diff over the whole file grows with lines times changes and stalls on large specs.
function diffLines(before: Array<string>, after: Array<string>, deadline: number): Array<Op> {
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

  const ops: Array<Op> = []
  let i = 0
  let j = 0
  for (const [anchorBefore, anchorAfter] of [...anchors, [before.length, after.length] as const]) {
    const removed = before.slice(i, anchorBefore)
    const added = after.slice(j, anchorAfter)
    const changes = diffArrays(removed, added, { timeout: Math.max(0, deadline - Date.now()) }) ?? [
      { removed: true, added: false, value: removed },
      { removed: false, added: true, value: added },
    ]
    for (const change of changes) {
      for (const line of change.value) ops.push({ type: change.added ? '+' : change.removed ? '-' : ' ', line })
    }
    if (anchorBefore < before.length) ops.push({ type: ' ', line: before[anchorBefore]! })
    i = anchorBefore + 1
    j = anchorAfter + 1
  }
  return ops
}

export function diffHunks(before: string, after: string, timeout = DIFF_TIMEOUT_MS): Array<StructuredPatchHunk> {
  const ops = diffLines(splitLines(before), splitLines(after), Date.now() + timeout)

  // Each change shows with its context; ranges that touch merge into one hunk.
  const ranges: Array<[number, number]> = []
  for (const [index, op] of ops.entries()) {
    if (op.type === ' ') continue
    const last = ranges.at(-1)
    const start = Math.max(0, index - CONTEXT_LINES)
    const end = Math.min(ops.length - 1, index + CONTEXT_LINES)
    if (last && start <= last[1] + 1) last[1] = end
    else ranges.push([start, end])
  }

  const hunks: Array<StructuredPatchHunk> = []
  let oldLine = 0
  let newLine = 0
  let index = 0
  for (const [start, end] of ranges) {
    for (; index < start; index++) {
      if (ops[index]!.type !== '+') oldLine++
      if (ops[index]!.type !== '-') newLine++
    }
    const slice = ops.slice(start, end + 1)
    const oldLines = slice.filter((op) => op.type !== '+').length
    const newLines = slice.filter((op) => op.type !== '-').length
    // Unified diff numbers an empty side by the line before it.
    hunks.push({
      oldStart: oldLines ? oldLine + 1 : oldLine,
      oldLines,
      newStart: newLines ? newLine + 1 : newLine,
      newLines,
      lines: slice.flatMap((op) => (op.line.endsWith('\n') ? [`${op.type}${op.line.slice(0, -1)}`] : [`${op.type}${op.line}`, '\\ No newline at end of file'])),
    })
  }
  return hunks
}

// A hunk the page boundary cuts through comes back in parts that share its `index`.
export function pageHunks({ hunks, cursor, limit }: { hunks: Array<StructuredPatchHunk>; cursor: number; limit: number }): {
  hunks: Array<DiffHunk>
  nextCursor: number | null
} {
  const page: Array<DiffHunk> = []
  const end = cursor + limit
  let start = 0
  for (const [index, hunk] of hunks.entries()) {
    const next = start + hunk.lines.length
    if (next > cursor && start < end) {
      page.push({ index, oldStart: hunk.oldStart, newStart: hunk.newStart, lines: hunk.lines.slice(Math.max(0, cursor - start), end - start) })
    }
    start = next
  }
  return { hunks: page, nextCursor: end < start ? end : null }
}
