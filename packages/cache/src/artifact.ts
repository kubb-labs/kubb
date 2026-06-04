import { gunzipSync, gzipSync } from 'node:zlib'
import type { CachedSnapshot } from '@kubb/core'

/**
 * Format marker stored inside the artifact so a future change to the blob layout
 * can be detected and rejected on read.
 */
const ARTIFACT_FORMAT = 1

/**
 * Serializes a {@link CachedSnapshot} into a single gzipped blob for remote
 * transport. File keys are sorted so the same snapshot always produces identical
 * bytes — important for content-addressable remote caches.
 */
export function serializeArtifact(snapshot: CachedSnapshot): Uint8Array<ArrayBuffer> {
  const files: Record<string, string> = {}
  for (const key of Object.keys(snapshot.files).sort()) {
    files[key] = snapshot.files[key]!
  }
  return new Uint8Array(gzipSync(Buffer.from(JSON.stringify({ format: ARTIFACT_FORMAT, files }), 'utf8')))
}

/**
 * Restores a {@link CachedSnapshot} from a blob produced by
 * {@link serializeArtifact}. Returns `null` when the blob is corrupt or written in
 * an unknown format, so a bad artifact is treated as a cache miss rather than a
 * crash.
 */
export function deserializeArtifact(blob: Uint8Array): CachedSnapshot | null {
  try {
    const parsed = JSON.parse(gunzipSync(blob).toString('utf8')) as { format?: number; files?: Record<string, string> }
    if (parsed.format !== ARTIFACT_FORMAT || !parsed.files) {
      return null
    }
    return { files: parsed.files }
  } catch {
    return null
  }
}
