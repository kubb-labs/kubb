import { describe, expect, test } from 'vitest'
import { buildJSDoc } from '@kubb/core/utils'
import { getComments } from './getComments.ts'
import type { Operation } from '@kubb/oas'

describe('JSDoc with line breaks integration', () => {
  test('should generate proper JSDoc with multi-line description', () => {
    const operation = {
      getDescription() {
        return 'This operation retrieves test data.\n\nIt supports the following features:\n- Feature 1\n- Feature 2\n- Feature 3\n\nUse this endpoint carefully.'
      },
      getSummary() {
        return 'Get test data\nThis summary spans multiple lines'
      },
      path: '/test',
      isDeprecated() {
        return false
      },
    } as Operation

    const comments = getComments(operation)
    const jsdoc = buildJSDoc(comments)

    // Verify that comments are split properly (empty lines are filtered out)
    expect(comments).toEqual([
      '@description This operation retrieves test data.',
      'It supports the following features:',
      '- Feature 1',
      '- Feature 2',
      '- Feature 3',
      'Use this endpoint carefully.',
      '@summary Get test data',
      'This summary spans multiple lines',
      '{@link /test}',
    ])

    // Verify JSDoc output has proper formatting
    expect(jsdoc).toBe(
      '/**\n' +
        '   * @description This operation retrieves test data.\n' +
        '   * It supports the following features:\n' +
        '   * - Feature 1\n' +
        '   * - Feature 2\n' +
        '   * - Feature 3\n' +
        '   * Use this endpoint carefully.\n' +
        '   * @summary Get test data\n' +
        '   * This summary spans multiple lines\n' +
        '   * {@link /test}\n' +
        '   */\n' +
        '  ',
    )
  })

  test('should handle CRLF line breaks', () => {
    const operation = {
      getDescription() {
        return 'Line 1\r\nLine 2\r\nLine 3'
      },
      getSummary() {
        return undefined
      },
      path: undefined,
      isDeprecated() {
        return false
      },
    } as Operation

    const comments = getComments(operation)
    expect(comments).toEqual(['@description Line 1', 'Line 2', 'Line 3'])

    const jsdoc = buildJSDoc(comments)
    expect(jsdoc).toBe('/**\n   * @description Line 1\n   * Line 2\n   * Line 3\n   */\n  ')
  })
})
