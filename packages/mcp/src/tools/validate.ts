import { adapterOas } from '@kubb/adapter-oas'
import { Diagnostics } from '@kubb/core'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as z from 'zod/mini'
import { formatDiagnostics } from '../utils.ts'

const validateSchema = z.object({
  input: z.string().check(z.minLength(1), z.describe('Path or URL to the OpenAPI/Swagger specification')),
})

export const validateTool = defineTool(
  {
    name: 'validate',
    description: 'Validate an OpenAPI/Swagger specification file or URL',
    schema: validateSchema,
  },
  async ({ input }) => {
    try {
      await adapterOas().validate(input, { throwOnError: true })
      return tool.text(`Validation successful: ${input}`)
    } catch (err) {
      const serialized = Diagnostics.serialize(Diagnostics.from(err))
      return tool.error(`Validation failed:\n${formatDiagnostics([serialized])}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\``)
    }
  },
)
