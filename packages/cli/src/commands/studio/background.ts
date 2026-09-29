import { define } from 'gunshi'
import { definition as connectDefinition } from './connect.ts'

export const definition = define({
  name: 'start',
  description: 'Keep this project connected to Kubb Studio in the background.',
  toKebab: true,
  args: connectDefinition.args,
})
export const stopDefinition = define({
  name: 'stop',
  description: "Stop this project's background connection and keep its pairing.",
})
