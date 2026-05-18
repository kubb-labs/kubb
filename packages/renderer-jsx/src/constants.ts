import type { ElementNames } from './types.ts'

/**
 * Name used for text-node entries in the virtual DOM.
 */
export const TEXT_NODE_NAME = '#text' as const

export const KUBB_FILE = 'kubb-file' as const
export const KUBB_SOURCE = 'kubb-source' as const
export const KUBB_EXPORT = 'kubb-export' as const
export const KUBB_IMPORT = 'kubb-import' as const
export const KUBB_FUNCTION = 'kubb-function' as const
export const KUBB_ARROW_FUNCTION = 'kubb-arrow-function' as const
export const KUBB_CONST = 'kubb-const' as const
export const KUBB_TYPE = 'kubb-type' as const
export const KUBB_JSX = 'kubb-jsx' as const

/**
 * Set of all element names recognized by the Kubb renderer.
 * Used to distinguish Kubb-owned elements from unrecognized or text nodes during tree traversal.
 */
export const nodeNames = new Set<ElementNames>([
  KUBB_EXPORT,
  KUBB_FILE,
  KUBB_SOURCE,
  KUBB_IMPORT,
  KUBB_FUNCTION,
  KUBB_ARROW_FUNCTION,
  KUBB_CONST,
  KUBB_TYPE,
  KUBB_JSX,
  'kubb-text',
  'kubb-root',
  'kubb-app',
  'br',
  'indent',
  'dedent',
] as const)
