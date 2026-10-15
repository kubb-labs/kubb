import { structuredPatch, type StructuredPatchHunk } from 'diff'
import type { DiffHunk } from './protocol.ts'

const CONTEXT_LINES = 3
// Past this, the line diff gives way to `replaceHunk`.
const DIFF_TIMEOUT_MS = 3_000

// Async mode, so a large file does not block the socket's heartbeat.
export function diffHunks(before: string, after: string): Promise<Array<StructuredPatchHunk>> {
  return new Promise((resolve) => {
    structuredPatch('', '', before, after, undefined, undefined, {
      context: CONTEXT_LINES,
      timeout: DIFF_TIMEOUT_MS,
      callback: (patch) => resolve(patch?.hunks ?? replaceHunk(before, after)),
    })
  })
}

const splitLines = (text: string) => (text === '' ? [] : text.replace(/\n$/, '').split('\n'))

// Linear fallback for files that differ too much to diff in time: one hunk replaces everything between the shared first and last lines.
export function replaceHunk(before: string, after: string): Array<StructuredPatchHunk> {
  const a = splitLines(before)
  const b = splitLines(after)
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let end = 0
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++
  if (start + end === a.length && start + end === b.length) return []

  const from = Math.max(0, start - CONTEXT_LINES)
  const tail = Math.min(end, CONTEXT_LINES)
  const lines = [
    ...a.slice(from, start).map((line) => ` ${line}`),
    ...a.slice(start, a.length - end).map((line) => `-${line}`),
    ...b.slice(start, b.length - end).map((line) => `+${line}`),
    ...a.slice(a.length - end, a.length - end + tail).map((line) => ` ${line}`),
  ]
  return [{ oldStart: from + 1, oldLines: a.length - end + tail - from, newStart: from + 1, newLines: b.length - end + tail - from, lines }]
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
