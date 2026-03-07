import { defineCommand, renderHelp } from '../cli/index.ts'
import { version } from '../../package.json'
import { runValidate } from '../runners/validate.ts'

export const command = defineCommand({
  name: 'validate',
  description: 'Validate a Swagger/OpenAPI file',
  options: {
    input: {
      type: 'string',
      description: 'Path to Swagger/OpenAPI file',
      short: 'i',
      required: true,
    },
  },
  async run({ values }) {
    if (!values['input']) {
      console.error('Error: --input <path> is required')
      renderHelp(command)
      process.exit(1)
    }

    await runValidate({ input: values['input'] as string, version })
  },
})
