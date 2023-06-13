import { throttle } from './throttle.ts'

describe('throttle', () => {
  test('if throttle can be called', () => {
    const fnMock = vi.fn(console.log)

    const [run] = throttle(fnMock, 100)
    expect(fnMock).not.toBeCalled()

    run()

    expect(run).toBeDefined()
    expect(fnMock).toBeCalled()
  })
})
