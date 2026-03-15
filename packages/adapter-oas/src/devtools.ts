import type { RootNode } from '@kubb/ast/types'
import { deflateSync, inflateSync } from 'fflate'

/**
 * Default Kubb Studio base URL used when no `studioUrl` override is provided.
 */
export const DEFAULT_STUDIO_URL = 'https://studio.kubb.dev'

export type DevtoolsOptions = {
  /**
   * Override the Kubb Studio base URL.
   * @default 'https://studio.kubb.dev'
   */
  studioUrl?: string
}

/**
 * Encodes a `RootNode` as a compressed, URL-safe string.
 *
 * The JSON representation is deflate-compressed with {@link deflateSync} before
 * base64url encoding, which typically reduces payload size by 70–80 % and
 * keeps URLs well within browser and server path-length limits.
 *
 * Use {@link decodeAst} to reverse.
 */
export function encodeAst(root: RootNode): string {
  const compressed = deflateSync(new TextEncoder().encode(JSON.stringify(root)))
  return Buffer.from(compressed).toString('base64url')
}

/**
 * Decodes a `RootNode` from a string produced by {@link encodeAst}.
 *
 * Works in both Node.js and the browser — no streaming APIs required.
 */
export function decodeAst(encoded: string): RootNode {
  const bytes = Buffer.from(encoded, 'base64url')
  return JSON.parse(new TextDecoder().decode(inflateSync(bytes))) as RootNode
}

/**
 * Constructs the Kubb Studio URL for visual AST inspection.
 * The `root` is encoded and attached as the `?root=` query parameter so Studio
 * can decode and render it without a round-trip to any server.
 */
export function getAstUrl(root: RootNode, options: DevtoolsOptions = {}): string {
  const baseUrl = (options.studioUrl ?? DEFAULT_STUDIO_URL).replace(/\/$/, '')
  return `${baseUrl}/ast?root=${encodeAst(root)}`
}

/**
 * Prints the Kubb Studio URL for the given `RootNode` — inspired by
 * [testing-playground](https://testing-playground.com/).
 *
 * Drop this call next to an assertion during development or in a failing test
 * to get an instantly-clickable link for visual debugging.
 */
export function logAst(root: RootNode, options: DevtoolsOptions = {}): void {
  console.log(`\n  ${getAstUrl(root, options)}\n`)
}
