import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateConfigFile, KUBB_CONFIG_FILENAME } from '@internals/shared'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'

const initSchema = v.object({
  inputPath: v.optional(
    v.pipe(v.string(), v.minLength(1), v.description('Path or URL of the OpenAPI spec, written to the config as `input` (default: ./openapi.yaml)')),
  ),
  outputPath: v.optional(
    v.pipe(v.string(), v.minLength(1), v.description('Directory for the generated files, written to the config as `output.path` (default: ./src/gen)')),
  ),
})

export const initTool = defineTool(
  {
    name: 'kubb_init',
    title: 'Create a Kubb config',
    description:
      'Create a kubb.config.ts with an empty plugins array in the working directory, without prompts. Use it once, to set up Kubb in a project that has no Kubb config yet. Do not use it to change an existing config: it returns an error when kubb.config.ts exists, and it never overwrites one. It installs no packages and adds no plugins, so call `kubb_add` for each plugin afterwards, then `kubb_generate`. Returns the name of the file it created and the next steps.',
    schema: initSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ inputPath = './openapi.yaml', outputPath = './src/gen' }) => {
    const dest = path.join(process.cwd(), KUBB_CONFIG_FILENAME)
    if (fs.existsSync(dest)) {
      return tool.error(`${KUBB_CONFIG_FILENAME} already exists at ${dest}. Edit that file, or delete it before calling kubb_init again.`)
    }
    fs.writeFileSync(dest, generateConfigFile({ inputPath, outputPath }), 'utf-8')
    return tool.text(
      `Created ${KUBB_CONFIG_FILENAME}\n\nInstall Kubb:\n  npm install kubb\n\nAdd each plugin with its registry id, which installs it and adds it to the config. Call the kubb_add tool, or run:\n  npx kubb add plugin-ts --yes\n\nThen call the kubb_generate tool, or run:\n  npx kubb generate`,
    )
  },
)
