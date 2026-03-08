import { version } from '../../package.json'
import { defineCommand } from '../cli/index.ts'

export const command = defineCommand({
  name: 'validate',
  description: 'Validate a Swagger/OpenAPI file',
  options: {
    input: { type: 'string', description: 'Path to Swagger/OpenAPI file', short: 'i', required: true },
  },
  async run({ values }) {
    const { runValidate } = await import('../runners/validate.ts')

    await runValidate({ input: values.input, version })
  },
})
