import path from 'node:path'

import ts, { createProgram, displayPartsToString } from 'typescript'

import { format } from '../mocks/format.ts'
import { print } from './print.ts'

describe('print', () => {
  test('print text', async () => {
    const source = `
    // comment that should be removed
    const test = 2;
    `
    const text = print([], { source })
    expect(await format(text)).toStrictEqual(
      await format(
        `
      // comment that should be removed
      const test = 2;
      `,
      ),
    )
  })

  test('remove comments from text', async () => {
    const source = `
    // comment that should be removed
    const test = 2;
    `
    const text = print([], { removeComments: true, source })
    expect(await format(text)).toMatchSnapshot()
  })

  test('keep \n', async () => {
    const source = `
    /**
     * Some comments
     */

    const test = 2;

    const test = 3;
    `
    const text = print([], { source, noEmitHelpers: false })
    expect(await format(text)).toMatchSnapshot()
  })
})
