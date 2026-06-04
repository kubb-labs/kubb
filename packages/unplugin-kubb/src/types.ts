import type { UserConfig } from '@kubb/core'

export type Options = {
  /**
   * Kubb config passed to the unplugin entry point.
   */
  config?: UserConfig
  /**
   * Serve generated code as in-memory `kubb:gen` virtual modules instead of writing it to disk, and
   * hot-reload it when the input spec changes (Vite only). Import the root barrel from `kubb:gen`, or
   * a single file via `kubb:gen/<path>` (relative to the output path).
   *
   * Generation runs into memory, so the output directory stays empty. Other bundlers still resolve
   * the virtual modules but do not hot-reload them. Types are loosely typed in this mode; see the
   * `unplugin-kubb/virtual` ambient declaration.
   *
   * @default false
   */
  virtual?: boolean
}
