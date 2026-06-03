import type { InputNode } from '@kubb/ast'
import { deflateSync } from 'fflate'
import { x } from 'tinyexec'

export type DevtoolsOptions = {
  /**
   * Open the AST inspector in Kubb Studio (`/ast`). Defaults to the main Studio page.
   * @default false
   */
  ast?: boolean
}

/**
 * Encodes an `InputNode` as a compressed, URL-safe string.
 *
 * The JSON representation is deflate-compressed with {@link deflateSync} before
 * base64url encoding, which typically reduces payload size by 70, 80 % and
 * keeps URLs well within browser and server path-length limits.
 */
export function encodeAst(input: InputNode): string {
  const compressed = deflateSync(new TextEncoder().encode(JSON.stringify(input)))
  return Buffer.from(compressed).toString('base64url')
}

/**
 * Constructs the Kubb Studio URL for the given `InputNode`.
 * When `options.ast` is `true`, navigates to the AST inspector (`/ast`).
 * The `input` is encoded and attached as the `?root=` query parameter so Studio
 * can decode and render it without a round-trip to any server.
 */
export function getStudioUrl(input: InputNode, studioUrl: string, options: DevtoolsOptions = {}): string {
  const baseUrl = studioUrl.replace(/\/$/, '')
  const path = options.ast ? '/ast' : ''

  return `${baseUrl}${path}?root=${encodeAst(input)}`
}

/**
 * Opens the Kubb Studio URL for the given `InputNode` in the default browser,  *
 * Falls back to printing the URL if the browser cannot be launched.
 */
export async function openInStudio(input: InputNode, studioUrl: string, options: DevtoolsOptions = {}): Promise<void> {
  const url = getStudioUrl(input, studioUrl, options)

  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]

  try {
    await x(cmd, args)
  } catch {
    console.log(`\n  ${url}\n`)
  }
}
