import { Queue } from './Queue.ts'

describe('queue', () => {
  const queue = new Queue(1)
  test('if a new queue is executing the tasks', () => {
    const taskMock = vitest.fn()
    const taskMock2 = vitest.fn()
    queue.run(() => Promise.resolve(taskMock()))
    queue.run(() => Promise.resolve(taskMock2()))

    expect(taskMock).toBeCalled()
    expect(taskMock2).toBeCalled()
  })
})
