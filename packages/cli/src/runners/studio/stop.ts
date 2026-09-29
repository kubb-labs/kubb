import { stopWorker } from './background.ts'

export const runner = async () => {
  await stopWorker()
  console.log('Background connection stopped.')
}
