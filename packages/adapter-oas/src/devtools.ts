import type { RootNode } from '@kubb/ast/types'

export const DEFAULT_STUDIO_URL = 'https://studio.kubb.dev'

export type DevtoolsOptions = {
  /**
   * Override the Kubb Studio base URL.
   * @default 'https://studio.kubb.dev'
   */
  studioUrl?: string
}

/**
 * Encodes a `RootNode` as a URL-safe base64url string.
 * Use {@link decodeAst} (in the browser) or `JSON.parse(Buffer.from(encoded, 'base64url').toString())` to reverse.
 */
export function encodeAst(root: RootNode): string {
  return Buffer.from(JSON.stringify(root)).toString('base64url')
}

/**
 * Returns the Kubb Studio URL for the given `RootNode`.
 * Open it in a browser to inspect the AST visually.
 */
export function getAstUrl(root: RootNode, options: DevtoolsOptions = {}): string {
  const baseUrl = (options.studioUrl ?? DEFAULT_STUDIO_URL).replace(/\/$/, '')
  const encoded = encodeAst(root)
  return `${baseUrl}/ast?root=${encoded}`
}

/**
 * Logs the Kubb Studio URL for the given `RootNode` so you can open it in a
 * browser and inspect the AST visually
 *
 * Use this in tests or during development:
 *
 * @example
 * ```ts
 * import { logAst } from '@kubb/adapter-oas'
 *
 * it('builds correct AST', () => {
 *   const root = parser.buildAst(...)
 *   logAst(root) // prints: https://studio.kubb.dev/ast?root=...
 *   expect(root.schemas).toHaveLength(5)
 * })
 * ```
 */
export function logAst(root: RootNode, options: DevtoolsOptions = {}): void {
  const url = getAstUrl(root, options)

  console.log(`\n  ${url}\n`)
}
