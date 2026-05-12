import { defineCommand } from '@internals/utils'
import { version } from '../../package.json'

export const command = defineCommand({
  name: 'init',
  description:
    'Scaffold a kubb.config.ts and install plugins for code generation from an OpenAPI spec. Run without flags for interactive setup, or pass --input, --output, and --plugins to skip the prompts.',
  examples: [
    'kubb init',
    'kubb init --yes',
    'kubb init --input ./openapi.yaml --output ./src/gen --plugins plugin-ts,plugin-zod',
    'kubb init --plugins plugin-ts,plugin-client,plugin-react-query',
  ],
  options: {
    yes: {
      type: 'boolean',
      description: 'Skip prompts and use default options',
      short: 'y',
      default: false,
    },
    input: {
      type: 'string',
      description: 'Path to the OpenAPI specification',
      short: 'i',
      hint: 'path',
    },
    output: {
      type: 'string',
      description: 'Output directory for generated files',
      short: 'o',
      hint: 'path',
    },
    plugins: {
      type: 'string',
      description:
        'Comma-separated list of plugins to use (plugin-ts, plugin-client, plugin-react-query, plugin-vue-query, plugin-zod, plugin-faker, plugin-msw, plugin-cypress, plugin-mcp, plugin-redoc)',
      hint: 'plugin-ts,plugin-zod,...',
    },
  },
  async run({ values }) {
    const { run } = await import('../runners/init/run.ts')

    await run({
      yes: values.yes,
      version,
      input: values.input,
      output: values.output,
      plugins: values.plugins,
    })
  },
})
