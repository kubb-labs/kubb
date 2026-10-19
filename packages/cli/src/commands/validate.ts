import { define } from 'gunshi'
import { configArg } from './shared.ts'

/** The runner is imported when the command runs, so listing `kubb --help` never loads `@kubb/adapter-oas`. */
export const command = define({
  name: 'validate',
  description: 'Check a specification with the configured adapter before generating.',
  examples: ['kubb validate ./openapi.yaml', 'kubb validate https://petstore3.swagger.io/api/v3/openapi.json'].join('\n'),
  args: {
    ...configArg,
    input: {
      type: 'positional',
      description: 'Path or URL to the specification to validate',
      required: true,
    },
  },
  async run({ values }) {
    const { run } = await import('../runners/validate/run.ts')
    await run({ input: values.input, configPath: values.config })
  },
})
