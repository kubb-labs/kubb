import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import { validateSchema } from '../schemas/validateSchema.ts'

export const validateTool = defineTool(
  {
    name: 'validate',
    description: 'Validate an OpenAPI/Swagger specification file or URL',
    schema: validateSchema,
  },
  async ({ input }) => {
    let mod: typeof import('@kubb/adapter-oas')
    try {
      mod = await import('@kubb/adapter-oas')
    } catch {
      return tool.error('The validate tool requires @kubb/adapter-oas.\nInstall: npm install @kubb/adapter-oas')
    }
    try {
      await mod.adapterOas().validate(input, { throwOnError: true })
      return tool.text(`Validation successful: ${input}`)
    } catch (err) {
      return tool.error(`Validation failed:\n${err instanceof Error ? err.message : String(err)}`)
    }
  },
)
