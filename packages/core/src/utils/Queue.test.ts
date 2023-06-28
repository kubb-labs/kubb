import { Queue } from './Queue.ts'

describe('queue', () => {
  const queue = new Queue(1)
  test('if a new queue is executing the tasks', () => {
    const taskMock = vi.fn()
    const taskMock2 = vi.fn()
    queue.run(() => Promise.resolve(taskMock()))
    queue.run(() => Promise.resolve(taskMock2()))

    expect(taskMock).toHaveBeenCalled()
    expect(taskMock2).toHaveBeenCalled()
  })
})
