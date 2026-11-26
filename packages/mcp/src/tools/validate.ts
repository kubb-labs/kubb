import process from 'node:process'
import { adapterOas } from '@kubb/adapter-oas'
import { Diagnostics } from '@kubb/core'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { formatDiagnostics } from '../utils.ts'

const validateSchema = v.object({
  inputPath: v.pipe(
    v.string(),
    v.minLength(1),
    v.description('Path or http(s) URL of the OpenAPI/Swagger specification, such as ./openapi.yaml or https://petstore3.swagger.io/api/v3/openapi.json'),
  ),
})

export const validateTool = defineTool(
  {
    name: 'kubb_validate',
    title: 'Validate an OpenAPI spec',
    description:
      'Validate an OpenAPI or Swagger specification from a file path or URL. Use it before `kubb_init` or `kubb_generate` to confirm that Kubb can read the spec, or to find out why a generation failed on its input. It only reads the spec: it writes no files and does not read kubb.config.ts, so it does not check the config or the plugins. A `$ref` may read local files only inside the working directory. Returns a success line, or an error with each diagnostic as text and JSON: its code, location, cause, fix, and docs link.',
    schema: validateSchema,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  },
  async ({ inputPath }) => {
    try {
      // The AI client supplies the spec, so a `$ref` may only read files inside the working directory.
      await adapterOas().validate(inputPath, { throwOnError: true, fileRefs: [process.cwd()] })
      return tool.text(`Validation successful: ${inputPath}`)
    } catch (err) {
      const diagnostic = Diagnostics.from(err)
      const serialized = Diagnostics.serialize(diagnostic)
      return tool.error(`Validation failed:\n${formatDiagnostics([diagnostic])}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\``)
    }
  },
)
