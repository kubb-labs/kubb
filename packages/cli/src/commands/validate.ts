import { defineCommand } from '@internals/utils'
import { version } from '../../package.json'

export const command = defineCommand({
  name: 'validate',
  description:
    'Parse and validate an OpenAPI/Swagger file for structural correctness. Reports schema errors, missing required fields, and malformed references. Use this before running generate to catch spec issues early.',
  examples: ['kubb validate --input ./openapi.yaml', 'kubb validate --input https://petstore3.swagger.io/api/v3/openapi.json'],
  options: {
    input: {
      type: 'string',
      description: 'Path or URL to the OpenAPI/Swagger file to validate',
      short: 'i',
      required: true,
    },
  },
  async run({ values }) {
    const { run } = await import('../runners/validate/run.ts')

    await run({ input: values.input, version })
  },
})
