import type { RootNode } from '@kubb/ast/types'
import { deflateSync, inflateSync } from 'fflate'
import { x } from 'tinyexec'
import type { DevtoolsOptions } from './types.ts'

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
 * Constructs the Kubb Studio URL for the given `RootNode`.
 * When `options.ast` is `true`, navigates to the AST inspector (`/ast`).
 * The `root` is encoded and attached as the `?root=` query parameter so Studio
 * can decode and render it without a round-trip to any server.
 */
export function getStudioUrl(root: RootNode, studioUrl: string, options: DevtoolsOptions = {}): string {
  const baseUrl = studioUrl.replace(/\/$/, '')
  const path = options.ast ? '/ast' : ''

  return `${baseUrl}${path}?root=${encodeAst(root)}`
}

/**
 * Opens the Kubb Studio URL for the given `RootNode` in the default browser —
 *
 * Falls back to printing the URL if the browser cannot be launched.
 */
export async function openInStudio(root: RootNode, studioUrl: string, options: DevtoolsOptions = {}): Promise<void> {
  const url = getStudioUrl(root, studioUrl, options)

  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]

  try {
    await x(cmd, args)
  } catch {
    console.log(`\n  ${url}\n`)
  }
}
