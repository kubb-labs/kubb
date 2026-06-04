import { gunzipSync, gzipSync } from 'node:zlib'
import type { CachedSnapshot } from '@kubb/core'

/**
 * Serializes a {@link CachedSnapshot} to and from a single gzipped blob for remote transport. All
 * methods are static, so call them as `Artifact.serialize(...)` and `Artifact.deserialize(...)`.
 * A corrupt or unknown blob deserializes to `null` so a bad artifact is treated as a cache miss
 * rather than a crash.
 */
export class Artifact {
  /**
   * Format marker stored inside the artifact so a future change to the blob layout can be detected
   * and rejected on read.
   */
  static #format = 1

  /**
   * Serializes a snapshot into a gzipped blob. File keys are sorted so the same snapshot always
   * produces identical bytes, which matters for content-addressable remote caches.
   */
  static serialize(snapshot: CachedSnapshot): Uint8Array<ArrayBuffer> {
    const files: Record<string, string> = {}
    for (const key of Object.keys(snapshot.files).sort()) {
      files[key] = snapshot.files[key]!
    }
    return new Uint8Array(gzipSync(Buffer.from(JSON.stringify({ format: Artifact.#format, files }), 'utf8')))
  }

  /**
   * Restores a snapshot from a blob produced by {@link Artifact.serialize}. Returns `null` when the
   * blob is corrupt or written in an unknown format.
   */
  static deserialize(blob: Uint8Array): CachedSnapshot | null {
    try {
      const parsed = JSON.parse(gunzipSync(blob).toString('utf8')) as { format?: number; files?: Record<string, string> }
      if (parsed.format !== Artifact.#format || !parsed.files) {
        return null
      }
      return { files: parsed.files }
    } catch {
      return null
    }
  }
}
