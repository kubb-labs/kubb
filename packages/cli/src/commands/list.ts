import { define } from 'gunshi'

export const command = define({
  name: 'list',
  description:
    'List the installed Kubb extensions: their registry id, package, installed version, the version the Kubb registry pins, and whether an update exists.',
  examples: 'kubb list',
  async run() {
    const { run } = await import('../runners/list/run.ts')
    await run()
  },
})
