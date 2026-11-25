import type { StructuredPatchHunk } from 'diff'
import type { DiffHunk } from './protocol.ts'

// Pages hold whole hunks, so a hunk is cut only when it alone is longer than a page. Its parts share its `index`.
export function pageHunks({ hunks, cursor, limit }: { hunks: Array<StructuredPatchHunk>; cursor: number; limit: number }): {
  hunks: Array<DiffHunk>
  nextCursor: number | null
} {
  const page: Array<DiffHunk> = []
  let used = 0
  let start = 0
  for (const [index, hunk] of hunks.entries()) {
    const offset = Math.max(0, cursor - start)
    start += hunk.lines.length
    const remaining = hunk.lines.length - offset
    if (remaining <= 0) continue
    if (used > 0 && remaining > limit - used) break
    let take = Math.min(remaining, limit - used)
    // A `\ No newline` marker stays with its line, so no part starts with one.
    if (hunk.lines[offset + take]?.startsWith('\\')) take++
    page.push({ index, ...hunk, lines: hunk.lines.slice(offset, offset + take) })
    used += take
    if (used >= limit) break
  }
  const total = hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0)
  return { hunks: page, nextCursor: cursor + used < total ? cursor + used : null }
}
