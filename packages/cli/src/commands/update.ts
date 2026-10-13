import { define } from 'gunshi'
import { yesArg } from './shared.ts'

export const command = define({
  name: 'update',
  description:
    'Update installed extensions to the version the Kubb registry pins. Pass ids to update only those, or --check to list the updates without installing.',
  examples: ['kubb update', 'kubb update --check', 'kubb update plugin-zod plugin-ts --yes'].join('\n'),
  args: {
    ids: {
      type: 'positional',
      description: 'Registry ids to update, all installed extensions when omitted',
      multiple: true,
    },
    check: {
      type: 'boolean',
      description: 'List the available updates without installing them',
      default: false,
    },
    ...yesArg,
  },
  async run({ values }) {
    const { run } = await import('../runners/update/run.ts')
    await run({ ids: values.ids ?? [], check: values.check, yes: values.yes })
  },
})
