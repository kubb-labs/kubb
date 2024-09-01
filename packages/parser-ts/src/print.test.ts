import { format } from './format.ts'
import { print } from './print.ts'

describe('print', () => {
  test('print text', () => {
    const source = `
    // comment that should be removed
    const test = 2;
    `
    const text = print([], { source })
    expect(format(text)).toStrictEqual(
      format(
        `
      // comment that should be removed
      const test = 2;
      `,
      ),
    )
  })

  test('remove comments from text', () => {
    const source = `
    // comment that should be removed
    const test = 2;
    `
    const text = print([], { removeComments: true, source })
    expect(format(text)).toMatchSnapshot()
  })

  test('keep \n', () => {
    const source = `
    /**
     * Some comments
     */

    const test = 2;

    const test = 3;
    `
    const text = print([], { source, noEmitHelpers: false })
    expect(format(text)).toMatchSnapshot()
  })
})
