import { version } from '../../package.json'
import { defineCommand } from '../cli/index.ts'
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
      throw new Error('--input <path> is required')
    }

    await runValidate({ input: values['input'] as string, version })
  },
})
