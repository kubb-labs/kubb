import { timeout } from '../utils/timeout.ts'
import { throttle } from './throttle.ts'

describe('throttle', () => {
  test('if throttle can be called', async () => {
    const fnMock = vi.fn(() => {})

    const [run, cancel] = throttle(fnMock, 100)
    expect(fnMock).not.toBeCalled()

    run()

    expect(run).toBeDefined()
    expect(fnMock).toBeCalled()
  })
})
