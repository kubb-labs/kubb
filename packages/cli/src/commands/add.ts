import { define } from 'gunshi'
import { configArg } from './shared.ts'

export const command = define({
  name: 'add',
  description:
    'Install a plugin, adapter, or parser from the Kubb registry at its reviewed version. A plugin is added to kubb.config.ts, an adapter or parser prints the code to add. Reads KUBB_REGISTRY to use another registry.',
  examples: ['kubb add plugin-zod', 'kubb add kubb-labs/plugin-react-query', 'kubb add acme/plugin-x --yes', 'kubb add plugin-zod --no-install'].join('\n'),
  toKebab: true,
  args: {
    id: {
      type: 'positional',
      description: 'Registry id: owner/slug, or a slug for an official extension',
      required: true,
    },
    ...configArg,
    yes: {
      type: 'boolean',
      description: 'Skip the confirmation',
      short: 'y',
      default: false,
    },
    install: {
      type: 'boolean',
      description: 'Install the package. Pass --no-install to only edit the config',
      negatable: true,
      default: true,
    },
  },
  async run({ values }) {
    const { run } = await import('../runners/add/run.ts')
    await run({ id: values.id, configPath: values.config, yes: values.yes, install: values.install })
  },
})
