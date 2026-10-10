import { define } from 'gunshi'

/** The runner is imported when the command runs, so listing `kubb --help` never loads `@kubb/adapter-oas`. */
export const command = define({
  name: 'validate',
  description:
    'Parse and validate an OpenAPI/Swagger file for structural correctness. Reports schema errors, missing required fields, and malformed references. Use this before running generate to catch spec issues early.',
  examples: ['kubb validate ./openapi.yaml', 'kubb validate https://petstore3.swagger.io/api/v3/openapi.json'].join('\n'),
  args: {
    input: {
      type: 'positional',
      description: 'Path or URL to the OpenAPI/Swagger file to validate',
      required: true,
    },
  },
  async run({ values }) {
    const { run } = await import('../runners/validate/run.ts')
    await run({ input: values.input })
  },
})
