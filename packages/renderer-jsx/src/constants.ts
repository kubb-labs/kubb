import type { ElementNames } from './types.ts'

/**
 * Name used for text-node entries in the virtual DOM.
 */
export const TEXT_NODE_NAME = '#text' as const

/**
 * Set of all element names recognized by the Kubb renderer.
 * Used to distinguish Kubb-owned elements from unrecognized or text nodes during tree traversal.
 */
export const nodeNames = new Set<ElementNames>([
  'kubb-export',
  'kubb-file',
  'kubb-source',
  'kubb-import',
  'kubb-function',
  'kubb-arrow-function',
  'kubb-const',
  'kubb-type',
  'kubb-jsx',
  'kubb-text',
  'kubb-root',
  'kubb-app',
  'br',
  'indent',
  'dedent',
] as const)
