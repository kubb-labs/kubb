import { structuredPatch, type StructuredPatchHunk } from 'diff'
import type { DiffHunk } from './protocol.ts'

const CONTEXT_LINES = 3
// Generated files that differ this much would not read as a diff anyway.
const DIFF_TIMEOUT_MS = 10_000

/**
 * The hunks between two versions of a file, or `undefined` when they take too long to diff. Runs
 * in async mode, so a large file does not block the socket's heartbeat.
 */
export function diffHunks(before: string, after: string): Promise<Array<StructuredPatchHunk> | undefined> {
  return new Promise((resolve) => {
    structuredPatch('', '', before, after, undefined, undefined, {
      context: CONTEXT_LINES,
      timeout: DIFF_TIMEOUT_MS,
      callback: (patch) => resolve(patch?.hunks),
    })
  })
}

/**
 * The `limit` patch lines from line `cursor`, counted across all hunks. A hunk the page boundary
 * cuts through comes back in parts that share its `index`.
 */
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
